from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String, index=True) # e.g., 'theft', 'harassment', 'poor_lighting'
    description = Column(String, nullable=True)
    
    # Store exact location as a PostGIS point (longitude, latitude)
    location = Column(Geometry('POINT', srid=4326))
    
    # Keep lat/lng as floats for easy JSON serialization without parsing WKB
    lat = Column(Float)
    lng = Column(Float)
    
    risk_score = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
