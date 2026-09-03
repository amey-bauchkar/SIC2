/**
 * MandiMitra Core: Geodesic & Road Distance Estimation
 * Pure mathematical implementation of Haversine distance with road correction factor.
 * 
 * OWNER: Amay (Team Lead)
 */

import { config } from '../config';

const EARTH_RADIUS_KM = 6371.0088;

/**
 * Calculates great-circle Haversine distance in kilometers between two lat/lon coordinates.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates estimated road distance in kilometers using the empirical 1.35x road factor.
 * road_distance_km = haversine(farmer, market) * 1.35
 */
export function estimateRoadDistanceKm(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number,
  roadFactor: number = config.roadDistanceFactor
): number {
  const straightLine = haversineDistanceKm(lat1, lon1, lat2, lon2);
  return straightLine * roadFactor;
}
