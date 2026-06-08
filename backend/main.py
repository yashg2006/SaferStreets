from fastapi import FastAPI, Depends, Request, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import os
import math
from datetime import datetime, timezone, timedelta

from database import engine, get_db
import models
import users

# Create database tables with startup connection checks
try:
    models.Base.metadata.create_all(bind=engine)
    print("[SaferStreets Database] PostgreSQL connected and tables initialized.")
except Exception as db_init_err:
    print(f"[SaferStreets Database Warning] PostgreSQL is offline during startup: {db_init_err}")
    print("Backend server will launch in visual simulation/mock mode.")

# Seed database with realistic crime/safety reports in Indian localities
from database import SessionLocal

# Coordinates matching the India mockup
LOC_SEED = [
    {"name": "Andheri East", "city": "Mumbai", "lat": 19.1136, "lng": 72.8697, "crime": 145, "type": "theft", "emoji": "🎒", "desc": "Evening purse snatching and pickpocketing reported near Andheri Metro station crowded areas."},
    {"name": "Dharavi", "city": "Mumbai", "lat": 19.0408, "lng": 72.8549, "crime": 312, "type": "harassment", "emoji": "😤", "desc": "Late-night harassment in poorly lit residential corridors. High density of narrow lanes makes navigation tricky."},
    {"name": "Bandra West", "city": "Mumbai", "lat": 19.0596, "lng": 72.8295, "crime": 87, "type": "suspicious", "emoji": "👁", "desc": "Suspicious loitering reported near Carter Road promenade during late hours."},
    {"name": "Colaba", "city": "Mumbai", "lat": 18.9068, "lng": 72.8147, "crime": 102, "type": "theft", "emoji": "🎒", "desc": "Opportunistic luggage theft from tourist cabs near Gateway of India region."},
    {"name": "Kurla West", "city": "Mumbai", "lat": 19.0728, "lng": 72.8826, "crime": 267, "type": "chain_snatching", "emoji": "⛓", "desc": "Chain snatching by motorcycle riders reported near Kurla Station West exit during rush hour."},
    {"name": "Worli", "city": "Mumbai", "lat": 19.0177, "lng": 72.8177, "crime": 95, "type": "road_hazard", "emoji": "🚧", "desc": "Construction material hazard and poor lighting near Sea Link approach roads."},
    {"name": "Borivali East", "city": "Mumbai", "lat": 19.2281, "lng": 72.8567, "crime": 118, "type": "broken_light", "emoji": "💡", "desc": "Broken street lamps reported on the lanes leading to National Park entry."},
    {"name": "Govandi", "city": "Mumbai", "lat": 19.0558, "lng": 72.9183, "crime": 285, "type": "robbery", "emoji": "🔪", "desc": "Armed robbery at knifepoint reported near secluded railway crossing area after 10 PM."},
    {"name": "Connaught Place", "city": "Delhi", "lat": 28.6315, "lng": 77.2167, "crime": 156, "type": "theft", "emoji": "🎒", "desc": "Subway pocket-picking inside Rajiv Chowk metro station interchange corridors."},
    {"name": "Paharganj", "city": "Delhi", "lat": 28.6448, "lng": 77.2097, "crime": 298, "type": "harassment", "emoji": "😤", "desc": "Persistent tourist scamming and harassment near backpacker hotel alleys."},
    {"name": "Saket", "city": "Delhi", "lat": 28.5289, "lng": 77.2065, "crime": 78, "type": "suspicious", "emoji": "👁", "desc": "Unauthorized vehicle loitering and loud drinking near sports complex boundary walls."},
    {"name": "Karol Bagh", "city": "Delhi", "lat": 28.6519, "lng": 77.1909, "crime": 185, "type": "chain_snatching", "emoji": "⛓", "desc": "Snatching of gold necklaces in crowded market lanes of Karol Bagh."},
    {"name": "Rohini Sec 3", "city": "Delhi", "lat": 28.7358, "lng": 77.1147, "crime": 132, "type": "broken_light", "emoji": "💡", "desc": "Public park lighting completely dysfunctional, leading to high theft risk at night."},
    {"name": "Dwarka Sec 6", "city": "Delhi", "lat": 28.5921, "lng": 77.0460, "crime": 88, "type": "other", "emoji": "📌", "desc": "Frequent power outages leading to dark street stretches on major intersection."},
    {"name": "Mustafabad", "city": "Delhi", "lat": 28.7267, "lng": 77.2755, "crime": 356, "type": "assault", "emoji": "🚨", "desc": "Physical altercation and assault reported at local marketplace over business dispute."},
    {"name": "Koramangala", "city": "Bengaluru", "lat": 12.9352, "lng": 77.6245, "crime": 72, "type": "eve_teasing", "emoji": "⚠️", "desc": "Eve teasing reported near popular cafe streets during weekend late night hours."},
    {"name": "Whitefield", "city": "Bengaluru", "lat": 12.9698, "lng": 77.7500, "crime": 65, "type": "theft", "emoji": "🎒", "desc": "Larceny from parked cars in secondary IT park access lanes."},
    {"name": "Shivajinagar", "city": "Bengaluru", "lat": 12.9850, "lng": 77.6011, "crime": 178, "type": "harassment", "emoji": "😤", "desc": "Aggressive street vendors and harassment reported near Commercial Street transit points."},
    {"name": "Majestic", "city": "Bengaluru", "lat": 12.9784, "lng": 77.5706, "crime": 245, "type": "robbery", "emoji": "🔪", "desc": "Late-night bag snatching and robbery under the railway flyover walk."},
    {"name": "T Nagar", "city": "Chennai", "lat": 13.0418, "lng": 80.2341, "crime": 112, "type": "chain_snatching", "emoji": "⛓", "desc": "Chain snatching of evening shoppers walking towards Pondy Bazaar market."},
    {"name": "Anna Nagar", "city": "Chennai", "lat": 13.0850, "lng": 80.2101, "crime": 68, "type": "road_hazard", "emoji": "🚧", "desc": "Open storm-water drain posing severe danger to pedestrians at night."},
    {"name": "Vyasarpadi", "city": "Chennai", "lat": 13.1150, "lng": 80.2543, "crime": 289, "type": "assault", "emoji": "🚨", "desc": "Street fight and physical assault reported near local playground."},
    {"name": "Banjara Hills", "city": "Hyderabad", "lat": 17.4156, "lng": 78.4347, "crime": 65, "type": "suspicious", "emoji": "👁", "desc": "Suspicious vehicles parked near isolated residential compounds after 1 AM."},
    {"name": "Secunderabad", "city": "Hyderabad", "lat": 17.4399, "lng": 78.4983, "crime": 132, "type": "theft", "emoji": "🎒", "desc": "Pickpocketing of rail passengers outside Secunderabad Station exit points."},
    {"name": "Charminar", "city": "Hyderabad", "lat": 17.3616, "lng": 78.4747, "crime": 278, "type": "harassment", "emoji": "😤", "desc": "Eve teasing and persistent harassment of historical site visitors in heavy crowds."},
    {"name": "Koregaon Park", "city": "Pune", "lat": 18.5362, "lng": 73.8944, "crime": 58, "type": "other", "emoji": "📌", "desc": "Rash driving and street drag-racing reported on North Main Road in early morning hours."},
    {"name": "Swargate", "city": "Pune", "lat": 18.5018, "lng": 73.8606, "crime": 165, "type": "theft", "emoji": "🎒", "desc": "Mobile phone snatching inside the Swargate ST bus stand boarding platforms."},
    {"name": "Park Street", "city": "Kolkata", "lat": 22.5518, "lng": 88.3525, "crime": 95, "type": "harassment", "emoji": "😤", "desc": "Verbal harassment of female pedestrians by drunk revellers near night clubs."},
    {"name": "Howrah", "city": "Kolkata", "lat": 22.5958, "lng": 88.2636, "crime": 198, "type": "theft", "emoji": "🎒", "desc": "Luggage lifting and pickpocketing outside Howrah Railway Station entry lanes."},
    {"name": "Navrangpura", "city": "Ahmedabad", "lat": 23.0395, "lng": 72.5615, "crime": 88, "type": "suspicious", "emoji": "👁", "desc": "Loitering and suspicious groups gathered near university campus gates."},
    {"name": "Civil Lines", "city": "Jaipur", "lat": 26.9124, "lng": 75.7873, "crime": 92, "type": "broken_light", "emoji": "💡", "desc": "Street lights completely out on the VIP road stretch, creating blind spots."},
    {"name": "Walled City", "city": "Jaipur", "lat": 26.9239, "lng": 75.8267, "crime": 215, "type": "theft", "emoji": "🎒", "desc": "Pocket picking of domestic and foreign tourists inside Johari Bazaar crowded shops."},
    {"name": "Hazratganj", "city": "Lucknow", "lat": 26.8467, "lng": 80.9462, "crime": 138, "type": "harassment", "emoji": "😤", "desc": "Stalking and verbal harassment of college students on primary commercial walkways."},
    {"name": "Aminabad", "city": "Lucknow", "lat": 26.8487, "lng": 80.9337, "crime": 225, "type": "chain_snatching", "emoji": "⛓", "desc": "Chain snatching from elderly ladies walking inside narrow shopping gullies."}
]

def seed_data():
    db = SessionLocal()
    try:
        if db.query(models.Report).count() == 0:
            print("Seeding database with realistic safety/crime reports in India...")
            for item in LOC_SEED:
                point = f"SRID=4326;POINT({item['lng']} {item['lat']})"
                
                # We calculate a realistic risk score from the mockup's crime index
                # Higher crime index = higher risk score
                base_risk = min(1.0, max(0.1, item["crime"] / 320.0))
                
                report = models.Report(
                    report_type=item["type"],
                    description=item["desc"],
                    lat=item["lat"],
                    lng=item["lng"],
                    location=point,
                    risk_score=base_risk,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(report)
            db.commit()
            print(f"Successfully seeded {len(LOC_SEED)} realistic crime/safety reports across India!")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

seed_data()

app = FastAPI(title="SaferStreets India Backend API")

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "capacitor://localhost",
        "http://localhost"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes
app.include_router(
    users.fastapi_users.get_auth_router(users.auth_backend),
    prefix="/auth/jwt",
    tags=["auth"]
)
app.include_router(
    users.fastapi_users.get_register_router(users.UserRead, users.UserCreate),
    prefix="/auth",
    tags=["auth"]
)

import requests
from fastapi import HTTPException
from users import get_jwt_strategy, User

class GoogleLoginRequest(BaseModel):
    token: str

@app.post("/auth/google")
async def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    # 1. Verify token with Google API securely
    try:
        res = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.token}")
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google OAuth token")
        idinfo = res.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(e)}")

    # 2. Extract email and verify audience/domain if needed
    email = idinfo.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="OAuth scope missing email address")

    # 3. Find or create user inside PostgreSQL with simulated fallback if DB is offline
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Generate random password since Google users don't need manual passwords
            import secrets
            random_pwd = secrets.token_hex(16)
            
            from fastapi_users.password import PasswordHelper
            ph = PasswordHelper()
            hashed_pwd = ph.hash(random_pwd)

            user = User(
                email=email,
                hashed_password=hashed_pwd,
                is_active=True,
                is_verified=True,
                is_superuser=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    except Exception as db_err:
        print(f"[SaferStreets Backend Warning] PostgreSQL offline: {db_err}. Initiating local memory-session login fallback...")
        class SimulatedUser:
            id = 777
            email = email
            is_active = True
            is_verified = True
            is_superuser = False
        user = SimulatedUser()

    # 4. Generate JWT — try fastapi-users strategy, fall back to plain jose if DB is offline
    try:
        strategy = get_jwt_strategy()
        token_value = await strategy.write_token(user)
    except Exception as jwt_err:
        print(f"[SaferStreets JWT] fastapi-users token failed ({jwt_err}), using fallback...")
        from jose import jwt as jose_jwt
        SECRET_KEY = os.getenv("SECRET", "saferstreets_jwt_secret_2024_india")
        token_value = jose_jwt.encode(
            {
                "sub": str(user.id),
                "email": str(user.email),
                "aud": "fastapi-users:auth",
                "exp": datetime.now(timezone.utc) + timedelta(days=7)
            },
            SECRET_KEY,
            algorithm="HS256"
        )

    return {
        "access_token": token_value,
        "token_type": "bearer",
        "email": user.email,
        "id": user.id
    }


# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/ws/reports")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def async_broadcast(message: dict):
    await manager.broadcast(message)

class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    safe_mode: bool

class ReportCreate(BaseModel):
    report_type: str
    description: str
    lat: float
    lng: float

class AITipsRequest(BaseModel):
    locality: str
    city: str
    state: str
    crime_index: float
    lights: float
    cctv: float
    police: float
    score: float
    night: bool

@app.post("/api/reports")
@limiter.limit("20/minute")
def create_report(
    request: Request,
    report: ReportCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Optional authentication bypass: we allow any guest to report for public crowdsourced safety!
    # Convert lat/lng to WKT format for PostGIS
    point = f"SRID=4326;POINT({report.lng} {report.lat})"
    
    new_report = models.Report(
        report_type=report.report_type,
        description=report.description,
        lat=report.lat,
        lng=report.lng,
        location=point,
        risk_score=1.0,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    # Broadcast to all clients
    new_zone = {
        "lat": new_report.lat,
        "lng": new_report.lng,
        "risk_score": 1.0,
        "primary_factor": new_report.report_type,
        "description": new_report.description,
        "time": "Just now"
    }
    background_tasks.add_task(async_broadcast, {"type": "new_report", "report": new_zone})
    
    return {"status": "success", "id": new_report.id}

@app.get("/")
def read_root():
    return {"message": "Welcome to SaferStreets India Backend API running with PostgreSQL/PostGIS"}

@app.post("/api/route")
def calculate_route(request: RouteRequest, db: Session = Depends(get_db)):
    # ── ADVANCED SAFETY-AWARE STREET ROUTER ──
    # Fetches real road/foot paths from OSRM, scores them based on crime proximity,
    # street lights and cctv density, and detours safely via well-lit waypoints.
    
    start_lat, start_lng = request.start_lat, request.start_lng
    end_lat, end_lng = request.end_lat, request.end_lng
    
    profile = "foot"  # safety-first walking/pedestrian router
    
    def get_osrm_path(coords_list):
        coords_str = ";".join([f"{lng},{lat}" for lat, lng in coords_list])
        url = f"http://router.project-osrm.org/route/v1/{profile}/{coords_str}?overview=full&geometries=geojson"
        try:
            r = requests.get(url, timeout=5)
            if r.status_code == 200:
                data = r.json()
                if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                    route = data["routes"][0]
                    return {
                        "coordinates": route["geometry"]["coordinates"],  # [[lng, lat], ...]
                        "duration": route["duration"],  # seconds
                        "distance": route["distance"]  # meters
                    }
        except Exception as e:
            print(f"[SaferStreets OSRM] Router fetch failed: {e}")
        return None

    # Fetch standard direct street route
    direct_route = get_osrm_path([[start_lat, start_lng], [end_lat, end_lng]])
    
    if not direct_route:
        # Fallback to curved mockup route if OSRM is unreachable
        mid_lat = (start_lat + end_lat) / 2
        mid_lng = (start_lng + end_lng) / 2
        detour_lat = mid_lat - 0.003
        detour_lng = mid_lng + 0.003
        
        fallback_coords = (
            [[start_lng, start_lat], [detour_lng, detour_lat], [end_lng, end_lat]]
            if request.safe_mode
            else [[start_lng, start_lat], [mid_lng, mid_lat], [end_lng, end_lat]]
        )
        return {
            "status": "success",
            "type": "safest" if request.safe_mode else "fastest",
            "eta_mins": max(2, round(15 + abs(start_lat - end_lat) * 200)),
            "risk_level": "Medium (Fallback Router)",
            "route_coordinates": fallback_coords
        }

    # Fetch database reports/crime incidents to compute safety score of route coordinates
    try:
        reports = db.query(models.Report).all()
    except Exception:
        reports = []

    # Score any coordinate point for safety based on crime incidents, lights & cctv
    def get_coordinate_safety(lat, lng):
        penalty = 0
        # Check nearby incidents (within ~200 meters)
        for r in reports:
            dist = math.hypot(r.lat - lat, r.lng - lng)
            if dist < 0.0018:  # approx 180 meters
                penalty += (r.risk_score or 1.0) * 35  # Apply solid weight to crime areas

        # Find nearest locality from LOC_SEED to evaluate lights & cctv
        nearest_loc = None
        min_dist = float('inf')
        for loc in LOC_SEED:
            dist = math.hypot(loc["lat"] - lat, loc["lng"] - lng)
            if dist < min_dist:
                min_dist = dist
                nearest_loc = loc

        safety_score = 100 - penalty
        if nearest_loc and min_dist < 0.015:  # within 1.5km
            # Lights and CCTV density boost the safety rating
            lights_val = 100 - min(60, nearest_loc["crime"] * 0.2)
            safety_score += (lights_val - 50) * 0.15 + (nearest_loc.get("cctv", 2.0) * 0.8)
            
        return max(0.0, min(100.0, safety_score))

    # Evaluate safety for the entire OSRM path
    def score_path(coords):
        if not coords:
            return 50.0
        # Sample points along the route to keep scoring extremely fast
        sample_rate = max(1, len(coords) // 15)
        sampled = coords[::sample_rate]
        scores = [get_coordinate_safety(pt[1], pt[0]) for pt in sampled]
        return sum(scores) / len(scores) if scores else 50.0

    direct_score = score_path(direct_route["coordinates"])

    # If Safe Mode is requested, let's seek a detour via a safe midpoint waypoint
    if request.safe_mode:
        mid_lat = (start_lat + end_lat) / 2
        mid_lng = (start_lng + end_lng) / 2
        
        # Find the safest nearby locality to act as a routing waypoint
        best_waypoint = None
        best_safety_factor = -1
        
        for loc in LOC_SEED:
            dist_to_mid = math.hypot(loc["lat"] - mid_lat, loc["lng"] - mid_lng)
            # Find safe localities within 2.5km of the midpoint
            if dist_to_mid < 0.025:
                # Lower crime index is safer
                safety_factor = 500 - loc["crime"]
                if safety_factor > best_safety_factor:
                    best_safety_factor = safety_factor
                    best_waypoint = loc
                    
        if best_waypoint:
            # Query OSRM to construct a route via the safe waypoint
            safe_route = get_osrm_path([
                [start_lat, start_lng],
                [best_waypoint["lat"], best_waypoint["lng"]],
                [end_lat, end_lng]
            ])
            
            if safe_route:
                safe_score = score_path(safe_route["coordinates"])
                
                # Check if safety is indeed higher, or if we force detour
                if safe_score >= direct_score - 10:
                    risk_level = "Low" if safe_score >= 70 else "Medium" if safe_score >= 45 else "High"
                    return {
                        "status": "success",
                        "type": "safest",
                        "eta_mins": max(2, round(safe_route["duration"] / 60)),
                        "risk_level": f"{risk_level} ({round(safe_score)}/100 Safety)",
                        "route_coordinates": safe_route["coordinates"]
                    }

    # Default to direct fastest route
    risk_level = "Low" if direct_score >= 70 else "Medium" if direct_score >= 45 else "High"
    return {
        "status": "success",
        "type": "fastest",
        "eta_mins": max(1, round(direct_route["duration"] / 60)),
        "risk_level": f"{risk_level} ({round(direct_score)}/100 Safety)",
        "route_coordinates": direct_route["coordinates"]
    }


@app.get("/api/safety-heatmap")
def get_safety_heatmap(db: Session = Depends(get_db)):
    reports = db.query(models.Report).all()
    zones = []
    now = datetime.now(timezone.utc)
    
    for r in reports:
        if r.created_at:
            created = r.created_at if r.created_at.tzinfo else r.created_at.replace(tzinfo=timezone.utc)
            days_ago = (now - created).total_seconds() / (60 * 60 * 24)
        else:
            days_ago = 0
            
        # Exponential decay: score halves every 15 days in this public report model
        decayed_risk = r.risk_score * math.pow(0.5, max(0, days_ago) / 15.0)
        
        if decayed_risk > 0.05:
            zones.append({
                "lat": r.lat,
                "lng": r.lng,
                "risk_score": round(decayed_risk, 3),
                "primary_factor": r.report_type,
                "description": r.description or "Safety Incident",
                "time": f"{round(days_ago * 24)}h ago" if days_ago > 0 else "Recent"
            })
            
    return {
        "status": "success",
        "zones": zones
    }

def get_grade(score):
    return 'A' if score >= 75 else 'B' if score >= 55 else 'C' if score >= 35 else 'D'

def get_label(score):
    return 'Very Safe' if score >= 75 else 'Mostly Safe' if score >= 55 else 'Use Caution' if score >= 35 else 'High Risk'

@app.post("/api/ai-tips")
def get_ai_tips(req: AITipsRequest):
    # Rule-based safety tips fallback generator providing high-end safety analysis
    # tailored directly to the specific metrics of the locality.
    locality = req.locality
    city = req.city
    state = req.state
    crime_index = req.crime_index
    lights = req.lights
    cctv = req.cctv
    police = req.police
    score = req.score
    night = req.night
    
    tips = []
    summary = f"{locality} is rated {get_grade(score)} ({get_label(score)}) with a safety score of {score}/100."
    
    # Custom tailored tips based on metrics
    if night:
        tips.append("🌙 Night Adjustment Active: Street-level visibility decreases safety scores. Stick to illuminated main avenues.")
    
    if crime_index > 200:
        tips.append(f"🎒 High Crime Activity: Active pockets of property theft and chain snatching. Keep all items, wallets, and mobile devices secure.")
    elif crime_index > 100:
        tips.append("🎒 Moderate Crime Activity: Opportunistic thefts are common in crowded spots. Exercise average street alertness.")
        
    if lights < 50:
        tips.append(f"💡 Low Street Lighting ({lights}%): Avoid poorly lit lanes or park paths after dark. Plan routes that stick to commercial corridors.")
    else:
        tips.append(f"💡 Excellent Street Lighting ({lights}%): Major streets are bright. Safe to transit during evenings.")
        
    if cctv < 2.0:
        tips.append(f"📷 Low CCTV coverage ({cctv}/km²): Alleys have blind spots. Prefer lanes with active shop cameras.")
    else:
        tips.append(f"📷 High CCTV coverage ({cctv}/km²): Active camera coverage serves as an excellent deterrent against street harassment.")
        
    if police > 1.5:
        tips.append(f"🚔 Police Proximity: Nearest station is {police} km away. In emergencies, call 112 directly instead of relying on foot patrol.")
    else:
        tips.append(f"🚔 Rapid Response Zone: A police station is located within {police} km. Active street policing is highly prominent.")
        
    # Always guarantee 4 detailed custom safety tips
    while len(tips) < 4:
        tips.append("🛡️ Urban Vigilance: Standard safety measures apply. Share your live tracking coordinates with trusted family members.")
        
    return {
        "tips": tips[:4],
        "summary": summary
    }
