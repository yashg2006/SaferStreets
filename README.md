# SaferStreets

**Real-time street safety scores and routing for pedestrians.**

Avoid risky areas with a map that grades street safety by time-of-day, powered by crime data, lighting, foot traffic, and infrastructure. Choose routes based on speed or safety—see why each segment is scored the way it is.

## Vision

SaferStreets combines:
- **Real data**: Historical crime, lighting, pedestrian counts, infrastructure from public sources
- **Smart scoring**: Rule-based (MVP) → ML-powered (phase 2) safety model with explainability
- **Routing choice**: Toggle between fastest and safest routes; adjust the safety weight yourself
- **Privacy first**: Incident reports can be anonymous; no precise background tracking
- **Open source**: Community-driven safety, not surveillance

## Supported Cities (MVP Phase 1)

- 🗽 **New York City** (NYC OpenData)
- 🌆 **Chicago** (Chicago Data Portal)
- 🌴 **Los Angeles** (LA Open Data)

Expand to other cities by adding their crime/lighting data sources.

## Tech Stack

### Backend
- **API**: FastAPI + SQLAlchemy + Pydantic
- **Database**: PostgreSQL + PostGIS (spatial queries)
- **Cache**: Redis (rate limiting, route caching)
- **Data Pipeline**: Python ETL scripts (OSM, crime, scoring)
- **Routing**: Valhalla (phase 2)

### Mobile (Coming Phase 2)
- **Framework**: React Native + Expo
- **Maps**: MapLibre GL Native
- **State**: Riverpod
- **Router**: Expo Router

### Deployment
- **Local**: Docker Compose
- **Staging**: Railway/Render
- **Production**: AWS (RDS, ECS, CloudFront)

## Quick Start

### Docker Compose (Fastest)

```bash
git clone https://github.com/yashg2006/SaferStreets.git
cd SaferStreets

cp .env.example .env
docker-compose up -d

# Wait for services to be healthy
sleep 10

# Check health
curl http://localhost:8000/health
```

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed data ingestion steps.

### Manual Setup (Development)

```bash
# 1. Install dependencies
cd services/api
pip install -r requirements.txt

# 2. Start PostgreSQL (e.g., via Homebrew or Docker)
postgres -D /usr/local/var/postgres

# 3. Create database
createdb saferstreets
createuser saferstreets -P  # password: password

# 4. Run API
export DATABASE_URL="postgresql://saferstreets:password@localhost:5432/saferstreets"
uvicorn main:app --reload

# 5. In another terminal, ingest data (see BACKEND_SETUP.md)
```

## API Overview

```bash
# Health check
GET /health

# Calculate route
POST /api/route
{
  "origin_lng": -74.005,
  "origin_lat": 40.714,
  "destination_lng": -73.998,
  "destination_lat": 40.720,
  "safe_mode": true,
  "time_bucket": 14,
  "lambda_safety": 1.5
}

# Get heatmap (GeoJSON)
GET /api/heatmap?min_lng=-74.01&max_lng=-73.99&min_lat=40.71&max_lat=40.72&time_bucket=14

# Get segment details
GET /api/segments/{edge_id}?time_bucket=14
```

Full API docs: http://localhost:8000/docs (Swagger UI)

## Data Sources

### Static/Batch
- **OpenStreetMap** (streets, sidewalks, speed limits, lighting tags)
- **City Crime Data** (90-day historical incident counts by location)
- **Streetlight Datasets** (optional; city pole locations)
- **Pedestrian Counts** (where available; Strava, sensors)

### Dynamic
- **Weather** (precipitation, visibility — updates safety scores in real-time)
- **User Reports** (theft, harassment, poor lighting — community-driven)
- **Time of Day** (safety varies by hour; some crimes peak at night)

## Safety Scoring (Baseline)

For each street segment, we compute:

$$\text{Score} = \text{clamp}(0.05 + 0.9 \cdot \sigma(f_{\text{norm}}), 0, 1)$$

Where $f_{\text{norm}}$ is a weighted combination of:
- **Lighting** (0.25): Street lit or not
- **Crime Density** (0.30): Inverse of incident counts by hour
- **Footfall** (0.15): Pedestrian traffic (positive at night)
- **Infrastructure** (0.20): Sidewalks, crossings, speed limits
- **Recency** (0.05): Data freshness
- **Weather Penalty** (0.05): Rain, darkness, low visibility

**Confidence** reflects data availability: high if all factors present, low if sparse.

### Future: ML-Based Scoring
- Train LightGBM on historical incidents + negative samples
- Use SHAP for per-segment factor importance
- Real-time predictions per edge × time bucket

## Routing

Two cost functions:

**Fastest**: Standard travel time

**Safest**: 
$$\text{Cost}_{\text{safe}} = \text{time} + \lambda \cdot (1 - \text{safety\_score})$$

Adjust $\lambda$ (safety weight) via slider: 1.0 (balanced) to 5.0 (safety obsessed).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Mobile App (React Native + MapLibre GL)                    │
│  - Map with heatmap layer                                   │
│  - Route input + faster/safer toggle                        │
│  - Time-of-day slider                                       │
│  - Segment details + incident reports                       │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │  FastAPI Backend        │
        │  - Route + heatmap APIs │
        │  - Real-time updates    │
        │  - Auth + rate limiting │
        └────────────┬────────────┘
                     │
        ┌────────────┴─────────────────────┐
        │                                  │
    ┌───▼────────────────┐      ┌────────▼──────────┐
    │ PostgreSQL+PostGIS │      │   Redis Cache     │
    │ - Edges            │      │   - Route cache   │
    │ - Safety scores    │      │   - Rate limits   │
    │ - Incidents        │      └───────────────────┘
    │ - Crimes (agg)     │
    └────────────────────┘

    ┌───────────────────────────────────────────┐
    │  Data Pipeline (Nightly Batch Jobs)       │
    │  - osm_ingest.py                          │
    │  - crimes_ingest.py                       │
    │  - scoring.py                             │
    └───────────────────────────────────────────┘
```

## Roadmap

### ✅ Phase 1: MVP (Current)
- [x] Backend API with FastAPI
- [x] PostgreSQL + PostGIS schema
- [x] Data ingestion pipeline (OSM, crime, lighting)
- [x] Rule-based safety scoring
- [x] Heatmap + routing endpoints
- [ ] Mobile app scaffold (coming next)

### Phase 2: Core Features
- [ ] Mobile app (React Native, full UI)
- [ ] Valhalla routing with custom cost functions
- [ ] Incident reporting (quick tap + photo)
- [ ] Weather API integration
- [ ] Multi-city support
- [ ] Rate limiting & abuse prevention

### Phase 3: Intelligence & Community
- [ ] ML-based scoring (LightGBM + SHAP)
- [ ] Community verification (up/downvote incidents)
- [ ] Reputation system & badges
- [ ] SOS live location sharing
- [ ] Wearables integration (haptic alerts)
- [ ] Offline maps + cached scores

### Phase 4: Scale & Monetization
- [ ] Web app (Next.js)
- [ ] API for third-party apps
- [ ] Partner integrations (rideshare, navigation apps)
- [ ] Premium features (accessibility, analytics)

## Development

### Code Style
- **Python**: Black + Ruff
- **TypeScript**: ESLint + Prettier
- **Commit messages**: Conventional Commits

### Testing
- **Backend**: pytest + schemathesis
- **Mobile**: Jest + React Native Testing Library
- **Integration**: Postman + Newman

### Documentation
- Inline code comments (why, not what)
- README per service
- Architecture decisions (ADR)
- API docs (Swagger/OpenAPI)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Ideas to tackle:**
- Add new city data sources
- Improve safety scoring
- Build mobile UI components
- Add tests
- Optimize database queries
- Deploy infrastructure

## Privacy & Safety

### User Data
- **Location**: Never precise; binned to 100m×100m grid for analytics
- **Devices**: No device fingerprinting
- **Reports**: Can be anonymous; verified before affecting public score
- **Retention**: 90 days for incidents, 6 months for aggregates, deleted on request

### Ethical Use
- No targeting or discrimination
- Community reports moderated (heuristics + human review)
- Clear confidence intervals on scores
- Accessible to all (free, open source)

## Compliance
- GDPR: Data export/delete endpoints
- CCPA: Opt-in analytics
- Accessibility: WCAG 2.1 AA target (phase 2)

## Support

**Issues?** Open a GitHub issue with:
- Error message / screenshot
- Steps to reproduce
- Your environment (OS, app version)

**Feature requests?** Create a discussion or PR with details.

## License

MIT License — See [LICENSE](./LICENSE) for details.

## Authors

- **Yash Garg** ([@yashg2006](https://github.com/yashg2006))
- Community contributors

## Citation

If you use SaferStreets in research or public work, please cite:

```bibtex
@software{saferstreets,
  title={SaferStreets: Real-time Street Safety Scores and Routing},
  author={Garg, Yash and Contributors},
  url={https://github.com/yashg2006/SaferStreets},
  year={2026}
}
```

## Acknowledgments

- OpenStreetMap community for map data
- City open data portals for crime/infrastructure data
- Valhalla, PostGIS, and open-source communities
- Early testers and feedback providers

---

**Help us make streets safer.** ⭐ Star the repo if you believe in pedestrian safety!

For questions, reach out to the team or join our community Slack (link coming).
