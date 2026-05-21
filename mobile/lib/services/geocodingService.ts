/**
 * Nominatim Geocoding Service (OpenStreetMap — free, no API key required)
 * Docs: https://nominatim.org/release-docs/latest/api/Search/
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'SaferStreetsIndia/1.0 (street-safety-app)';

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  shortName: string;
  placeId: string;
  type: string;
  importance: number;
}

export interface ReverseGeocodingResult {
  displayName: string;
  shortName: string;
  city: string;
  state: string;
  country: string;
}

/**
 * Search for a location by address string (biased to India)
 */
export async function searchAddress(
  query: string,
  limit = 5
): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: limit.toString(),
    countrycodes: 'in',
    addressdetails: '1',
    'accept-language': 'en',
  });

  const url = `${NOMINATIM_BASE}/search?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  const data = await response.json();

  return data.map((item: any) => {
    const address = item.address || {};
    const shortName =
      address.road ||
      address.suburb ||
      address.neighbourhood ||
      address.city ||
      address.town ||
      item.display_name.split(',')[0];

    return {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      shortName,
      placeId: item.place_id?.toString() || '',
      type: item.type || '',
      importance: item.importance || 0,
    };
  });
}

/**
 * Reverse geocode — lat/lng to address string
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodingResult> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'json',
    addressdetails: '1',
    'accept-language': 'en',
  });

  const url = `${NOMINATIM_BASE}/reverse?${params.toString()}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.status}`);
  }

  const data = await response.json();
  const address = data.address || {};

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    '';

  const shortName =
    address.road ||
    address.suburb ||
    address.neighbourhood ||
    city ||
    data.display_name.split(',')[0];

  return {
    displayName: data.display_name || '',
    shortName,
    city,
    state: address.state || '',
    country: address.country || 'India',
  };
}

/**
 * Popular Indian landmark suggestions for quick access
 */
export const POPULAR_PLACES = [
  { name: 'India Gate, New Delhi', lat: 28.6129, lng: 77.2295 },
  { name: 'Connaught Place, Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Gateway of India, Mumbai', lat: 18.9219, lng: 72.8347 },
  { name: 'Marine Drive, Mumbai', lat: 18.9438, lng: 72.8238 },
  { name: 'MG Road, Bengaluru', lat: 12.9757, lng: 77.6074 },
  { name: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 },
  { name: 'Marina Beach, Chennai', lat: 13.0522, lng: 80.2825 },
  { name: 'Lal Bagh, Bengaluru', lat: 12.9507, lng: 77.5848 },
  { name: 'Hawa Mahal, Jaipur', lat: 26.9239, lng: 75.8267 },
  { name: 'Taj Mahal, Agra', lat: 27.1751, lng: 78.0421 },
  { name: 'Charminar, Hyderabad', lat: 17.3616, lng: 78.4747 },
  { name: 'Howrah Bridge, Kolkata', lat: 22.5851, lng: 88.3468 },
  { name: 'Vaishno Devi, Jammu', lat: 33.03, lng: 74.95 },
  { name: 'Dadar, Mumbai', lat: 19.018, lng: 72.843 },
  { name: 'Andheri West, Mumbai', lat: 19.136, lng: 72.827 },
];
