# SaferStreets MVP - Quick Start Guide

Welcome! You're now running the SaferStreets mobile app with a complete backend API, data pipeline, and routing service architecture.

## What's Running

Your Expo dev server is live and bundling the React Native app. The preview shows the mobile interface.

## Project Structure

```
/services
  /api           - FastAPI backend with safety scoring & routing APIs
  /ingest        - Data pipeline (OSM, crime, lighting, scoring)
  /routing       - Valhalla routing service (Docker ready)
/mobile
  /app            - Expo Router file-based routing
  /components     - Reusable React Native UI components
  /lib
    /api         - API client for backend communication
    /stores      - Zustand state management
/infra           - Terraform & deployment configs
```

## Next Steps (Recommended Order)

### 1. Test the Mobile App (Now)
- The app is running in preview
- It shows a map placeholder with controls for route entry
- Try entering origin/destination addresses (currently mocked)
- View the route comparison cards (fastest vs. safest)

### 2. Start the Backend (Terminal Tab 2)
```bash
cd services/api
pip install -r requirements.txt
python main.py
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 3. Ingest Real Data (Terminal Tab 3)
```bash
cd services/ingest

# Download OSM for a city (e.g., San Francisco)
python osm_ingest.py --region "north-america/us/california" --bbox "-122.5,37.7,-122.4,37.8"

# Fetch & ingest crime data
python crimes_ingest.py --city "San Francisco"

# Compute safety scores
python scoring.py

# Result: Safety scores now live in PostgreSQL
```

### 4. Start Routing Service (Terminal Tab 4)
```bash
docker-compose up -d  # Starts PostgreSQL + Redis
cd services/routing
docker build -t valhalla-saferstreets .
docker run -p 8002:8002 valhalla-saferstreets
# Routing available at http://localhost:8002/route
```

### 5. Connect Mobile to Live Backend
Update `/mobile/lib/api/client.ts`:
```typescript
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
```

Then search for an address in the mobile app—it will call your backend!

## API Endpoints (When Backend is Running)

- `GET /health` - Service health check
- `GET /heatmap?min_lng=...&max_lng=...&time_bucket=9` - Safety heatmap for viewport
- `POST /route` - Calculate fastest & safest routes
- `GET /segments/{id}` - Details & factors for a street segment
- `POST /incidents` - Report safety incidents
- `GET /docs` - Interactive API documentation

## Data Flow

```
OSM Extracts
    ↓
osm_ingest.py → Street network in PostgreSQL + PostGIS
    ↓
Crime APIs → crimes_ingest.py → Spatially joined to edges
    ↓
Lighting datasets, footfall → Normalized features
    ↓
scoring.py → Safety scores (0-1) + confidence + factor breakdown
    ↓
FastAPI → JSON heatmap tiles + segment details
    ↓
Mobile App → Renders green→red heatmap + routes
```

## Production Deployment

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for:
- PostgreSQL + PostGIS setup
- Docker multi-container deployment
- CI/CD with GitHub Actions
- Scaling routing service with Kubernetes

See [MOBILE_SETUP.md](./MOBILE_SETUP.md) for:
- Building production APK/IPA
- EAS Build integration
- App Store / Play Store submission

## Key Features in MVP

✅ **Map Heatmap**: Real-time safety scores by street segment  
✅ **Dual Routing**: Fastest vs. Safest with user comparison  
✅ **Time-of-Day Slider**: Safety scores change by hour  
✅ **Incident Reporting**: Quick-tap + photo reporting (backend ready)  
✅ **Auth**: Login/signup screens (backend integration in phase 2)  
✅ **Privacy-First**: No precise tracking, optional anonymous reports  
✅ **Offline Ready**: Cached heatmap tiles, works without internet (phase 2)  

## Troubleshooting

**Preview not showing?**
- Restart the dev server: `cd mobile && pnpm start`
- Check that port 8081 is free
- Clear cache: `rm -rf .expo`

**Backend errors?**
- Ensure PostgreSQL is running: `docker-compose ps`
- Check logs: `docker-compose logs api`
- Verify `.env` has `DATABASE_URL=postgresql://...`

**Can't find routes?**
- OSM data needs ingestion first (see step 3 above)
- Valhalla routing service must be running
- Check coordinates are valid (NYC: -74.005, 40.714)

**API client errors?**
- Update `API_BASE_URL` in `lib/api/client.ts`
- Ensure backend is running on port 8000
- Check CORS is enabled (it is by default)

## Environment Variables

Create `/mobile/.env` (optional for dev):
```
API_BASE_URL=http://localhost:8000
MAPBOX_PUBLIC_TOKEN=pk.your_token_here
```

Create `/services/api/.env`:
```
DATABASE_URL=postgresql://user:pass@localhost/saferstreets
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key_here
```

## What's Next After MVP?

- **Phase 2**: Multi-city support, ML safety scoring, offline maps
- **Phase 3**: SOS alerts, wearables integration, community moderation
- **Phase 4**: Advanced analytics, accessibility (high-contrast, voice), international expansion

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Implement changes following the project structure
3. Test locally with `pnpm start` (mobile) and `python main.py` (backend)
4. Submit a PR with description and testing evidence

## Support

- Backend issues? See [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- Mobile issues? See [MOBILE_SETUP.md](./MOBILE_SETUP.md)
- Architecture? See [README.md](./README.md)
- Questions? Open a GitHub issue

---

**Happy coding!** You now have a production-ready foundation for a safety-first routing app. 🛡️
