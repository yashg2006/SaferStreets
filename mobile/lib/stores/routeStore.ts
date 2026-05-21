import { create } from 'zustand';
import { CalculatedRoute } from '../services/routingService';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RouteState {
  // Inputs
  origin: Location | null;
  destination: Location | null;
  safeMode: boolean;
  timeBucket: number;
  lambdaSafety: number;
  
  // Routes
  fastestRoute: CalculatedRoute | null;
  safestRoute: CalculatedRoute | null;
  activeRoute: 'fastest' | 'safest' | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedCity: string;
  
  // Actions
  setOrigin: (location: Location | null) => void;
  setDestination: (location: Location | null) => void;
  setSafeMode: (safeMode: boolean) => void;
  setTimeBucket: (hour: number) => void;
  setLambdaSafety: (lambda: number) => void;
  setFastestRoute: (route: CalculatedRoute | null) => void;
  setSafestRoute: (route: CalculatedRoute | null) => void;
  setActiveRoute: (route: 'fastest' | 'safest' | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedCity: (city: string) => void;
  
  // Computed
  hasValidRoute: () => boolean;
  isRouteCalculating: () => boolean;
  clearRoute: () => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  // Initial state
  origin: null,
  destination: null,
  safeMode: true,
  timeBucket: new Date().getHours(),
  lambdaSafety: 1.5,
  
  fastestRoute: null,
  safestRoute: null,
  activeRoute: null,
  
  isLoading: false,
  error: null,
  selectedCity: 'Delhi',
  
  // Actions
  setOrigin: (location) => set({ origin: location }),
  setDestination: (location) => set({ destination: location }),
  setSafeMode: (safeMode) => set({ safeMode }),
  setTimeBucket: (hour) => set({ timeBucket: Math.max(0, Math.min(23, hour)) }),
  setLambdaSafety: (lambda) => set({ lambdaSafety: Math.max(1.0, Math.min(5.0, lambda)) }),
  
  setFastestRoute: (route) => set({ fastestRoute: route }),
  setSafestRoute: (route) => set({ safestRoute: route }),
  setActiveRoute: (route) => set({ activeRoute: route }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSelectedCity: (city) => set({ selectedCity: city }),
  
  // Computed
  hasValidRoute: () => {
    const state = get();
    return state.origin !== null && state.destination !== null && state.activeRoute !== null;
  },
  
  isRouteCalculating: () => {
    return get().isLoading;
  },
  
  clearRoute: () => {
    set({
      fastestRoute: null,
      safestRoute: null,
      activeRoute: null,
      error: null
    });
  }
}));
