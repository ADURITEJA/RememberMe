/**
 * Geospatial helpers for safety zones.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SafetyZoneGeo {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
  isActive?: boolean;
}

export type ZoneStatus =
  | "INSIDE"
  | "OUTSIDE"
  | "INACTIVE"
  | "NO_DEVICE_LOCATION";

const EARTH_RADIUS_M = 6371000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle distance between two points in meters (haversine).
 */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * True when a coordinate is within a zone's radius.
 */
export function isInsideZone(
  point: LatLng | null | undefined,
  zone: SafetyZoneGeo,
): ZoneStatus {
  if (!point) return "NO_DEVICE_LOCATION";
  if (zone.isActive === false) return "INACTIVE";
  const distance = haversineDistance(point, {
    lat: zone.lat,
    lng: zone.lng,
  });
  return distance <= zone.radius ? "INSIDE" : "OUTSIDE";
}

/**
 * Check a coordinate against many zones at once. Returns the closest zone
 * (by distance) and whether the point is inside it.
 */
export function checkAllZones(
  point: LatLng | null | undefined,
  zones: SafetyZoneGeo[],
): { zone: SafetyZoneGeo | null; inside: boolean; distanceM: number | null } {
  if (!point || zones.length === 0) {
    return { zone: zones[0] ?? null, inside: false, distanceM: null };
  }
  let closest: SafetyZoneGeo | null = null;
  let closestDistance = Infinity;
  for (const zone of zones) {
    const distance = haversineDistance(point, {
      lat: zone.lat,
      lng: zone.lng,
    });
    if (distance < closestDistance) {
      closest = zone;
      closestDistance = distance;
    }
  }
  if (!closest) {
    return { zone: null, inside: false, distanceM: null };
  }
  const inside =
    closest.isActive !== false && closestDistance <= closest.radius;
  return {
    zone: closest,
    inside,
    distanceM: Math.round(closestDistance),
  };
}