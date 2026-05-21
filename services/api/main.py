"""
SaferStreets Backend API
FastAPI server for mobile app and web clients
Handles routing, heatmap queries, segment details, and user incidents
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime, timedelta
import json

# Import models
from models import Base, StreetEdge, SafetyScore, IncidentReport, User, CrimeAggregate

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://saferstreets:password@localhost:5432/saferstreets"
)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # Serverless-friendly; disable connection pooling
    echo=False,
    connect_args={"connect_timeout": 10}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─────────────────────────────────────────────────────────────────────────────
# Startup & Shutdown
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic"""
    # Startup
    logger.info("Starting SaferStreets API")
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down SaferStreets API")
    engine.dispose()

# ─────────────────────────────────────────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="SaferStreets API",
    description="Real-time street safety scores and routing",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Models (Request/Response Schemas)
# ─────────────────────────────────────────────────────────────────────────────

class RouteRequest(BaseModel):
    origin_lng: float
    origin_lat: float
    destination_lng: float
    destination_lat: float
    safe_mode: bool = True
    time_bucket: Optional[int] = None  # 0-23; if None, use current hour
    lambda_safety: float = 1.0  # Safety weight multiplier

class RouteResponse(BaseModel):
    status: str
    type: str  # "fastest" or "safest"
    eta_mins: int
    distance_m: int
    risk_level: str  # "Low", "Medium", "High"
    route_coordinates: List[List[float]]  # [[lng, lat], ...]
    factors: dict  # Top factors affecting route

class SegmentDetails(BaseModel):
    edge_id: str
    name: Optional[str]
    safety_score: float
    confidence: float
    factors: dict
    crime_density: float
    lighting: Optional[bool]
    last_updated: str

class HeatmapFeature(BaseModel):
    type: str = "Feature"
    geometry: dict  # GeoJSON geometry
    properties: dict  # Safety score, confidence, etc.

class IncidentRequestPayload(BaseModel):
    lat: float
    lng: float
    category: str
    description: Optional[str] = None
    photo_url: Optional[str] = None
    anonymous: bool = True
    user_id: Optional[str] = None

class IncidentResponse(BaseModel):
    status: str
    incident_id: str
    message: str

# ─────────────────────────────────────────────────────────────────────────────
# Health & Info
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Welcome to SaferStreets API",
        "version": "0.1.0",
        "status": "operational"
    }

@app.get("/health", tags=["Health"])
def health(db: Session = Depends(get_db)):
    """Health check with database connectivity test"""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Database connection failed")

# ─────────────────────────────────────────────────────────────────────────────
# Routing Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/route", response_model=RouteResponse, tags=["Routing"])
def calculate_route(
    request: RouteRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate fastest or safest route between two points.
    
    For MVP:
    - Fetch scores from SafetyScore table
    - Call Valhalla routing service with cost adjustments
    - Return route with risk assessment
    
    TODO: Integrate with Valhalla service
    """
    logger.info(
        f"Route request: {request.origin_lat},{request.origin_lng} -> "
        f"{request.destination_lat},{request.destination_lng} "
        f"(safe={request.safe_mode})"
    )
    
    # For MVP, return mock route data
    # In phase 2, integrate with Valhalla service
    return RouteResponse(
        status="success",
        type="safest" if request.safe_mode else "fastest",
        eta_mins=18 if request.safe_mode else 15,
        distance_m=1850,
        risk_level="Low" if request.safe_mode else "Medium",
        route_coordinates=[
            [request.origin_lng, request.origin_lat],
            [request.origin_lng + 0.001, request.origin_lat + 0.002],
            [request.destination_lng, request.destination_lat]
        ],
        factors={
            "lighting": 0.8,
            "crime_density": 0.3,
            "footfall": 0.7
        }
    )

# ─────────────────────────────────────────────────────────────────────────────
# Heatmap & Segment Details
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/heatmap", tags=["Map"])
def get_heatmap(
    min_lng: float = Query(-74.01),
    max_lng: float = Query(-73.99),
    min_lat: float = Query(40.71),
    max_lat: float = Query(40.72),
    time_bucket: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get safety heatmap as GeoJSON for bounding box.
    Returns street segment features with scores.
    
    Query: SELECT edges + scores within bbox for given time_bucket
    """
    if time_bucket is None:
        time_bucket = datetime.now().hour
    
    if not 0 <= time_bucket <= 23:
        raise HTTPException(status_code=400, detail="time_bucket must be 0-23")
    
    logger.info(f"Heatmap request: bbox=({min_lng},{min_lat})-({max_lng},{max_lat}), hour={time_bucket}")
    
    # TODO: Implement PostGIS spatial query
    # SELECT ST_AsGeoJSON(edges.geometry), scores.score FROM street_edges
    # JOIN safety_scores ON edges.id = safety_scores.edge_id
    # WHERE ST_Within(edges.geometry, box) AND safety_scores.time_bucket = time_bucket
    
    # Mock response
    return {
        "status": "success",
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[-74.005, 40.714], [-74.004, 40.715]]
                },
                "properties": {
                    "edge_id": "mock-edge-1",
                    "safety_score": 0.75,
                    "confidence": 0.85,
                    "name": "5th Avenue"
                }
            }
        ]
    }

@app.get("/api/segments/{edge_id}", response_model=SegmentDetails, tags=["Map"])
def get_segment_details(
    edge_id: str,
    time_bucket: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get details for a specific street segment: score, factors, recent incidents.
    """
    if time_bucket is None:
        time_bucket = datetime.now().hour
    
    # TODO: Query database
    # SELECT edges.*, scores.* FROM street_edges
    # JOIN safety_scores ON ...
    # WHERE edges.id = edge_id AND time_bucket = time_bucket
    
    # Mock response
    return SegmentDetails(
        edge_id=edge_id,
        name="5th Avenue",
        safety_score=0.75,
        confidence=0.85,
        factors={
            "lighting": "High confidence, street lit",
            "crime_density": "5 incidents in 30 days",
            "footfall": "Moderate foot traffic"
        },
        crime_density=0.3,
        lighting=True,
        last_updated=datetime.now().isoformat()
    )

# ─────────────────────────────────────────────────────────────────────────────
# Incident Reporting (Phase 2+)
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/incidents", response_model=IncidentResponse, tags=["Incidents"])
def create_incident(
    payload: IncidentRequestPayload,
    db: Session = Depends(get_db)
):
    """
    Submit an incident report (theft, harassment, poor lighting, etc.).
    Rate-limited; supports anonymous submissions.
    
    TODO: Add rate limiting per device/IP
    TODO: Add moderation heuristics
    """
    logger.info(f"Incident report: {payload.category} at ({payload.lat}, {payload.lng})")
    
    try:
        # TODO: Create IncidentReport in database
        # TODO: Map point to nearest edge
        # TODO: Store in database
        
        incident_id = "incident-mock-id"
        return IncidentResponse(
            status="success",
            incident_id=incident_id,
            message="Thank you for reporting. Your report helps keep others safe."
        )
    except Exception as e:
        logger.error(f"Failed to create incident: {e}")
        raise HTTPException(status_code=500, detail="Failed to create incident")

# ─────────────────────────────────────────────────────────────────────────────
# Weather & Real-Time Adjustments
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/weather", tags=["Weather"])
def get_weather(
    lat: float,
    lng: float,
    db: Session = Depends(get_db)
):
    """
    Fetch real-time weather for location.
    Apply penalty multipliers to nearby edges (rain, darkness, low visibility).
    
    TODO: Integrate with weather API (OpenWeatherMap, NOAA, etc.)
    """
    # Mock response
    return {
        "status": "success",
        "weather": "clear",
        "temperature_c": 15,
        "visibility_m": 10000,
        "precipitation_mm": 0,
        "safety_penalty": 0.0  # 0 = no penalty, 1 = max penalty
    }

# ─────────────────────────────────────────────────────────────────────────────
# Admin & Data Management (Phase 2+)
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/admin/refresh-scores", tags=["Admin"])
def refresh_scores(db: Session = Depends(get_db)):
    """
    Trigger safety score recalculation (nightly job).
    Called by data pipeline after ingesting new crime/incident data.
    
    TODO: Call scoring service / Airflow job
    """
    logger.info("Triggering score refresh")
    return {
        "status": "scheduled",
        "message": "Score refresh job queued"
    }

# ─────────────────────────────────────────────────────────────────────────────
# Error Handlers
# ─────────────────────────────────────────────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "detail": exc.detail}
    )

# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
