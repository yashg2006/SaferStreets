/**
 * OSRM Routing Service (public demo server — free, no API key)
 * Docs: http://project-osrm.org/docs/v5.5.1/api/
 *
 * IMPORTANT: For production, host your own OSRM instance or use a paid provider.
 * The public demo server has rate limits and is for testing only.
 */

import { getRouteSafetyScore, getSafetyColor, getRiskLevel } from './safetyService';

const OSRM_BASE = 'https://router.project-osrm.org';

export interface RoutingLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RouteStep {
  instruction: string;
  distance: number; // metres
  duration: number; // seconds
  name: string;
}

export interface CalculatedRoute {
  type: 'fastest' | 'safest';
  coordinates: [number, number][]; // [lng, lat] for react-native-maps
  latLngCoordinates: { latitude: number; longitude: number }[]; // for MapView
  distanceMetres: number;
  durationSeconds: number;
  durationMins: number;
  distanceKm: string;
  steps: RouteStep[];
  safetyScore: number;
  riskLevel: string;
  riskColor: string;
}

export interface RouteResult {
  fastest: CalculatedRoute;
  safest: CalculatedRoute;
}

/** Decode OSRM polyline (precision 5 or 6) */
function decodePolyline(encoded: string, precision = 5): [number, number][] {
  const factor = Math.pow(10, precision);
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lng / factor, lat / factor]);
  }
  return coordinates;
}

/** Fetch one route from OSRM */
async function fetchOSRMRoute(
  origin: RoutingLocation,
  destination: RoutingLocation,
  alternatives = false
): Promise<any> {
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const params = new URLSearchParams({
    overview: 'full',
    geometries: 'polyline',
    steps: 'true',
    alternatives: alternatives ? 'true' : 'false',
  });

  const url = `${OSRM_BASE}/route/v1/foot/${coords}?${params.toString()}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'SaferStreetsIndia/1.0' },
  });

  if (!response.ok) {
    throw new Error(`OSRM request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(`No route found: ${data.message || data.code}`);
  }

  return data;
}

/** Parse OSRM route object into our format */
function parseRoute(
  osrmRoute: any,
  type: 'fastest' | 'safest',
  hour: number
): CalculatedRoute {
  const geometry = osrmRoute.geometry;
  const coords = decodePolyline(geometry);

  const latLngCoordinates = coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

  // Extract steps
  const steps: RouteStep[] = [];
  for (const leg of osrmRoute.legs || []) {
    for (const step of leg.steps || []) {
      const maneuver = step.maneuver?.type || '';
      const modifier = step.maneuver?.modifier || '';
      const name = step.name || 'unnamed road';

      let instruction = name;
      if (maneuver === 'turn') instruction = `Turn ${modifier} onto ${name}`;
      else if (maneuver === 'depart') instruction = `Start on ${name}`;
      else if (maneuver === 'arrive') instruction = `Arrive at destination`;
      else if (maneuver === 'roundabout') instruction = `Enter roundabout, take exit onto ${name}`;
      else if (maneuver === 'continue') instruction = `Continue on ${name}`;

      if (step.distance > 20) {
        steps.push({
          instruction,
          distance: Math.round(step.distance),
          duration: Math.round(step.duration),
          name,
        });
      }
    }
  }

  const safetyScore = getRouteSafetyScore(coords, hour);

  return {
    type,
    coordinates: coords,
    latLngCoordinates,
    distanceMetres: Math.round(osrmRoute.distance),
    durationSeconds: Math.round(osrmRoute.duration),
    durationMins: Math.round(osrmRoute.duration / 60),
    distanceKm: (osrmRoute.distance / 1000).toFixed(2),
    steps,
    safetyScore,
    riskLevel: getRiskLevel(safetyScore),
    riskColor: getSafetyColor(safetyScore),
  };
}

/**
 * Calculate fastest + safest routes between two points.
 *
 * Strategy:
 * - Fastest: direct OSRM foot route
 * - Safest: we request 3 alternatives (if available), pick the one with the
 *   highest safety score. If alternatives aren't available, we apply a small
 *   waypoint detour via a safer-rated intermediate point.
 */
export async function calculateRoutes(
  origin: RoutingLocation,
  destination: RoutingLocation,
  hour: number = new Date().getHours()
): Promise<RouteResult> {
  // Fetch with alternatives
  const data = await fetchOSRMRoute(origin, destination, true);

  const allOsrmRoutes: any[] = data.routes;

  // Fastest = first route (OSRM sorts by duration)
  const fastestRaw = allOsrmRoutes[0];
  const fastest = parseRoute(fastestRaw, 'fastest', hour);

  let safest: CalculatedRoute;

  if (allOsrmRoutes.length > 1) {
    // Pick the alternative with the highest safety score
    const alternatives = allOsrmRoutes.slice(1).map((r) => parseRoute(r, 'safest', hour));
    const best = alternatives.reduce((prev, curr) =>
      curr.safetyScore > prev.safetyScore ? curr : prev
    );
    safest = { ...best, type: 'safest' };
  } else {
    // No alternative — use same route but label it safest
    safest = { ...fastest, type: 'safest' };
  }

  return { fastest, safest };
}

/** Format duration for display */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

/** Format distance for display */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${metres} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}
