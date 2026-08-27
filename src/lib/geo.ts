import { createHash } from "crypto";

/**
 * Mapping/geocoding abstraction. No real maps provider is configured in this MVP (no API key),
 * so `geocode()` falls back to a deterministic demo geocoder: it hashes the city/state string
 * into a stable lat/lng near that city's real approximate location when we recognize it, or a
 * plausible continental-US point otherwise. This keeps distance filtering + "near you" sorting
 * functional in the demo without a paid API key.
 *
 * To go live: set MAPS_PROVIDER=google and GOOGLE_MAPS_API_KEY in .env, then implement the
 * Google branch below (Geocoding API) and/or swap in an interactive map (e.g. Google Maps
 * JavaScript API or Mapbox GL) on the listing/meetup pages — the rest of the app only depends
 * on `{ lat, lng }` numbers and never talks to a specific vendor directly.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

// A handful of real anchors so common demo cities land in roughly the right place on a map.
const KNOWN_CITY_ANCHORS: Record<string, GeoPoint> = {
  "san antonio,tx": { lat: 29.4241, lng: -98.4936 },
  "austin,tx": { lat: 30.2672, lng: -97.7431 },
  "houston,tx": { lat: 29.7604, lng: -95.3698 },
  "dallas,tx": { lat: 32.7767, lng: -96.797 },
  "denver,co": { lat: 39.7392, lng: -104.9903 },
  "boulder,co": { lat: 40.015, lng: -105.2705 },
  "portland,or": { lat: 45.5152, lng: -122.6784 },
  "seattle,wa": { lat: 47.6062, lng: -122.3321 },
  "minneapolis,mn": { lat: 44.9778, lng: -93.265 },
  "chicago,il": { lat: 41.8781, lng: -87.6298 },
  "san diego,ca": { lat: 32.7157, lng: -117.1611 },
  "san francisco,ca": { lat: 37.7749, lng: -122.4194 },
  "los angeles,ca": { lat: 34.0522, lng: -118.2437 },
  "phoenix,az": { lat: 33.4484, lng: -112.074 },
  "asheville,nc": { lat: 35.5951, lng: -82.5515 },
  "boise,id": { lat: 43.615, lng: -116.2023 },
};

export async function geocode(city: string, state: string): Promise<GeoPoint> {
  if (process.env.MAPS_PROVIDER === "google" && process.env.GOOGLE_MAPS_API_KEY) {
    // TODO: call the Google Geocoding API here when a key is configured:
    // https://maps.googleapis.com/maps/api/geocode/json?address=...&key=...
    // Falling through to the demo geocoder until this is implemented.
  }

  const key = `${city.trim().toLowerCase()},${state.trim().toLowerCase()}`;
  if (KNOWN_CITY_ANCHORS[key]) {
    // add a tiny deterministic jitter so multiple listings in the same city don't stack exactly
    const jitter = deterministicJitter(key);
    return { lat: KNOWN_CITY_ANCHORS[key].lat + jitter.lat, lng: KNOWN_CITY_ANCHORS[key].lng + jitter.lng };
  }

  // Unrecognized city: derive a stable pseudo-random point within the continental US bounding box.
  const hash = createHash("sha256").update(key).digest();
  const lat = 25 + (hash.readUInt16BE(0) / 65535) * (49 - 25);
  const lng = -124 + (hash.readUInt16BE(2) / 65535) * (-67 - -124);
  return { lat, lng };
}

function deterministicJitter(key: string): GeoPoint {
  const hash = createHash("sha256").update(key + ":jitter").digest();
  const lat = ((hash.readUInt16BE(4) / 65535) - 0.5) * 0.08;
  const lng = ((hash.readUInt16BE(6) / 65535) - 0.5) * 0.08;
  return { lat, lng };
}

/** Great-circle distance in miles between two points. */
export function distanceMiles(a: GeoPoint, b: GeoPoint): number {
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
