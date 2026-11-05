import {
  WORLD_BOUNDS,
  TOWER_COORDS,
  GeoPoint,
  GridPoint,
} from '@ocean-pulse/shared';

export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Compass bearing (0 = North, 90 = East, 180 = South, 270 = West)
 * to math / canvas angle (where 0 = East, π/2 = South, π = West, -π/2 = North in canvas coordinates)
 */
export function bearingToAngle(bearingDeg: number): number {
  return Math.atan2(-Math.cos(bearingDeg * D2R), Math.sin(bearingDeg * D2R));
}

/**
 * Math / canvas angle to compass bearing (0 - 360 deg)
 */
export function angleToBearing(angleRad: number): number {
  return ((Math.atan2(Math.cos(angleRad), -Math.sin(angleRad)) * R2D) + 360) % 360;
}

/**
 * Angular difference normalized to [-π, π]
 */
export function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/**
 * Returns 8-point compass label (N, NE, E, SE, S, SW, W, NW)
 */
export function compassDirection(bearingDeg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round((((bearingDeg % 360) + 360) % 360) / 45) % 8;
  return directions[index];
}

/**
 * Coastline X position (in km from west boundary) as a function of Y (latitude coordinate)
 */
export function coastX(yKm: number): number {
  return 11 + 4 * Math.sin(yKm * 0.12) + 3 * Math.sin(yKm * 0.31 + 1);
}

/**
 * Convert km grid coordinates to Latitude / Longitude
 */
export function gridToGeo(point: GridPoint): GeoPoint {
  const lat = WORLD_BOUNDS.originLat + (point.y / WORLD_BOUNDS.kmPerDegreeLat);
  const lng = WORLD_BOUNDS.originLng + (point.x / WORLD_BOUNDS.kmPerDegreeLng);
  return { lat, lng };
}

/**
 * Convert Latitude / Longitude to km grid coordinates
 */
export function geoToGrid(geo: GeoPoint): GridPoint {
  const x = (geo.lng - WORLD_BOUNDS.originLng) * WORLD_BOUNDS.kmPerDegreeLng;
  const y = (geo.lat - WORLD_BOUNDS.originLat) * WORLD_BOUNDS.kmPerDegreeLat;
  return { x, y };
}

/**
 * Haversine formula for real-world nautical distance calculation in km
 */
export function haversineDistanceKm(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371; // Earth radius in km
  const dLat = (p2.lat - p1.lat) * D2R;
  const dLng = (p2.lng - p1.lng) * D2R;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * D2R) * Math.cos(p2.lat * D2R) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
