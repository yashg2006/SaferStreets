# SaferStreets Backend Setup

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Mobile App (React Native)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────────┐
│  FastAPI Backend                                            │
│  - Route calculation                                        │
│  - Heatmap queries                                          │
│  - Segment details                                          │
│  - Incident reporting (phase 2)                             │
└────────────────┬──────────────────────┬────────────────────┘
                 │                      │
    ┌────────────▼──────────┐  ┌────────▼─────────────┐
    │  PostgreSQL + PostGIS │  │  Redis Cache         │
    │  - street_edges       │  │  - Route cache       │
    │  - safety_scores      │  │  - Rate limiting     │
    │  - incident_reports   │  │  - Session store     │
    │  - crime_aggregates   │  └──────────────────────┘
    └──────────────────────┘

    ┌─────────────────────────────────────────────┐
    │  Data Pipeline (Nightly Jobs)               │
    │  - osm_ingest.py (OSM downloads)            │
    │  - crimes_ingest.py (City crime API)        │
    │  - lights_ingest.py (City lighting data)    │
    │  - scoring.py (Compute safety scores)       │
    └─────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────┐
    │  Valhalla Routing Service (Phase 2)         │
    │  - Pedestrian-focused routing               │
    │  - Custom cost functions                    │
    └─────────────────────────────────────────────┘
```

## Quick Start (Docker Compose)

### Prerequisites
- Docker & Docker Compose
- 4GB free disk space (for initial data)

### 1. Start the stack

```bash
# Clone repo
git clone https://github.com/yashg2006/SaferStreets.git
cd SaferStreets

# Copy environment file
cp .env.example .env

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

Expected output:
```
CONTAINER ID   IMAGE                  STATUS
xxx            postgis/postgis:16     Up 5 seconds (healthy)
xxx            redis:7-alpine         Up 5 seconds (healthy)
xxx            saferstreets-api       Up 3 seconds
```

### 2. Initialize database

```bash
# Wait for PostgreSQL to be ready (5-10s)
sleep 10

# The API will auto-create tables on startup
# Verify by checking logs
docker-compose logs api | grep "Database tables initialized"
```

### 3. Ingest OSM data

The data ingest pipeline is not yet containerized. For MVP, we'll use a seed script.

```bash
# Install ingest dependencies (locally)
cd services/ingest
pip install -r requirements.txt

# Download OSM for NYC (example)
# This requires: osmium (C++ library) + Python bindings
# For development, use a smaller pre-processed extract instead:

python osm_ingest.py \
  --region "north-america/us/new-york" \
  --database-url "postgresql://saferstreets:password@localhost:5432/saferstreets" \
  --output /tmp/osm_data

# Expected output:
# - Downloading OSM extract from Geofabrik...
# - Processing OSM file...
# - Extracted 45,234 ways -> 23,456 valid edges
# - Inserted 23,456 edges into database
```

**Note**: Osmium requires compilation. For M1/ARM64, install via:
```bash
brew install osmium-tool
pip install osmium
```

### 4. Ingest crime data

```bash
python crimes_ingest.py \
  --city nyc \
  --lookback-days 90 \
  --database-url "postgresql://saferstreets:password@localhost:5432/saferstreets"

# Expected output:
# - Fetching crime data for NYC Complaint and Crime Data (last 90 days)...
# - Fetched 45,000 records
# - Parsed 28,432 valid crime records
# - Mapped 28,432/28,432 crimes to street edges
# - Stored aggregates for 5,234 edge-hour pairs
```

### 5. Compute safety scores

```bash
python scoring.py \
  --database-url "postgresql://saferstreets:password@localhost:5432/saferstreets"

# Expected output:
# - Loaded 23,456 edges
# - Loaded features for 23,456 edges
# - Computing safety scores...
# - Computed 563,744 edge-hour scores (23 hours × 24,552 edges)
# - Stored 563,744 safety scores
```

### 6. Test API

```bash
# Health check
curl http://localhost:8000/health

# Heatmap (GeoJSON)
curl "http://localhost:8000/api/heatmap?min_lng=-74.01&max_lng=-73.99&min_lat=40.71&max_lat=40.72"

# Route calculation
curl -X POST http://localhost:8000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "origin_lng": -74.005,
    "origin_lat": 40.714,
    "destination_lng": -73.998,
    "destination_lat": 40.720,
    "safe_mode": true,
    "time_bucket": 14,
    "lambda_safety": 1.5
  }'

# Segment details
curl "http://localhost:8000/api/segments/mock-edge-1?time_bucket=14"
```

### 7. View database

```bash
# Connect to PostgreSQL
psql -h localhost -U saferstreets -d saferstreets

# Check tables
\dt

# Sample queries:
SELECT COUNT(*) FROM street_edges;
SELECT COUNT(*) FROM safety_scores;
SELECT COUNT(*) FROM crime_aggregates;

# View edge data
SELECT id, name, highway_type, lit FROM street_edges LIMIT 5;

# View safety score distribution
SELECT time_bucket, AVG(score) as avg_score, MIN(score) as min_score, MAX(score) as max_score
FROM safety_scores
GROUP BY time_bucket
ORDER BY time_bucket;
```

## Development Workflow

### Code Changes

```bash
# The `api` service in docker-compose has `--reload` enabled
# So changes to services/api/main.py or models.py will auto-restart the server

# Edit files and test
vim services/api/main.py

# Tail logs
docker-compose logs -f api
```

### Database Migrations

For now, all table creation is handled by SQLAlchemy in `models.py`.
If you modify models, run:

```bash
# Restart API to trigger auto-migration
docker-compose restart api
```

For production, consider using Alembic for versioned migrations.

### Running Tests

```bash
# No tests yet; this is MVP phase 1
# Plan: Add pytest suite in phase 2

# For now, use Postman or curl for manual API testing
```

## Data Pipeline Details

### OSM Ingest (`osm_ingest.py`)

**Input**: Geofabrik OSM extracts (`.pbf` files)

**Processing**:
1. Parse OSM ways (streets) using Osmium library
2. Filter by highway type (residential, primary, pedestrian, etc.)
3. Extract geometry, speed limits, lighting tags, sidewalk info
4. Create spatial index for fast queries

**Output**: `street_edges` table with 20K-30K edges per city

**Params**:
- `--region`: Geofabrik region (e.g., "north-america/us/new-york")
- `--database-url`: PostgreSQL connection
- `--skip-download`: Use existing `.pbf` file

### Crime Ingest (`crimes_ingest.py`)

**Input**: City open data APIs (Socrata endpoints)

**Processing**:
1. Fetch historical crime records (last 90 days by default)
2. Validate geometry (lat/lng present)
3. Map each crime point to nearest street edge (buffer: 30m)
4. Aggregate counts by edge + hour-of-day

**Output**: `crime_aggregates` table with density per hour

**Supported cities**:
- NYC: 10K-15K crimes/90 days
- Chicago: 5K-8K crimes/90 days
- LA: 3K-5K crimes/90 days

**Params**:
- `--city`: nyc | chicago | la
- `--lookback-days`: Historical window (default 90)
- `--database-url`: PostgreSQL connection

### Lighting Ingest (`lights_ingest.py`) — Phase 2

Placeholder for city streetlight pole data. Some cities publish pole locations; others use OSM `lit=yes/no` tags.

### Scoring Pipeline (`scoring.py`)

**Input**: `street_edges`, `crime_aggregates`, weather (optional)

**Processing**:
1. Load all edge features (infrastructure, lighting)
2. For each edge × time bucket (0-23 hours):
   - Compute normalized scores (0-1) for:
     - Lighting (binary or confidence)
     - Crime density (inverse)
     - Infrastructure (sidewalk, crossing, speed)
     - Footfall (heuristic for time-of-day)
     - Data recency
   - Combine via weighted sum
   - Normalize via sigmoid function
   - Compute confidence (based on feature availability)
   - Extract top factors for UI

3. Store in `safety_scores` table (563K records = 23K edges × 24 hours)

**Output**: `safety_scores` with score, confidence, factors JSON

**Computation**: ~5-10 minutes for a city with 20K edges

## Database Schema

### `street_edges`
- **id**: UUID primary key
- **osm_way_id**: OpenStreetMap way ID (unique)
- **geometry**: LineString (PostGIS) — INDEXED
- **name**: Street name
- **highway_type**: residential, primary, pedestrian, etc.
- **speed_limit**: km/h
- **length_m**: meters
- **has_sidewalk**: boolean
- **has_crossing**: boolean
- **lit**: null (unknown) | true (lit) | false (unlit)

### `safety_scores`
- **id**: UUID
- **edge_id**: FK to street_edges (INDEXED)
- **time_bucket**: 0-23 (hour of day) (INDEXED)
- **score**: 0.0-1.0 float
- **confidence**: 0.0-1.0 float
- **factors_json**: JSONB with breakdown
- **updated_at**: Last refresh time

### `crime_aggregates` (Phase 1)
- **edge_id**: FK (INDEXED)
- **time_bucket**: 0-23
- **incident_count_30d**: count
- **incident_count_90d**: count
- **crime_types**: JSONB (category breakdown)
- **crime_density**: 0.0-1.0 normalized

### `incident_reports` (Phase 2)
- **id**: UUID
- **location**: POINT geometry
- **edge_id**: FK
- **category**: theft, harassment, poor_lighting, etc.
- **description**: optional text
- **photo_url**: optional S3 URL
- **verified**: boolean
- **anonymous**: boolean
- **user_id**: FK (optional)

### `users` (Phase 2)
- **id**: UUID
- **email**: unique, nullable
- **phone_number**: unique, nullable
- **analytics_opt_in**: boolean
- **incident_share_consent**: boolean

## API Endpoints (MVP)

### Health & Meta
- `GET /` — Welcome message
- `GET /health` — Liveness probe + DB check

### Routing
- `POST /api/route` — Calculate route (fastest vs. safest)
  - Request: origin, destination, safe_mode, time_bucket, lambda_safety
  - Response: route_coordinates, eta, risk_level, factors

### Map & Segments
- `GET /api/heatmap` — GeoJSON features for bbox
  - Params: min_lng, max_lng, min_lat, max_lat, time_bucket
  - Returns: FeatureCollection with safety_score, confidence per edge

- `GET /api/segments/{edge_id}` — Segment details
  - Params: time_bucket
  - Returns: score, confidence, factors, crime_density, lighting, last_updated

### Weather (Phase 2)
- `GET /api/weather` — Real-time weather + penalties

### Incidents (Phase 2)
- `POST /api/incidents` — Submit incident report
  - Request: lat, lng, category, description, photo_url, anonymous
  - Response: incident_id, status

### Admin
- `POST /admin/refresh-scores` — Trigger nightly scoring job

## Deployment

### Local Development
```bash
docker-compose up -d
```

### Staging (Railway or Render)
```bash
# Deploy via GitHub Actions (TODO: configure)
git push origin main
# GitHub Actions builds Docker image, pushes to registry, deploys to staging
```

### Production
```bash
# AWS ECS + RDS + CloudFront
# Terraform config: infra/terraform/
terraform apply -var-file=prod.tfvars
```

## Monitoring & Logging

### Logs
```bash
# Tail API logs
docker-compose logs -f api

# Tail database logs
docker-compose logs -f postgres
```

### Metrics (Phase 2)
- OpenTelemetry traces (routing latency, heatmap query time)
- Prometheus metrics (error rates, 95/99 percentile latencies)
- Sentry for error tracking

## Next Steps

### Phase 2 (after MVP)
- [ ] Valhalla routing integration (custom cost functions)
- [ ] Incident reporting & moderation
- [ ] Weather API integration
- [ ] Multi-city support (scalable data pipeline)
- [ ] ML-based scoring (LightGBM)
- [ ] Mobile app integration testing
- [ ] Performance optimization (caching, CDN)

### Phase 3
- [ ] Wearables integration
- [ ] Offline maps + cached scores
- [ ] Accessibility features
- [ ] Community features (up/downvote, badges)

## Troubleshooting

### PostgreSQL won't connect
```bash
# Check if postgres is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Reset database
docker-compose down
docker volume rm saferstreets_postgres_data
docker-compose up -d postgres
```

### Osmium installation fails
- Use pre-built binaries: `brew install osmium-tool` (macOS)
- On Linux: `apt-get install osmium-tool`
- Windows: Download from https://osmcode.org/osmium-tool/

### Crime API quota exceeded
- Socrata APIs have rate limits (~50K records/day)
- Use `--lookback-days 30` for testing instead of 90
- Stagger requests across multiple days

## References

- **PostGIS**: https://postgis.net/
- **SQLAlchemy**: https://sqlalchemy.org/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Osmium**: https://osmcode.org/
- **Socrata API**: https://dev.socrata.com/
- **OpenStreetMap**: https://www.openstreetmap.org/
