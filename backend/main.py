from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SafeRoute API")

# Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    safe_mode: bool

@app.get("/")
def read_root():
    return {"message": "Welcome to the SafeRoute Backend API"}

@app.post("/api/route")
def calculate_route(request: RouteRequest):
    # Mocking safety routing logic
    # In reality, you would query Mapbox Directions API here and apply weights based on safety data.
    
    if request.safe_mode:
        return {
            "status": "success",
            "type": "safest",
            "eta_mins": 24,
            "risk_level": "Low",
            "route_coordinates": [
                [request.start_lng, request.start_lat],
                # Mock a detour
                [request.start_lng + 0.002, request.start_lat + 0.003],
                [request.end_lng, request.end_lat]
            ]
        }
    else:
        return {
            "status": "success",
            "type": "fastest",
            "eta_mins": 18,
            "risk_level": "Medium",
            "route_coordinates": [
                [request.start_lng, request.start_lat],
                # Direct route
                [request.end_lng, request.end_lat]
            ]
        }

@app.get("/api/safety-heatmap")
def get_safety_heatmap():
    # Return mock risk zones
    return {
        "status": "success",
        "zones": [
            {
                "lat": 40.714,
                "lng": -74.005,
                "risk_score": 0.8, # 0 to 1
                "primary_factor": "Recent Theft"
            }
        ]
    }
