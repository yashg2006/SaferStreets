"""
Safety Scoring Pipeline
Computes per-edge, per-time-bucket safety scores using rule-based baseline.
Integrates crime, lighting, infrastructure, and footfall data.

Run nightly to update SafetyScore table after ingesting new crime data.

Usage:
    python scoring.py --database-url "postgresql://..." --output /tmp/scores
"""

import os
import sys
import argparse
import logging
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import math

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

try:
    import psycopg2
    from psycopg2.extras import execute_values
    import numpy as np
except ImportError:
    logger.error("Missing dependencies. Install: psycopg2 numpy")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# Scoring Weights & Configuration
# ─────────────────────────────────────────────────────────────────────────────

SCORING_WEIGHTS = {
    "lighting": 0.25,           # Presence of street lighting
    "crime_density": 0.30,      # Inverse of crime density
    "footfall": 0.15,           # Pedestrian traffic (positive for safety)
    "infrastructure": 0.20,     # Sidewalks, crossings, speed limits
    "recency_bonus": 0.05,      # Freshness of data
    "weather_penalty": 0.05     # Real-time weather adjustments
}

# Ensure weights sum to 1.0
assert abs(sum(SCORING_WEIGHTS.values()) - 1.0) < 0.01, "Weights must sum to 1.0"

# ─────────────────────────────────────────────────────────────────────────────
# Safety Scoring Model
# ─────────────────────────────────────────────────────────────────────────────

def sigmoid(x):
    """Sigmoid function for smooth score normalization"""
    return 1 / (1 + math.exp(-x))

class SafetyScorer:
    """Rule-based safety scoring model"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.conn = None
        self.feature_stats = None
    
    def connect(self):
        """Connect to database"""
        try:
            self.conn = psycopg2.connect(self.database_url)
            logger.info("Connected to database for scoring")
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            raise
    
    def load_features(self) -> Dict[str, List[Dict]]:
        """
        Load feature data for all edges + time buckets.
        Returns: {edge_id: [features_for_each_hour]}
        """
        logger.info("Loading feature data from database...")
        
        edge_features = {}
        
        with self.conn.cursor() as cur:
            # Fetch edges with infrastructure data
            cur.execute("""
                SELECT id, osm_way_id, name, lit, has_sidewalk, has_crossing, speed_limit, length_m
                FROM street_edges
                WHERE geometry IS NOT NULL
            """)
            
            edges = cur.fetchall()
            logger.info(f"Loaded {len(edges)} edges")
            
            for edge_id, osm_id, name, lit, has_sidewalk, has_crossing, speed_limit, length_m in edges:
                edge_features[edge_id] = {
                    "osm_id": osm_id,
                    "name": name,
                    "lit": lit,
                    "has_sidewalk": has_sidewalk,
                    "has_crossing": has_crossing,
                    "speed_limit": speed_limit,
                    "length_m": length_m,
                    "time_buckets": {}
                }
                
                # Load crime aggregates for this edge
                cur.execute("""
                    SELECT time_bucket, incident_count_30d, crime_density
                    FROM crime_aggregates
                    WHERE edge_id = %s
                """, (edge_id,))
                
                crime_data = cur.fetchall()
                for time_bucket, incident_count, crime_density in crime_data:
                    if time_bucket not in edge_features[edge_id]["time_buckets"]:
                        edge_features[edge_id]["time_buckets"][time_bucket] = {}
                    
                    edge_features[edge_id]["time_buckets"][time_bucket]["crime_density"] = crime_density
                    edge_features[edge_id]["time_buckets"][time_bucket]["incident_count"] = incident_count
        
        logger.info(f"Loaded features for {len(edge_features)} edges")
        return edge_features
    
    def score_edge(self, edge_id: str, time_bucket: int, features: Dict) -> Tuple[float, float, Dict]:
        """
        Compute safety score for an edge at a given time bucket.
        
        Returns: (score, confidence, factors_dict)
        
        Score: 0 (very unsafe) to 1 (very safe)
        Confidence: 0 (low) to 1 (high) based on data availability
        """
        
        # Extract features
        lit = features.get("lit", None)
        has_sidewalk = features.get("has_sidewalk", False)
        has_crossing = features.get("has_crossing", False)
        speed_limit = features.get("speed_limit", 40)  # Default 40 km/h
        
        time_bucket_data = features.get("time_buckets", {}).get(time_bucket, {})
        crime_density = time_bucket_data.get("crime_density", 0.5)  # 0-1
        
        # ─────────────────────────────────────────────────────────────────────
        # Feature normalization (0-1 scale)
        # ─────────────────────────────────────────────────────────────────────
        
        # 1. Lighting (binary)
        lighting_score = 1.0 if lit == True else (0.5 if lit is None else 0.0)
        
        # 2. Crime density (inverse: lower crime = higher score)
        crime_score = 1.0 - crime_density
        
        # 3. Infrastructure (sidewalk + crossing + speed)
        infra_score = 0.0
        if has_sidewalk:
            infra_score += 0.4
        if has_crossing:
            infra_score += 0.3
        # Speed: lower speed = safer; normalize to 0.3 (max safety bonus)
        if speed_limit:
            speed_norm = max(0, 1 - (speed_limit / 80))  # 80 km/h = 0 bonus
            infra_score += 0.3 * speed_norm
        
        # 4. Footfall (positive at night, negative during day for crowding)
        # For MVP, use constant value; phase 2 can integrate real pedestrian data
        footfall_score = 0.5
        if 20 <= time_bucket or time_bucket < 6:  # Night hours
            footfall_score *= 0.8  # Lower foot traffic = less safe at night
        
        # 5. Recency bonus (all data is recent in MVP)
        recency_score = 0.8  # TODO: Compute based on data_sources.last_updated
        
        # 6. Weather penalty (applied in real-time, not here)
        weather_penalty = 0.0
        
        # ─────────────────────────────────────────────────────────────────────
        # Weighted combination
        # ─────────────────────────────────────────────────────────────────────
        
        score_raw = (
            SCORING_WEIGHTS["lighting"] * lighting_score +
            SCORING_WEIGHTS["crime_density"] * crime_score +
            SCORING_WEIGHTS["infrastructure"] * infra_score +
            SCORING_WEIGHTS["footfall"] * footfall_score +
            SCORING_WEIGHTS["recency_bonus"] * recency_score -
            SCORING_WEIGHTS["weather_penalty"] * weather_penalty
        )
        
        # Normalize via sigmoid and clamp to [0.05, 0.95]
        # (never absolute 0 or 1 to indicate uncertainty)
        normalized_score = sigmoid(score_raw * 5 - 2.5)  # Scale for sigmoid
        final_score = max(0.05, min(0.95, normalized_score))
        
        # ─────────────────────────────────────────────────────────────────────
        # Confidence: based on feature availability
        # ─────────────────────────────────────────────────────────────────────
        
        features_available = 0
        if lit is not None:
            features_available += 1
        if has_sidewalk or has_crossing:
            features_available += 1
        if crime_density > 0:  # Crime data available
            features_available += 1
        
        confidence = min(1.0, features_available / 3.0)  # 3 main feature groups
        
        # ─────────────────────────────────────────────────────────────────────
        # Factors breakdown for UI
        # ─────────────────────────────────────────────────────────────────────
        
        factors = {
            "lighting": {
                "value": lighting_score,
                "label": "Well-lit street" if lit else "No street lighting" if lit is False else "Lighting unknown"
            },
            "crime_density": {
                "value": crime_score,
                "label": f"{int(crime_density * 10)} incidents/hour (avg)"
            },
            "infrastructure": {
                "value": infra_score,
                "label": f"{'Sidewalk' if has_sidewalk else 'No sidewalk'}, {'Crossing' if has_crossing else 'No crossing'}"
            },
            "footfall": {
                "value": footfall_score,
                "label": "Moderate foot traffic"
            }
        }
        
        return final_score, confidence, factors
    
    def compute_all_scores(self, edge_features: Dict) -> List[Tuple]:
        """
        Compute scores for all edges × time buckets.
        Returns list of tuples for batch insert.
        """
        logger.info("Computing safety scores for all edges × time buckets...")
        
        scores_to_insert = []
        edge_count = 0
        
        for edge_id, edge_data in edge_features.items():
            edge_count += 1
            if edge_count % 1000 == 0:
                logger.info(f"Scored {edge_count}/{len(edge_features)} edges")
            
            # Score for each hour (0-23)
            for time_bucket in range(24):
                score, confidence, factors = self.score_edge(edge_id, time_bucket, edge_data)
                
                scores_to_insert.append((
                    str(edge_id),
                    time_bucket,
                    score,
                    confidence,
                    json.dumps(factors)
                ))
        
        logger.info(f"Computed {len(scores_to_insert)} edge-hour scores")
        return scores_to_insert
    
    def store_scores(self, scores_to_insert: List[Tuple]):
        """Batch insert scores into SafetyScore table"""
        logger.info(f"Storing {len(scores_to_insert)} scores...")
        
        with self.conn.cursor() as cur:
            # Ensure table exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS safety_scores (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    edge_id UUID NOT NULL,
                    time_bucket INTEGER NOT NULL,
                    score FLOAT NOT NULL,
                    confidence FLOAT NOT NULL,
                    factors_json JSONB,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(edge_id, time_bucket)
                );
            """)
            
            # Batch insert
            insert_sql = """
                INSERT INTO safety_scores (edge_id, time_bucket, score, confidence, factors_json)
                VALUES %s
                ON CONFLICT (edge_id, time_bucket) DO UPDATE SET
                    score = EXCLUDED.score,
                    confidence = EXCLUDED.confidence,
                    factors_json = EXCLUDED.factors_json,
                    updated_at = NOW();
            """
            
            try:
                execute_values(cur, insert_sql, scores_to_insert, page_size=1000)
                self.conn.commit()
                logger.info(f"Stored {cur.rowcount} safety scores")
            except Exception as e:
                logger.error(f"Failed to store scores: {e}")
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
    parser = argparse.ArgumentParser(description="Compute safety scores for street edges")
    parser.add_argument("--database-url", default="dbname=saferstreets user=postgres password=password host=localhost",
                        help="PostgreSQL connection string")
    parser.add_argument("--output", default="/tmp/scores", help="Output directory")
    
    args = parser.parse_args()
    
    logger.info("Starting safety scoring pipeline")
    
    try:
        scorer = SafetyScorer(args.database_url)
        scorer.connect()
        
        # Load feature data
        edge_features = scorer.load_features()
        
        # Compute scores
        scores_to_insert = scorer.compute_all_scores(edge_features)
        
        # Store in database
        scorer.store_scores(scores_to_insert)
        
        logger.info("Scoring pipeline complete")
        
        scorer.close()
        
    except Exception as e:
        logger.error(f"Scoring failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
