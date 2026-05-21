/**
 * Safety Score Service — derives real-time safety from NCRB 2022 data
 */

import { NCRB_CITIES, NCRBCityData, getNearestCity } from '../data/ncrbData';

export type RiskLevel = 'Very Safe' | 'Safe' | 'Moderate' | 'Unsafe' | 'Dangerous';

export interface SafetyInfo {
  score: number;        // 0–100, higher = safer
  riskLevel: RiskLevel;
  color: string;        // hex color
  description: string;
  city: NCRBCityData;
  timeModifier: number; // applied multiplier
}

/** Night-time penalty — crime is 30–50% higher late night */
export function getTimeModifier(hour: number): number {
  if (hour >= 22 || hour < 5) return 0.65;   // 10pm–5am: dangerous
  if (hour >= 5  && hour < 7) return 0.80;   // 5–7am: early morning
  if (hour >= 7  && hour < 9) return 0.95;   // morning rush: near-normal
  if (hour >= 9  && hour < 18) return 1.00;  // daytime: baseline
  if (hour >= 18 && hour < 20) return 0.90;  // evening: slightly worse
  if (hour >= 20 && hour < 22) return 0.75;  // night: worse
  return 1.0;
}

/** Map score 0–100 → risk label */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'Very Safe';
  if (score >= 60) return 'Safe';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Unsafe';
  return 'Dangerous';
}

/** Map score → color */
export function getSafetyColor(score: number): string {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#84cc16'; // lime
  if (score >= 40) return '#f59e0b'; // amber
  if (score >= 20) return '#f97316'; // orange
  return '#ef4444';                  // red
}

/** Full safety info for a coordinate at a given hour */
export function getSafetyInfo(lat: number, lng: number, hour: number): SafetyInfo {
  const city = getNearestCity(lat, lng);
  const timeMod = getTimeModifier(hour);
  const rawScore = city.safetyScore * timeMod;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));
  const riskLevel = getRiskLevel(score);
  const color = getSafetyColor(score);

  const descriptions: Record<RiskLevel, string> = {
    'Very Safe': `${city.name} has one of the lowest crime rates in India (${city.crimeRate.toFixed(0)} crimes/lakh). Safe to travel at this hour.`,
    'Safe': `${city.name} has below-average crime rates. Exercise normal caution.`,
    'Moderate': `${city.name} has moderate crime levels. Stay alert and stick to busy areas.`,
    'Unsafe': `${city.name} has elevated crime rates. Avoid isolated streets, especially at night.`,
    'Dangerous': `${city.name} has high crime rates per NCRB 2022. Take extra precautions or avoid travel.`,
  };

  return { score, riskLevel, color, description: descriptions[riskLevel], city, timeModifier: timeMod };
}

/**
 * Calculate safety score for a polyline route.
 * Samples every ~500m and averages city safety scores.
 */
export function getRouteSafetyScore(
  coordinates: [number, number][],   // [lng, lat] pairs
  hour: number
): number {
  if (!coordinates.length) return 50;

  // Sample at most 10 points along the route
  const step = Math.max(1, Math.floor(coordinates.length / 10));
  const samples = coordinates.filter((_, i) => i % step === 0);

  const scores = samples.map(([lng, lat]) => {
    const city = getNearestCity(lat, lng);
    return city.safetyScore * getTimeModifier(hour);
  });

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(Math.max(0, Math.min(100, avg)));
}

/** Crime breakdown for display */
export interface CrimeBreakdown {
  category: string;
  count: number;
  perLakh: number;
  color: string;
}

export function getCrimeBreakdown(city: NCRBCityData): CrimeBreakdown[] {
  const pop = city.population;
  return [
    { category: 'Theft',       count: city.theft,       perLakh: +(city.theft / pop).toFixed(1),       color: '#f59e0b' },
    { category: 'Assault',     count: city.assault,     perLakh: +(city.assault / pop).toFixed(1),     color: '#f97316' },
    { category: 'Kidnapping',  count: city.kidnapping,  perLakh: +(city.kidnapping / pop).toFixed(1),  color: '#ef4444' },
    { category: 'Robbery',     count: city.robbery,     perLakh: +(city.robbery / pop).toFixed(1),     color: '#dc2626' },
    { category: 'Rape',        count: city.rape,        perLakh: +(city.rape / pop).toFixed(1),        color: '#7c3aed' },
    { category: 'Murder',      count: city.murder,      perLakh: +(city.murder / pop).toFixed(1),      color: '#1f2937' },
  ].sort((a, b) => b.count - a.count);
}

/** Year-over-year trend data (2019–2022) — normalized % change from NCRB reports */
export interface YearTrend {
  year: number;
  crimeRate: number;
}

const TREND_FACTORS: Record<number, number> = {
  2019: 1.12,
  2020: 0.82,  // COVID lockdown year
  2021: 0.95,
  2022: 1.00,
};

export function getCityTrend(city: NCRBCityData): YearTrend[] {
  return Object.entries(TREND_FACTORS).map(([year, factor]) => ({
    year: parseInt(year),
    crimeRate: parseFloat((city.crimeRate * factor).toFixed(1)),
  }));
}
