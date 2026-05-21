"""
OpenStreetMap Ingest Pipeline
Downloads OSM extracts and extracts street segments for SaferStreets database.
Builds edge graph with geometry, speed limits, lighting, and infrastructure data.

Usage:
    python osm_ingest.py --region "north-america/us/new-york" --output /tmp/osm_data
"""

import os
import sys
import argparse
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import urllib.request
import tarfile
import subprocess

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# OSM and Valhalla dependencies
try:
    import osmium
    import psycopg2
    from psycopg2.extras import execute_values
    from geoalchemy2.shape import from_shape
    from shapely.geometry import LineString
except ImportError:
    logger.error("Missing dependencies. Install: osmium psycopg2 sqlalchemy geoalchemy2 shapely")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

GEOFABRIK_BASE_URL = "https://download.geofabrik.de"
VALID_HIGHWAY_TYPES = {
    "residential", "tertiary", "secondary", "primary", "trunk",
    "pedestrian", "footway", "path", "cycleway", "living_street",
    "service", "unclassified"
}

# ─────────────────────────────────────────────────────────────────────────────
# OSM Way Handler (Osmium Callback)
# ─────────────────────────────────────────────────────────────────────────────

class EdgeHandler(osmium.SimpleHandler):
    """
    Processes OSM ways and extracts street edges.
    Collects nodes first, then builds edge geometries.
    """
    
    def __init__(self):
        super().__init__()
        self.nodes = {}  # node_id -> (lat, lng)
        self.edges = []
        self.node_count = 0
        self.way_count = 0
        
    def node(self, n):
        """Callback: store node coordinates"""
        self.nodes[n.id] = (n.lat, n.lon)
        self.node_count += 1
        if self.node_count % 1_000_000 == 0:
            logger.info(f"Processed {self.node_count:,} nodes")
    
    def way(self, w):
        """Callback: process street ways"""
        # Filter by highway type
        if "highway" not in w.tags:
            return
        
        highway_type = w.tags.get("highway")
        if highway_type not in VALID_HIGHWAY_TYPES:
            return
        
        # Extract coordinates from node IDs
        coords = []
        for node_id in w.nd_ids():
            if node_id in self.nodes:
                lat, lng = self.nodes[node_id]
                coords.append((lng, lat))  # GeoJSON format: [lng, lat]
        
        if len(coords) < 2:
            return  # Skip edges with < 2 nodes
        
        # Build edge record
        edge = {
            "osm_way_id": str(w.id),
            "name": w.tags.get("name", ""),
            "highway_type": highway_type,
            "speed_limit": self._parse_speed_limit(w.tags.get("maxspeed", "")),
            "has_sidewalk": w.tags.get("sidewalk") in ["left", "right", "both"],
            "has_crossing": "crossing" in w.tags,
            "lit": self._parse_lit(w.tags.get("lit")),
            "coordinates": coords,
            "length_m": self._estimate_distance(coords)
        }
        
        self.edges.append(edge)
        self.way_count += 1
        
        if self.way_count % 50_000 == 0:
            logger.info(f"Extracted {self.way_count:,} edges")
    
    @staticmethod
    def _parse_speed_limit(maxspeed_str: str) -> Optional[int]:
        """Parse maxspeed tag (e.g., '40', '25 mph')"""
        if not maxspeed_str:
            return None
        parts = maxspeed_str.split()
        try:
            speed = int(parts[0])
            # Convert mph to km/h if needed
            if len(parts) > 1 and parts[1].lower() == "mph":
                speed = int(speed * 1.609)
            return speed
        except (ValueError, IndexError):
            return None
    
    @staticmethod
    def _parse_lit(lit_str: Optional[str]) -> Optional[bool]:
        """Parse lit tag (yes/no/unknown)"""
        if not lit_str:
            return None
        lit_lower = lit_str.lower()
        if lit_lower in ["yes", "true", "1"]:
            return True
        elif lit_lower in ["no", "false", "0"]:
            return False
        return None
    
    @staticmethod
    def _estimate_distance(coords: List[tuple]) -> float:
        """Rough distance estimate using Haversine (meters)"""
        import math
        R = 6371000  # Earth radius in meters
        total_m = 0.0
        for i in range(len(coords) - 1):
            lng1, lat1 = coords[i]
            lng2, lat2 = coords[i + 1]
            dlat = math.radians(lat2 - lat1)
            dlng = math.radians(lng2 - lng1)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
            c = 2 * math.asin(math.sqrt(a))
            total_m += R * c
        return total_m

# ─────────────────────────────────────────────────────────────────────────────
# Database Operations
# ─────────────────────────────────────────────────────────────────────────────

class EdgeDatabase:
    """PostgreSQL + PostGIS database interface"""
    
    def __init__(self, database_url: str):
        """
        Args:
            database_url: psycopg2 connection string
                e.g., "dbname=saferstreets user=postgres password=... host=localhost"
        """
        self.database_url = database_url
        self.conn = None
    
    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(self.database_url)
            logger.info("Connected to PostgreSQL database")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def ensure_tables(self):
        """Create tables if they don't exist"""
        with self.conn.cursor() as cur:
            # Enable PostGIS
            cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
            
            # Street edges table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS street_edges (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    osm_way_id VARCHAR(50) UNIQUE NOT NULL,
                    geometry GEOMETRY(LineString, 4326) NOT NULL,
                    name VARCHAR(255),
                    highway_type VARCHAR(50),
                    speed_limit INTEGER,
                    length_m FLOAT,
                    has_sidewalk BOOLEAN DEFAULT FALSE,
                    has_crossing BOOLEAN DEFAULT FALSE,
                    lit BOOLEAN,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            """)
            
            # Create spatial index
            cur.execute("CREATE INDEX IF NOT EXISTS idx_edges_geom ON street_edges USING GIST(geometry);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_edges_osm_way_id ON street_edges(osm_way_id);")
            
            self.conn.commit()
            logger.info("Database tables ensured")
    
    def insert_edges(self, edges: List[Dict]):
        """Bulk insert edges into database"""
        if not edges:
            logger.warning("No edges to insert")
            return
        
        with self.conn.cursor() as cur:
            # Prepare data for batch insert
            data = []
            for edge in edges:
                # Create LineString geometry from coordinates
                geom_wkt = f"SRID=4326;LINESTRING({', '.join(f'{lng} {lat}' for lng, lat in edge['coordinates'])})"
                
                data.append((
                    edge["osm_way_id"],
                    geom_wkt,
                    edge["name"],
                    edge["highway_type"],
                    edge["speed_limit"],
                    edge["length_m"],
                    edge["has_sidewalk"],
                    edge["has_crossing"],
                    edge["lit"]
                ))
            
            # Batch insert (on conflict, ignore duplicates)
            insert_sql = """
                INSERT INTO street_edges 
                (osm_way_id, geometry, name, highway_type, speed_limit, length_m, 
                 has_sidewalk, has_crossing, lit)
                VALUES %s
                ON CONFLICT (osm_way_id) DO NOTHING
            """
            
            try:
                execute_values(cur, insert_sql, data, page_size=1000)
                self.conn.commit()
                logger.info(f"Inserted {cur.rowcount} edges into database")
            except Exception as e:
                logger.error(f"Failed to insert edges: {e}")
                self.conn.rollback()
                raise
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")

# ─────────────────────────────────────────────────────────────────────────────
# Main Ingest Workflow
# ─────────────────────────────────────────────────────────────────────────────

def download_osm_extract(region: str, output_dir: str) -> str:
    """
    Download OSM extract from Geofabrik.
    
    Args:
        region: e.g., "north-america/us/new-york"
        output_dir: Local directory to save .pbf file
    
    Returns:
        Path to downloaded .pbf file
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Construct Geofabrik URL
    region_file = region.split("/")[-1]
    url = f"{GEOFABRIK_BASE_URL}/{region}-latest.osm.pbf"
    pbf_path = output_path / f"{region_file}-latest.osm.pbf"
    
    if pbf_path.exists():
        logger.info(f"OSM extract already exists: {pbf_path}")
        return str(pbf_path)
    
    logger.info(f"Downloading OSM extract from {url}")
    try:
        urllib.request.urlretrieve(url, pbf_path)
        logger.info(f"Downloaded to {pbf_path}")
        return str(pbf_path)
    except Exception as e:
        logger.error(f"Failed to download OSM extract: {e}")
        raise

def ingest_osm_file(pbf_path: str, db: EdgeDatabase):
    """
    Parse OSM .pbf file and ingest edges into database.
    """
    logger.info(f"Processing OSM file: {pbf_path}")
    
    handler = EdgeHandler()
    handler.apply_file(pbf_path, locations=True)
    
    logger.info(f"Extracted {handler.way_count:,} ways -> {len(handler.edges)} valid edges")
    
    # Insert into database
    db.insert_edges(handler.edges)
    
    return handler.edges

def main():
    parser = argparse.ArgumentParser(description="Ingest OpenStreetMap data into SaferStreets database")
    parser.add_argument("--region", required=True, help="OSM region (e.g., 'north-america/us/new-york')")
    parser.add_argument("--output", default="/tmp/osm_data", help="Output directory")
    parser.add_argument("--database-url", default="dbname=saferstreets user=postgres password=password host=localhost",
                        help="PostgreSQL connection string")
    parser.add_argument("--skip-download", action="store_true", help="Use existing OSM file")
    
    args = parser.parse_args()
    
    logger.info("Starting OSM ingest pipeline")
    logger.info(f"Region: {args.region}")
    logger.info(f"Database: {args.database_url.split('@')[-1]}")
    
    try:
        # Download OSM extract
        pbf_path = download_osm_extract(args.region, args.output) if not args.skip_download else f"{args.output}/{args.region.split('/')[-1]}-latest.osm.pbf"
        
        # Connect to database
        db = EdgeDatabase(args.database_url)
        db.connect()
        db.ensure_tables()
        
        # Ingest edges
        edges = ingest_osm_file(pbf_path, db)
        
        logger.info(f"OSM ingest complete: {len(edges)} edges ingested")
        
        db.close()
        
    except Exception as e:
        logger.error(f"OSM ingest failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
