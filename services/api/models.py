"""
SaferStreets Database Models
Defines street edges, safety scores, and incident reports for production deployment
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from geoalchemy2 import Geometry
from datetime import datetime
import uuid

Base = declarative_base()


class StreetEdge(Base):
    """
    Represents a street segment from OpenStreetMap.
    Stores geometry and static attributes (speed limits, infrastructure).
    """
    __tablename__ = "street_edges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    osm_way_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Geometry: PostGIS LineString
    geometry = Column(Geometry('LINESTRING', srid=4326), nullable=False, index=True)
    
    # Static attributes from OSM
    name = Column(String(255))
    highway_type = Column(String(50))  # residential, primary, trunk, etc.
    speed_limit = Column(Integer)  # km/h
    length_m = Column(Float)  # meters
    
    # Infrastructure
    has_sidewalk = Column(Boolean, default=False)
    sidewalk_width_m = Column(Float, nullable=True)
    has_crossing = Column(Boolean, default=False)
    crossing_count = Column(Integer, default=0)
    
    # Lighting (from OSM tags or city data)
    lit = Column(Boolean, nullable=True)  # null = unknown, true = lit, false = unlit
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SafetyScore(Base):
    """
    Per-edge, per-time-bucket safety score and confidence.
    Computed nightly by feature engineering pipeline.
    """
    __tablename__ = "safety_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    edge_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Time bucket: 0-23 (hour of day)
    time_bucket = Column(Integer, nullable=False, index=True)  # 0-23
    day_of_week = Column(Integer, nullable=True)  # 0=Monday, 6=Sunday (optional for phase 2)
    
    # Safety score: 0 (very unsafe) to 1 (very safe)
    score = Column(Float, nullable=False)  # 0.0 - 1.0
    
    # Confidence in score (0-1): higher = more data available
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    
    # JSON with factors contributing to score (for UI explainability)
    factors_json = Column(JSONB, nullable=True)
    # Example: {
    #   "lighting": 0.8,
    #   "crime_density": 0.3,
    #   "footfall": 0.7,
    #   "infrastructure": 0.6,
    #   "recent_reports": 0.4,
    #   "weather_penalty": 0.0
    # }
    
    # Data freshness
    data_sources = Column(JSONB, nullable=True)
    # Example: {"crime_data": "2026-04-15", "lighting": "2025-01-01", "osm": "2026-05-10"}
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IncidentReport(Base):
    """
    User-submitted incident reports (phase 2+).
    Supports anonymous submissions; aggregated for safety scoring.
    """
    __tablename__ = "incident_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Location (point geometry)
    location = Column(Geometry('POINT', srid=4326), nullable=False, index=True)
    
    # Closest edge for spatial join
    edge_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Category: theft, harassment, poor_lighting, construction, assault, etc.
    category = Column(String(50), nullable=False, index=True)
    
    # Optional description (can be empty for quick tap)
    description = Column(String(1000), nullable=True)
    
    # Photo (future: S3 URL or base64)
    photo_url = Column(String(500), nullable=True)
    
    # Verification
    verified = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    
    # User (optional for anonymous reports)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    anonymous = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    """
    User authentication and profile.
    Privacy-first: minimal data, hash locations for analytics.
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Passwordless auth: store one-time hash for email/SMS verification
    email = Column(String(255), unique=True, nullable=True)
    phone_number = Column(String(20), unique=True, nullable=True)
    
    # Settings
    analytics_opt_in = Column(Boolean, default=False)
    incident_share_consent = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)


class CrimeAggregate(Base):
    """
    Pre-aggregated crime counts by edge + time bucket.
    Updated nightly from city crime data feeds.
    """
    __tablename__ = "crime_aggregates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    edge_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Time bucket (hour of day 0-23)
    time_bucket = Column(Integer, nullable=False, index=True)
    
    # Aggregate crime metrics
    incident_count_30d = Column(Integer, default=0)  # Last 30 days
    incident_count_90d = Column(Integer, default=0)  # Last 90 days
    
    # Crime categories
    crime_types = Column(JSONB, nullable=True)
    # Example: {"theft": 5, "harassment": 2, "assault": 1}
    
    # Density (normalized per edge)
    crime_density = Column(Float, default=0.0)  # 0.0 - 1.0
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
