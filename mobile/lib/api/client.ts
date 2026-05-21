import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:8000';

export interface RouteRequest {
  origin_lng: number;
  origin_lat: number;
  destination_lng: number;
  destination_lat: number;
  safe_mode: boolean;
  time_bucket?: number;
  lambda_safety?: number;
}

export interface RouteResponse {
  status: string;
  type: 'fastest' | 'safest';
  eta_mins: number;
  distance_m: number;
  risk_level: 'Low' | 'Medium' | 'High';
  route_coordinates: Array<[number, number]>;
  factors: Record<string, string | number>;
}

export interface HeatmapRequest {
  min_lng: number;
  max_lng: number;
  min_lat: number;
  max_lat: number;
  time_bucket?: number;
}

export interface HeatmapResponse {
  status: string;
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: any;
    properties: {
      edge_id: string;
      safety_score: number;
      confidence: number;
      name?: string;
    };
  }>;
}

export interface SegmentDetailsResponse {
  edge_id: string;
  name?: string;
  safety_score: number;
  confidence: number;
  factors: Record<string, any>;
  crime_density: number;
  lighting?: boolean;
  last_updated: string;
}

export interface IncidentRequest {
  lat: number;
  lng: number;
  category: string;
  description?: string;
  photo_url?: string;
  anonymous?: boolean;
  user_id?: string;
}

export interface IncidentResponse {
  status: string;
  incident_id: string;
  message: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SaferStreetsApp/0.1.0'
      }
    });

    // Interceptor to add auth token if available
    this.client.interceptors.request.use(async (config) => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.warn('[API] Failed to retrieve auth token:', e);
      }
      return config;
    });

    // Error interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, trigger logout
          SecureStore.deleteItemAsync('auth_token').catch(() => {});
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Health check
   */
  async health() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('[API] Health check failed:', error);
      throw error;
    }
  }

  /**
   * Calculate route (fastest or safest)
   */
  async getRoute(request: RouteRequest): Promise<RouteResponse> {
    try {
      const response = await this.client.post<RouteResponse>('/api/route', {
        origin_lng: request.origin_lng,
        origin_lat: request.origin_lat,
        destination_lng: request.destination_lng,
        destination_lat: request.destination_lat,
        safe_mode: request.safe_mode,
        time_bucket: request.time_bucket,
        lambda_safety: request.lambda_safety || 1.0
      });
      return response.data;
    } catch (error) {
      console.error('[API] Failed to calculate route:', error);
      throw error;
    }
  }

  /**
   * Get heatmap data for bounding box
   */
  async getHeatmap(request: HeatmapRequest): Promise<HeatmapResponse> {
    try {
      const params = new URLSearchParams({
        min_lng: request.min_lng.toString(),
        max_lng: request.max_lng.toString(),
        min_lat: request.min_lat.toString(),
        max_lat: request.max_lat.toString()
      });

      if (request.time_bucket !== undefined) {
        params.append('time_bucket', request.time_bucket.toString());
      }

      const response = await this.client.get<HeatmapResponse>(
        `/api/heatmap?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('[API] Failed to fetch heatmap:', error);
      throw error;
    }
  }

  /**
   * Get details for a specific street segment
   */
  async getSegmentDetails(
    edgeId: string,
    timeBucket?: number
  ): Promise<SegmentDetailsResponse> {
    try {
      const params = timeBucket !== undefined ? { time_bucket: timeBucket } : {};
      const response = await this.client.get<SegmentDetailsResponse>(
        `/api/segments/${edgeId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('[API] Failed to fetch segment details:', error);
      throw error;
    }
  }

  /**
   * Submit incident report
   */
  async createIncident(request: IncidentRequest): Promise<IncidentResponse> {
    try {
      const response = await this.client.post<IncidentResponse>('/api/incidents', {
        lat: request.lat,
        lng: request.lng,
        category: request.category,
        description: request.description,
        photo_url: request.photo_url,
        anonymous: request.anonymous ?? true,
        user_id: request.user_id
      });
      return response.data;
    } catch (error) {
      console.error('[API] Failed to create incident:', error);
      throw error;
    }
  }

  /**
   * Get real-time weather and safety penalties
   */
  async getWeather(lat: number, lng: number) {
    try {
      const response = await this.client.get('/api/weather', {
        params: { lat, lng }
      });
      return response.data;
    } catch (error) {
      console.error('[API] Failed to fetch weather:', error);
      throw error;
    }
  }

  /**
   * Set auth token
   */
  async setAuthToken(token: string) {
    try {
      await SecureStore.setItemAsync('auth_token', token);
    } catch (error) {
      console.error('[API] Failed to save auth token:', error);
      throw error;
    }
  }

  /**
   * Clear auth token
   */
  async clearAuthToken() {
    try {
      await SecureStore.deleteItemAsync('auth_token');
    } catch (error) {
      console.error('[API] Failed to clear auth token:', error);
    }
  }
}

export const apiClient = new ApiClient();
