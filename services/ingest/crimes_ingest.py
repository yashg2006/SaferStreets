"""
Crime Data Ingest Pipeline
Fetches historical crime records from city open data portals and maps them to street edges.
Aggregates crime counts by edge + time bucket for safety scoring.

Supported cities:
- NYC: NYC OpenData (Socrata API)
- Chicago: Chicago Data Portal (Socrata API)
- LA: LA Open Data (Socrata API)

Usage:
    python crimes_ingest.py --city nyc --lookback-days 90 --output /tmp/crime_data
"""

import os
import sys
import argparse
import logging
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import urllib.request
import urllib.parse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

try:
    import requests
    import psycopg2
    from psycopg2.extras import execute_values
    from shapely.geometry import Point, LineString
    import math
except ImportError:
    logger.error("Missing dependencies. Install: requests psycopg2 shapely")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# Crime Data Sources Configuration
# ─────────────────────────────────────────────────────────────────────────────

CRIME_SOURCES = {
    "nyc": {
        "name": "NYC Complaint and Crime Data",
        "api_url": "https://data.cityofnewyork.us/api/views/qvfp-dwi5/rows.json",
        "date_field": "cmplnt_fr_dt",
        "lat_field": "latitude",
        "lng_field": "longitude",
        "category_field": "ofns_desc",
        "bbox": (-74.255, 40.496, -73.701, 40.915)
    },
    "chicago": {
        "name": "Chicago Crimes (2001 to present)",
        "api_url": "https://data.cityofchicago.org/api/views/ijzp-q8t2/rows.json",
        "date_field": "date",
        "lat_field": "latitude",
        "lng_field": "longitude",
        "category_field": "primary_type",
        "bbox": (-87.936, 41.644, -87.523, 42.023)
    },
    "la": {
        "name": "LA Crime Data",
        "api_url": "https://data.lacity.gov/api/views/63jx-nv6z/rows.json",
        "date_field": "date_rptd",
        "lat_field": "lat",
        "lng_field": "lon",
        "category_field": "crm_cd_desc",
        "bbox": (-118.668, 33.704, -118.155, 34.337)
    }
}

# Crime categories to prioritize (others will be ignored)
CRIME_CATEGORIES = {
    "theft", "robbery", "larceny", "grand_larceny", "burglary",
    "assault", "harassment", "aggravated_assault",
    "criminal_mischief", "vandalism",
    "rape", "sex_crime",
    "drug_related", "narcotics"
}

# ─────────────────────────────────────────────────────────────────────────────
# Crime Data Fetcher
# ─────────────────────────────────────────────────────────────────────────────

class CrimeDataFetcher:
    """Fetches crime records from Socrata API endpoints"""
    
    def __init__(self, city: str, lookback_days: int = 90):
        if city not in CRIME_SOURCES:
            raise ValueError(f"Unsupported city: {city}. Supported: {list(CRIME_SOURCES.keys())}")
        
        self.city = city
        self.source = CRIME_SOURCES[city]
        self.lookback_days = lookback_days
        self.crimes = []
    
    def fetch(self) -> List[Dict]:
        """Fetch crime records from API"""
        logger.info(f"Fetching crime data for {self.source['name']} (last {self.lookback_days} days)")
        
        # Construct SoQL query (Socrata Query Language)
        cutoff_date = (datetime.now() - timedelta(days=self.lookback_days)).isoformat()
        
        # Filter: records with location + category
        where_clause = f"{self.source['date_field']} > '{cutoff_date}' AND {self.source['lat_field']} IS NOT NULL AND {self.source['lng_field']} IS NOT NULL"
        
        params = {
            "$where": where_clause,
            "$limit": 50000,  # Adjust based on quota
            "$order": f"{self.source['date_field']} DESC"
        }
        
        try:
            url = f"{self.source['api_url']}?{urllib.parse.urlencode(params)}"
            logger.info(f"Requesting: {url[:100]}...")
            
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Fetched {len(data)} records")
            
            # Parse response
            for record in data:
                crime = self._parse_record(record)
                if crime:
                    self.crimes.append(crime)
            
            logger.info(f"Parsed {len(self.crimes)} valid crime records")
            return self.crimes
            
        except Exception as e:
            logger.error(f"Failed to fetch crime data: {e}")
            raise
    
    def _parse_record(self, record: Dict) -> Optional[Dict]:
        """Parse a single crime record"""
        try:
            # Extract fields
            date_str = record.get(self.source["date_field"])
            lat = float(record.get(self.source["lat_field"], 0))
            lng = float(record.get(self.source["lng_field"], 0))
            category = record.get(self.source["category_field"], "").lower()
            
            # Validate
            if not date_str or lat == 0 or lng == 0:
                return None
            
            if not self._is_relevant_crime(category):
                return None
            
            # Parse date
            date_obj = self._parse_date(date_str)
            if not date_obj:
                return None
            
            return {
                "date": date_obj,
                "hour": date_obj.hour,
                "day_of_week": date_obj.weekday(),
                "lat": lat,
                "lng": lng,
                "category": category,
                "location": Point(lng, lat)
            }
        except Exception:
            return None
    
    @staticmethod
    def _parse_date(date_str: str) -> Optional[datetime]:
        """Parse various date formats"""
        formats = [
            "%m/%d/%Y %I:%M:%S %p",  # NYC format
            "%Y-%m-%d %H:%M:%S",      # ISO format
            "%m/%d/%Y",               # Date only
            "%Y-%m-%d"                # ISO date only
        ]
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        return None
    
    @staticmethod
    def _is_relevant_crime(category: str) -> bool:
        """Check if crime category is relevant to street safety"""
        # For MVP, include most categories; filter later if needed
        return True

# ─────────────────────────────────────────────────────────────────────────────
# Spatial Mapping: Crimes → Edges
# ─────────────────────────────────────────────────────────────────────────────

class CrimeEdgeMapper:
    """Maps crime points to nearest street edges using spatial join"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.conn = None
    
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(self.database_url)
            logger.info("Connected to PostgreSQL database")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def map_crimes_to_edges(self, crimes: List[Dict], buffer_m: float = 30.0) -> List[Dict]:
        """
        Map crime points to nearest edges using PostGIS ST_DWithin.
        
        Args:
            crimes: List of crime records with lat/lng
            buffer_m: Search buffer (meters) around each crime
        
        Returns:
            List of (crime, edge_id, distance) tuples
        """
        logger.info(f"Mapping {len(crimes)} crimes to street edges (buffer={buffer_m}m)")
        
        mapped_crimes = []
        
        for crime in crimes:
            try:
                with self.conn.cursor() as cur:
                    # Find nearest edge within buffer
                    query = f"""
                        SELECT id, ST_Distance(geometry, ST_SetSRID(ST_MakePoint(%s, %s), 4326)) as distance
                        FROM street_edges
                        WHERE ST_DWithin(geometry, ST_SetSRID(ST_MakePoint(%s, %s), 4326), {buffer_m}/111000)
                        ORDER BY distance
                        LIMIT 1;
                    """
                    
                    cur.execute(query, (crime["lng"], crime["lat"], crime["lng"], crime["lat"]))
                    row = cur.fetchone()
                    
                    if row:
                        edge_id, distance = row
                        mapped_crime = crime.copy()
                        mapped_crime["edge_id"] = edge_id
                        mapped_crime["distance_to_edge_m"] = distance
                        mapped_crimes.append(mapped_crime)
            
            except Exception as e:
                logger.warning(f"Failed to map crime: {e}")
        
        logger.info(f"Successfully mapped {len(mapped_crimes)}/{len(crimes)} crimes")
        return mapped_crimes
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

# ─────────────────────────────────────────────────────────────────────────────
# Crime Aggregation & Storage
# ─────────────────────────────────────────────────────────────────────────────

class CrimeAggregator:
    """Aggregates crimes by edge + time bucket and stores in database"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.conn = None
    
    def connect(self):
        """Connect to PostgreSQL"""
        try:
            self.conn = psycopg2.connect(self.database_url)
            logger.info("Connected to PostgreSQL database")
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            raise
    
    def ensure_table(self):
        """Create crime_aggregates table if it doesn't exist"""
        with self.conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS crime_aggregates (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    edge_id UUID NOT NULL,
                    time_bucket INTEGER NOT NULL,
                    incident_count_30d INTEGER DEFAULT 0,
                    incident_count_90d INTEGER DEFAULT 0,
                    crime_types JSONB,
                    crime_density FLOAT DEFAULT 0.0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(edge_id, time_bucket)
                );
            """)
            
            cur.execute("CREATE INDEX IF NOT EXISTS idx_crime_agg_edge ON crime_aggregates(edge_id);")
            self.conn.commit()
            logger.info("Crime aggregates table ensured")
    
    def aggregate_and_store(self, mapped_crimes: List[Dict], lookback_days: int = 90):
        """
        Aggregate crimes by edge + hour and store in database.
        """
        logger.info(f"Aggregating {len(mapped_crimes)} crimes...")
        
        # Group by edge + hour
        aggregates = {}
        for crime in mapped_crimes:
            edge_id = crime.get("edge_id")
            hour = crime.get("hour")
            
            if not edge_id:
                continue
            
            key = (edge_id, hour)
            if key not in aggregates:
                aggregates[key] = {"count": 0, "categories": {}}
            
            aggregates[key]["count"] += 1
            category = crime.get("category", "unknown")
            aggregates[key]["categories"][category] = aggregates[key]["categories"].get(category, 0) + 1
        
        # Normalize crime density (0-1 scale, max=10 crimes/hour)
        max_count = max((agg["count"] for agg in aggregates.values()), default=1)
        
        # Prepare records for batch insert
        insert_data = []
        for (edge_id, hour), agg in aggregates.items():
            density = min(1.0, agg["count"] / max(max_count, 10))
            insert_data.append((
                str(edge_id),
                hour,
                agg["count"],
                agg["count"],  # 30d and 90d counts (same for MVP)
                json.dumps(agg["categories"]),
                density
            ))
        
        # Insert into database
        if insert_data:
            with self.conn.cursor() as cur:
                insert_sql = """
                    INSERT INTO crime_aggregates (edge_id, time_bucket, incident_count_30d, incident_count_90d, crime_types, crime_density)
                    VALUES %s
                    ON CONFLICT (edge_id, time_bucket) DO UPDATE SET
                        incident_count_30d = EXCLUDED.incident_count_30d,
                        incident_count_90d = EXCLUDED.incident_count_90d,
                        crime_types = EXCLUDED.crime_types,
                        crime_density = EXCLUDED.crime_density,
                        updated_at = NOW();
                """
                
                try:
                    execute_values(cur, insert_sql, insert_data, page_size=1000)
                    self.conn.commit()
                    logger.info(f"Stored aggregates for {len(insert_data)} edge-hour pairs")
                except Exception as e:
                    logger.error(f"Failed to store aggregates: {e}")
                    self.conn.rollback()
                    raise
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

# ─────────────────────────────────────────────────────────────────────────────
# Main Workflow
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Ingest crime data into SaferStreets database")
    parser.add_argument("--city", required=True, choices=list(CRIME_SOURCES.keys()),
                        help="City to ingest")
    parser.add_argument("--lookback-days", type=int, default=90,
                        help="Days of historical crime data to fetch")
    parser.add_argument("--output", default="/tmp/crime_data",
                        help="Output directory")
    parser.add_argument("--database-url", default="dbname=saferstreets user=postgres password=password host=localhost",
                        help="PostgreSQL connection string")
    
    args = parser.parse_args()
    
    logger.info("Starting crime data ingest pipeline")
    logger.info(f"City: {args.city}")
    logger.info(f"Lookback: {args.lookback_days} days")
    
    try:
        # Fetch crime data
        fetcher = CrimeDataFetcher(args.city, lookback_days=args.lookback_days)
        crimes = fetcher.fetch()
        
        # Map crimes to street edges
        mapper = CrimeEdgeMapper(args.database_url)
        mapper.connect()
        mapped_crimes = mapper.map_crimes_to_edges(crimes)
        mapper.close()
        
        # Aggregate and store
        aggregator = CrimeAggregator(args.database_url)
        aggregator.connect()
        aggregator.ensure_table()
        aggregator.aggregate_and_store(mapped_crimes, lookback_days=args.lookback_days)
        aggregator.close()
        
        logger.info("Crime data ingest complete")
        
    except Exception as e:
        logger.error(f"Crime ingest failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
