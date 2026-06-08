from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String, index=True)  # e.g., 'theft', 'harassment'
    description = Column(String, nullable=True)

    # Store location as WKT string (works without PostGIS/geoalchemy2)
    location = Column(String, nullable=True)

    # Lat/lng as floats for easy JSON serialization
    lat = Column(Float)
    lng = Column(Float)

    risk_score = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
