import {
  LocationDiscoveryMode,
  LocationPreference,
  Opportunity,
  WorkMode,
} from "../types";

export interface CityHubRecord {
  city: string;
  region: string;
  country: string;
  displayLabel: string;
  latitude: number;
  longitude: number;
  aliases: string[];
}

/**
 * Verified city-centroid coordinates for major global tech and academic hubs.
 * Used to resolve city names to city-level coordinates and calculate genuine
 * city-to-job distances ONLY when both coordinates are known.
 */
export const KNOWN_CITY_HUBS: CityHubRecord[] = [
  // India
  {
    city: "Bengaluru",
    region: "Karnataka",
    country: "India",
    displayLabel: "Bengaluru, Karnataka, India",
    latitude: 12.9716,
    longitude: 77.5946,
    aliases: ["bengaluru", "bangalore", "blr"],
  },
  {
    city: "Hyderabad",
    region: "Telangana",
    country: "India",
    displayLabel: "Hyderabad, Telangana, India",
    latitude: 17.385,
    longitude: 78.4867,
    aliases: ["hyderabad", "hyd"],
  },
  {
    city: "Mumbai",
    region: "Maharashtra",
    country: "India",
    displayLabel: "Mumbai, Maharashtra, India",
    latitude: 19.076,
    longitude: 72.8777,
    aliases: ["mumbai", "bombay", "navi mumbai"],
  },
  {
    city: "Pune",
    region: "Maharashtra",
    country: "India",
    displayLabel: "Pune, Maharashtra, India",
    latitude: 18.5204,
    longitude: 73.8567,
    aliases: ["pune"],
  },
  {
    city: "New Delhi",
    region: "Delhi NCR",
    country: "India",
    displayLabel: "New Delhi, Delhi NCR, India",
    latitude: 28.6139,
    longitude: 77.209,
    aliases: ["new delhi", "delhi", "delhi ncr", "ncr"],
  },
  {
    city: "Gurugram",
    region: "Haryana",
    country: "India",
    displayLabel: "Gurugram, Haryana, India",
    latitude: 28.4595,
    longitude: 77.0266,
    aliases: ["gurugram", "gurgaon"],
  },
  {
    city: "Noida",
    region: "Uttar Pradesh",
    country: "India",
    displayLabel: "Noida, Uttar Pradesh, India",
    latitude: 28.5355,
    longitude: 77.391,
    aliases: ["noida", "greater noida"],
  },
  {
    city: "Chennai",
    region: "Tamil Nadu",
    country: "India",
    displayLabel: "Chennai, Tamil Nadu, India",
    latitude: 13.0827,
    longitude: 80.2707,
    aliases: ["chennai", "madras"],
  },
  {
    city: "Kolkata",
    region: "West Bengal",
    country: "India",
    displayLabel: "Kolkata, West Bengal, India",
    latitude: 22.5726,
    longitude: 88.3639,
    aliases: ["kolkata", "calcutta"],
  },
  {
    city: "Ahmedabad",
    region: "Gujarat",
    country: "India",
    displayLabel: "Ahmedabad, Gujarat, India",
    latitude: 23.0225,
    longitude: 72.5714,
    aliases: ["ahmedabad", "gandhinagar"],
  },
  {
    city: "Chandigarh",
    region: "Punjab / Haryana",
    country: "India",
    displayLabel: "Chandigarh, India",
    latitude: 30.7333,
    longitude: 76.7794,
    aliases: ["chandigarh", "mohali", "panchkula"],
  },
  {
    city: "Jaipur",
    region: "Rajasthan",
    country: "India",
    displayLabel: "Jaipur, Rajasthan, India",
    latitude: 26.9124,
    longitude: 75.7873,
    aliases: ["jaipur"],
  },
  {
    city: "Indore",
    region: "Madhya Pradesh",
    country: "India",
    displayLabel: "Indore, Madhya Pradesh, India",
    latitude: 22.7196,
    longitude: 75.8577,
    aliases: ["indore"],
  },
  {
    city: "Kochi",
    region: "Kerala",
    country: "India",
    displayLabel: "Kochi, Kerala, India",
    latitude: 9.9312,
    longitude: 76.2673,
    aliases: ["kochi", "cochin"],
  },
  {
    city: "Faridabad",
    region: "Haryana",
    country: "India",
    displayLabel: "Faridabad, Haryana, India",
    latitude: 28.4089,
    longitude: 77.3178,
    aliases: ["faridabad"],
  },
  {
    city: "Ghaziabad",
    region: "Uttar Pradesh",
    country: "India",
    displayLabel: "Ghaziabad, Uttar Pradesh, India",
    latitude: 28.6692,
    longitude: 77.4538,
    aliases: ["ghaziabad"],
  },
  // United States & Canada
  {
    city: "San Francisco",
    region: "CA",
    country: "United States",
    displayLabel: "San Francisco, CA",
    latitude: 37.7749,
    longitude: -122.4194,
    aliases: ["san francisco", "sf", "bay area", "san francisco, ca"],
  },
  {
    city: "Mountain View",
    region: "CA",
    country: "United States",
    displayLabel: "Mountain View, CA",
    latitude: 37.3861,
    longitude: -122.0839,
    aliases: ["mountain view", "mountain view, ca"],
  },
  {
    city: "Palo Alto",
    region: "CA",
    country: "United States",
    displayLabel: "Palo Alto, CA",
    latitude: 37.4419,
    longitude: -122.143,
    aliases: ["palo alto", "palo alto, ca", "stanford"],
  },
  {
    city: "Menlo Park",
    region: "CA",
    country: "United States",
    displayLabel: "Menlo Park, CA",
    latitude: 37.453,
    longitude: -122.1817,
    aliases: ["menlo park", "menlo park, ca"],
  },
  {
    city: "Sunnyvale",
    region: "CA",
    country: "United States",
    displayLabel: "Sunnyvale, CA",
    latitude: 37.3688,
    longitude: -122.0363,
    aliases: ["sunnyvale", "sunnyvale, ca"],
  },
  {
    city: "San Jose",
    region: "CA",
    country: "United States",
    displayLabel: "San Jose, CA",
    latitude: 37.3382,
    longitude: -121.8863,
    aliases: ["san jose", "san jose, ca", "silicon valley"],
  },
  {
    city: "Cupertino",
    region: "CA",
    country: "United States",
    displayLabel: "Cupertino, CA",
    latitude: 37.323,
    longitude: -122.0322,
    aliases: ["cupertino", "cupertino, ca"],
  },
  {
    city: "New York",
    region: "NY",
    country: "United States",
    displayLabel: "New York, NY",
    latitude: 40.7128,
    longitude: -74.006,
    aliases: ["new york", "new york city", "nyc", "new york, ny", "manhattan", "brooklyn"],
  },
  {
    city: "Seattle",
    region: "WA",
    country: "United States",
    displayLabel: "Seattle, WA",
    latitude: 47.6062,
    longitude: -122.3321,
    aliases: ["seattle", "seattle, wa", "bellevue"],
  },
  {
    city: "Redmond",
    region: "WA",
    country: "United States",
    displayLabel: "Redmond, WA",
    latitude: 47.674,
    longitude: -122.1215,
    aliases: ["redmond", "redmond, wa"],
  },
  {
    city: "Boston",
    region: "MA",
    country: "United States",
    displayLabel: "Boston, MA",
    latitude: 42.3601,
    longitude: -71.0589,
    aliases: ["boston", "boston, ma", "cambridge, ma", "cambridge"],
  },
  {
    city: "Austin",
    region: "TX",
    country: "United States",
    displayLabel: "Austin, TX",
    latitude: 30.2672,
    longitude: -97.7431,
    aliases: ["austin", "austin, tx"],
  },
  {
    city: "Los Angeles",
    region: "CA",
    country: "United States",
    displayLabel: "Los Angeles, CA",
    latitude: 34.0522,
    longitude: -118.2437,
    aliases: ["los angeles", "la", "los angeles, ca", "santa monica", "irvine"],
  },
  {
    city: "Chicago",
    region: "IL",
    country: "United States",
    displayLabel: "Chicago, IL",
    latitude: 41.8781,
    longitude: -87.6298,
    aliases: ["chicago", "chicago, il"],
  },
  {
    city: "Pittsburgh",
    region: "PA",
    country: "United States",
    displayLabel: "Pittsburgh, PA",
    latitude: 40.4406,
    longitude: -79.9959,
    aliases: ["pittsburgh", "pittsburgh, pa"],
  },
  {
    city: "Atlanta",
    region: "GA",
    country: "United States",
    displayLabel: "Atlanta, GA",
    latitude: 33.749,
    longitude: -84.388,
    aliases: ["atlanta", "atlanta, ga"],
  },
  {
    city: "Washington",
    region: "DC",
    country: "United States",
    displayLabel: "Washington, DC",
    latitude: 38.9072,
    longitude: -77.0369,
    aliases: ["washington, dc", "washington dc", "arlington, va", "mclean, va"],
  },
  {
    city: "Toronto",
    region: "ON",
    country: "Canada",
    displayLabel: "Toronto, ON, Canada",
    latitude: 43.6532,
    longitude: -79.3832,
    aliases: ["toronto", "toronto, on", "waterloo"],
  },
  {
    city: "Vancouver",
    region: "BC",
    country: "Canada",
    displayLabel: "Vancouver, BC, Canada",
    latitude: 49.2827,
    longitude: -123.1207,
    aliases: ["vancouver", "vancouver, bc"],
  },
  // Europe & APAC
  {
    city: "London",
    region: "England",
    country: "United Kingdom",
    displayLabel: "London, United Kingdom",
    latitude: 51.5074,
    longitude: -0.1278,
    aliases: ["london", "london, uk"],
  },
  {
    city: "Dublin",
    region: "Leinster",
    country: "Ireland",
    displayLabel: "Dublin, Ireland",
    latitude: 53.3498,
    longitude: -6.2603,
    aliases: ["dublin", "dublin, ireland"],
  },
  {
    city: "Zurich",
    region: "Zurich",
    country: "Switzerland",
    displayLabel: "Zurich, Switzerland",
    latitude: 47.3769,
    longitude: 8.5417,
    aliases: ["zurich", "zürich"],
  },
  {
    city: "Berlin",
    region: "Berlin",
    country: "Germany",
    displayLabel: "Berlin, Germany",
    latitude: 52.52,
    longitude: 13.405,
    aliases: ["berlin", "berlin, germany"],
  },
  {
    city: "Amsterdam",
    region: "North Holland",
    country: "Netherlands",
    displayLabel: "Amsterdam, Netherlands",
    latitude: 52.3676,
    longitude: 4.9041,
    aliases: ["amsterdam"],
  },
  {
    city: "Paris",
    region: "Île-de-France",
    country: "France",
    displayLabel: "Paris, France",
    latitude: 48.8566,
    longitude: 2.3522,
    aliases: ["paris", "paris, france"],
  },
  {
    city: "Singapore",
    region: "Singapore",
    country: "Singapore",
    displayLabel: "Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
    aliases: ["singapore"],
  },
  {
    city: "Tokyo",
    region: "Tokyo",
    country: "Japan",
    displayLabel: "Tokyo, Japan",
    latitude: 35.6762,
    longitude: 139.6503,
    aliases: ["tokyo", "tokyo, japan"],
  },
  {
    city: "Sydney",
    region: "NSW",
    country: "Australia",
    displayLabel: "Sydney, Australia",
    latitude: -33.8688,
    longitude: 151.2093,
    aliases: ["sydney", "sydney, australia"],
  },
];

/**
 * Calculates genuine Haversine distance in kilometers between two coordinate pairs.
 * Returns null if either coordinate pair is missing, null, or non-finite.
 * Never fabricates distance when actual coordinates are unavailable.
 */
export function calculateDistanceKm(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined
): number | null {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number" ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return null;
  }

  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Resolves a human-readable location string (e.g. "San Francisco, CA" or "Bangalore, India")
 * to a verified city hub record if known.
 * Never returns coordinates for "Remote", "Flexible", or unknown strings.
 */
export function resolveCityHubFromText(
  locationText?: string | null
): CityHubRecord | null {
  if (!locationText || typeof locationText !== "string") return null;
  const clean = locationText.trim().toLowerCase();
  if (!clean || clean === "remote" || clean === "flexible" || clean === "global" || clean === "unspecified") {
    return null;
  }

  // Exact alias match first
  for (const hub of KNOWN_CITY_HUBS) {
    if (
      hub.city.toLowerCase() === clean ||
      hub.displayLabel.toLowerCase() === clean ||
      hub.aliases.includes(clean)
    ) {
      return hub;
    }
  }

  // Substring token match for compound strings like "Hybrid - San Francisco, CA" or "Bengaluru, India (On-site)"
  for (const hub of KNOWN_CITY_HUBS) {
    for (const alias of hub.aliases) {
      if (alias.length >= 4 && clean.includes(alias)) {
        return hub;
      }
      if (alias.length < 4) {
        const regex = new RegExp(`\\b${alias}\\b`, "i");
        if (regex.test(clean)) {
          return hub;
        }
      }
    }
  }

  return null;
}

/**
 * Finds the nearest known city hub within `maxRadiusKm` of given coordinates.
 */
export function findNearestCityHub(
  latitude: number,
  longitude: number,
  maxRadiusKm = 45
): { hub: CityHubRecord; distanceKm: number } | null {
  let best: { hub: CityHubRecord; distanceKm: number } | null = null;
  for (const hub of KNOWN_CITY_HUBS) {
    const dist = calculateDistanceKm(latitude, longitude, hub.latitude, hub.longitude);
    if (dist !== null && dist <= maxRadiusKm) {
      if (!best || dist < best.distanceKm) {
        best = { hub, distanceKm: dist };
      }
    }
  }
  return best;
}

export interface ReverseGeocodeResult extends LocationPreference {
  ok: boolean;
  provider: "NOMINATIM_OSM" | "CITY_HUB_CENTROID" | "NONE";
  error?: string;
}

/**
 * Reverse geocodes browser latitude/longitude to a city/region/country.
 * Stores city-level centroid coordinates rather than precise user GPS coordinates.
 * Handles geocoding failures honestly without inventing a location.
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
  fetchImpl: typeof fetch = fetch
): Promise<ReverseGeocodeResult> {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    const errMsg = "Invalid latitude or longitude coordinates supplied.";
    return {
      ok: false,
      city: "",
      region: "",
      country: "",
      displayLabel: "",
      source: "NONE",
      permissionState: "prompt",
      cityLatitude: null,
      cityLongitude: null,
      nearbyRadiusKm: 80,
      preferredWorkModes: ["Remote", "Hybrid", "On-site"],
      lastResolvedAt: null,
      errorReason: errMsg,
      provider: "NONE",
      error: errMsg,
    };
  }

  // 1. Query OpenStreetMap Nominatim Reverse Geocoding API (Permitted Public Endpoint)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      latitude.toFixed(4)
    )}&lon=${encodeURIComponent(longitude.toFixed(4))}&zoom=10&addressdetails=1`;

    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "ProspectCareerDiscoveryAgent/1.0 (Academic Presentation)",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data?.address || {};
      const rawCity =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.village ||
        addr.suburb ||
        addr.county ||
        addr.state_district ||
        "";
      const rawRegion = addr.state || addr.region || addr.province || "";
      const rawCountry = addr.country || "";

      if (rawCity || rawRegion) {
        const knownHub =
          resolveCityHubFromText(rawCity) ||
          findNearestCityHub(latitude, longitude, 35)?.hub ||
          null;

        const city = knownHub?.city || rawCity || rawRegion;
        const region = knownHub?.region || rawRegion;
        const country = knownHub?.country || rawCountry;
        const displayLabel = [city, region, country]
          .filter((part, idx, arr) => Boolean(part) && arr.indexOf(part) === idx)
          .join(", ");

        // Privacy-preserving: store city centroid (or 2-decimal rounded city coordinates), NEVER raw GPS
        const cityLatitude = knownHub
          ? knownHub.latitude
          : Math.round(latitude * 100) / 100;
        const cityLongitude = knownHub
          ? knownHub.longitude
          : Math.round(longitude * 100) / 100;

        return {
          ok: true,
          city,
          region,
          country,
          displayLabel,
          source: "BROWSER_GPS",
          permissionState: "granted",
          cityLatitude,
          cityLongitude,
          nearbyRadiusKm: 80,
          preferredWorkModes: ["Remote", "Hybrid", "On-site"],
          lastResolvedAt: new Date().toISOString(),
          errorReason: null,
          provider: "NOMINATIM_OSM",
        };
      }
    }
  } catch {
    // Nominatim network/timeout failure — check if coordinates fall directly inside a known city hub
  }

  // 2. Fallback: Check if coordinates fall within 35km of a verified city hub centroid
  const nearest = findNearestCityHub(latitude, longitude, 35);
  if (nearest) {
    return {
      ok: true,
      city: nearest.hub.city,
      region: nearest.hub.region,
      country: nearest.hub.country,
      displayLabel: nearest.hub.displayLabel,
      source: "BROWSER_GPS",
      permissionState: "granted",
      cityLatitude: nearest.hub.latitude,
      cityLongitude: nearest.hub.longitude,
      nearbyRadiusKm: 80,
      preferredWorkModes: ["Remote", "Hybrid", "On-site"],
      lastResolvedAt: new Date().toISOString(),
      errorReason: null,
      provider: "CITY_HUB_CENTROID",
    };
  }

  // 3. Honest failure: Do NOT pretend location was detected when geocoding failed
  const failMsg =
    "Could not resolve coordinates to a city/region (geocoding service unreachable or unknown region). Please select or enter your city manually.";
  return {
    ok: false,
    city: "",
    region: "",
    country: "",
    displayLabel: "",
    source: "NONE",
    permissionState: "granted",
    cityLatitude: null,
    cityLongitude: null,
    nearbyRadiusKm: 80,
    preferredWorkModes: ["Remote", "Hybrid", "On-site"],
    lastResolvedAt: null,
    errorReason: failMsg,
    provider: "NONE",
    error: failMsg,
  };
}

/**
 * Builds a structured LocationPreference from a manual city/region input string.
 */
export function buildManualLocationPreference(
  manualLocationInput: string,
  preferredWorkModes: WorkMode[] = ["Remote", "Hybrid", "On-site"],
  nearbyRadiusKm = 80
): LocationPreference {
  const trimmed = (manualLocationInput || "").trim();
  if (!trimmed) {
    return {
      city: "",
      region: "",
      country: "",
      displayLabel: "Location not set",
      source: "NONE",
      permissionState: "prompt",
      cityLatitude: null,
      cityLongitude: null,
      nearbyRadiusKm,
      preferredWorkModes,
      lastResolvedAt: null,
      errorReason: null,
    };
  }

  const hub = resolveCityHubFromText(trimmed);
  if (hub) {
    return {
      city: hub.city,
      region: hub.region,
      country: hub.country,
      displayLabel: hub.displayLabel,
      source: "MANUAL",
      permissionState: "prompt",
      cityLatitude: hub.latitude,
      cityLongitude: hub.longitude,
      nearbyRadiusKm,
      preferredWorkModes,
      lastResolvedAt: new Date().toISOString(),
      errorReason: null,
    };
  }

  const parts = trimmed
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const city = parts[0] || trimmed;
  const region = parts[1] || "";
  const country = parts[2] || "";

  return {
    city,
    region,
    country,
    displayLabel: trimmed,
    source: "MANUAL",
    permissionState: "prompt",
    cityLatitude: null,
    cityLongitude: null,
    nearbyRadiusKm,
    preferredWorkModes,
    lastResolvedAt: new Date().toISOString(),
    errorReason: null,
  };
}

/**
 * Enriches an Opportunity with resolved city coordinates (when its location string
 * maps to a verified city) and computes `distanceKm` ONLY when both user city coordinates
 * and opportunity coordinates exist.
 */
export function enrichOpportunityWithLocationIntelligence(
  opp: Opportunity,
  userLoc?: LocationPreference | null
): Opportunity {
  let lat = opp.latitude ?? null;
  let lon = opp.longitude ?? null;

  if ((lat === null || lon === null) && opp.location) {
    const hub = resolveCityHubFromText(opp.location);
    if (hub) {
      lat = hub.latitude;
      lon = hub.longitude;
    }
  }

  const distanceKm =
    userLoc?.cityLatitude != null &&
    userLoc?.cityLongitude != null &&
    lat != null &&
    lon != null
      ? calculateDistanceKm(userLoc.cityLatitude, userLoc.cityLongitude, lat, lon)
      : null;

  return {
    ...opp,
    latitude: lat,
    longitude: lon,
    distanceKm,
  };
}

/**
 * Checks whether an opportunity location matches a target city name (accounting for aliases like
 * Bengaluru/Bangalore, SF/San Francisco, NYC/New York).
 */
export function doesOpportunityMatchCity(
  oppLocation: string,
  targetCity: string
): boolean {
  if (!oppLocation || !targetCity) return false;
  const locLower = oppLocation.toLowerCase();
  const cityLower = targetCity.trim().toLowerCase();
  if (!cityLower) return false;

  const targetHub = resolveCityHubFromText(targetCity);
  const oppHub = resolveCityHubFromText(oppLocation);

  if (targetHub && oppHub && targetHub.city === oppHub.city) {
    return true;
  }

  if (targetHub) {
    return targetHub.aliases.some((alias) => {
      if (alias.length < 4) {
        return new RegExp(`\\b${alias}\\b`, "i").test(locLower);
      }
      return locLower.includes(alias);
    });
  }

  return locLower.includes(cityLower);
}

/**
 * Filters and enriches opportunities based on the active LocationDiscoveryMode.
 */
export function filterOpportunitiesByLocationMode(
  opportunities: Opportunity[],
  mode: LocationDiscoveryMode,
  userLoc?: LocationPreference | null,
  selectedCity?: string,
  preferredLocations: string[] = []
): Opportunity[] {
  // Determine reference location for distance calculation
  const selectedHub = selectedCity ? resolveCityHubFromText(selectedCity) : null;
  const effectiveLoc: LocationPreference | null =
    mode === "SELECTED_CITY" && selectedHub
      ? {
          city: selectedHub.city,
          region: selectedHub.region,
          country: selectedHub.country,
          displayLabel: selectedHub.displayLabel,
          source: "MANUAL",
          permissionState: "prompt",
          cityLatitude: selectedHub.latitude,
          cityLongitude: selectedHub.longitude,
          nearbyRadiusKm: userLoc?.nearbyRadiusKm || 80,
          preferredWorkModes: userLoc?.preferredWorkModes || ["Remote", "Hybrid", "On-site"],
        }
      : userLoc || null;

  const enriched = opportunities.map((opp) =>
    enrichOpportunityWithLocationIntelligence(opp, effectiveLoc)
  );

  switch (mode) {
    case "ALL":
      return enriched;

    case "VICINITY":
      return enriched.filter(
        (opp) =>
          isOpportunityWithinUserVicinity(opp, effectiveLoc, preferredLocations)
            .matches
      );

    case "REMOTE":
      return enriched.filter(
        (opp) =>
          opp.workMode === "Remote" ||
          opp.location.toLowerCase().includes("remote") ||
          opp.location.toLowerCase().includes("anywhere")
      );

    case "HYBRID":
      return enriched.filter(
        (opp) =>
          opp.workMode === "Hybrid" ||
          opp.location.toLowerCase().includes("hybrid")
      );

    case "ONSITE":
      return enriched.filter(
        (opp) =>
          opp.workMode === "On-site" ||
          opp.location.toLowerCase().includes("on-site") ||
          opp.location.toLowerCase().includes("onsite") ||
          opp.location.toLowerCase().includes("in-person")
      );

    case "IN_MY_CITY": {
      const targetCity = userLoc?.city || "";
      if (!targetCity) return [];
      return enriched.filter((opp) =>
        doesOpportunityMatchCity(opp.location, targetCity)
      );
    }

    case "NEAR_ME": {
      const radiusKm = userLoc?.nearbyRadiusKm || 80;
      const targetCity = userLoc?.city || "";
      if (!targetCity && userLoc?.cityLatitude == null) return [];
      return enriched.filter((opp) => {
        if (opp.distanceKm !== null && opp.distanceKm !== undefined) {
          return opp.distanceKm <= radiusKm;
        }
        return targetCity ? doesOpportunityMatchCity(opp.location, targetCity) : false;
      });
    }

    case "SELECTED_CITY": {
      const cityToMatch = (selectedCity || userLoc?.city || "").trim();
      if (!cityToMatch) return enriched;
      return enriched.filter((opp) => {
        if (doesOpportunityMatchCity(opp.location, cityToMatch)) return true;
        if (opp.distanceKm !== null && opp.distanceKm !== undefined && opp.distanceKm <= 60) {
          return true;
        }
        return false;
      });
    }

    default:
      return enriched;
  }
}

/**
 * Infers the normalized country from a free-text job or candidate location string.
 */
export function inferCountryFromLocation(locText: string): string {
  const clean = (locText || "").trim();
  if (!clean) return "";
  const hub = resolveCityHubFromText(clean);
  if (hub?.country) return hub.country;

  const lower = clean.toLowerCase();
  if (
    /\b(india|karnataka|maharashtra|telangana|tamil nadu|haryana|uttar pradesh|delhi ncr|ncr|gujarat|west bengal|rajasthan|kerala|punjab|madhya pradesh)\b/i.test(
      lower
    )
  ) {
    return "India";
  }
  if (
    /\b(united states|usa|u\.s\.a\.|u\.s\.|north america|california|new york|texas|washington|massachusetts|illinois|colorado|georgia|virginia|florida|north carolina|pennsylvania)\b/i.test(
      lower
    ) ||
    /,\s*(us|ca|ny|wa|tx|ma|il|ga|va|nc|fl|pa|co|nj|or|az)\b/i.test(lower) ||
    /\bremote[\s,\-–—]+u\.?s\.?a?\b/i.test(lower) ||
    /\b(?:u\.?s\.?a?|us)\s+remote\b/i.test(lower) ||
    /^us(?:\s*[-–—]|\s+|$)/i.test(lower)
  ) {
    return "United States";
  }
  if (/\b(united kingdom|u\.?k\.?|england|london|manchester|edinburgh|scotland)\b/i.test(lower)) {
    return "United Kingdom";
  }
  if (/\b(canada|toronto|vancouver|montreal|ottawa|waterloo|ontario|quebec|alberta|british columbia|nova scotia)\b/i.test(lower)) {
    return "Canada";
  }
  if (/\b(qatar|doha)\b/i.test(lower)) {
    return "Qatar";
  }
  if (/\b(uae|united arab emirates|dubai|abu dhabi)\b/i.test(lower)) {
    return "UAE";
  }
  if (/\b(saudi arabia|riyadh|jeddah)\b/i.test(lower)) {
    return "Saudi Arabia";
  }
  if (/\b(singapore)\b/i.test(lower)) {
    return "Singapore";
  }
  if (/\b(germany|berlin|munich|hamburg|frankfurt|deutschland)\b/i.test(lower)) {
    return "Germany";
  }
  if (/\b(ireland|dublin)\b/i.test(lower)) {
    return "Ireland";
  }
  if (/\b(australia|sydney|melbourne)\b/i.test(lower)) {
    return "Australia";
  }
  if (/\b(europe|emea)\b/i.test(lower)) {
    return "Europe";
  }
  if (/\b(poland|warsaw|krakow)\b/i.test(lower)) return "Poland";
  if (/\b(mexico|mexico city|cdmx)\b/i.test(lower)) return "Mexico";
  if (/\b(brazil|brasil|sao paulo|rio de janeiro)\b/i.test(lower)) return "Brazil";
  if (/\b(france|paris|lyon)\b/i.test(lower)) return "France";
  if (/\b(netherlands|amsterdam)\b/i.test(lower)) return "Netherlands";
  if (/\b(spain|madrid|barcelona)\b/i.test(lower)) return "Spain";
  if (/\b(italy|milan|rome)\b/i.test(lower)) return "Italy";
  if (/\b(portugal|lisbon)\b/i.test(lower)) return "Portugal";
  if (/\b(japan|tokyo|osaka)\b/i.test(lower)) return "Japan";
  if (/\b(south korea|korea|seoul)\b/i.test(lower)) return "South Korea";
  if (/\b(israel|tel aviv)\b/i.test(lower)) return "Israel";
  if (/\b(latam|latin america|colombia|argentina|chile|peru)\b/i.test(lower)) return "LATAM";
  if (/\b(sweden|stockholm|norway|denmark|finland|switzerland|zurich|romania|czech|belgium|austria)\b/i.test(lower)) {
    return "Europe";
  }
  if (/\b(philippines|manila|vietnam|indonesia|thailand|malaysia)\b/i.test(lower)) {
    return "Southeast Asia";
  }
  return "";
}

/**
 * Derives a structured LocationPreference directly from the active resume / profile location string
 * so uploading a new resume (e.g., Rahul in Gurgaon vs Swastik in Delhi) automatically re-anchors
 * Haversine coordinates, metro radius, and country matching with zero hardcoded cities.
 */
export function deriveLocationPreferenceFromProfile(
  locationText: string,
  preferredWorkModes: WorkMode[] = ["Remote", "Hybrid", "On-site"],
  nearbyRadiusKm = 80
): LocationPreference {
  const pref = buildManualLocationPreference(
    locationText,
    preferredWorkModes,
    nearbyRadiusKm
  );
  if (pref.source === "NONE") {
    return pref;
  }
  return {
    ...pref,
    source: "PROFILE",
  };
}

/**
 * Evaluates whether an opportunity falls within the candidate's live vicinity
 * (within radiusKm via Haversine coordinates, matching metro city/aliases,
 * or eligible global/same-country Remote when remote roles are acceptable).
 */
export function isOpportunityWithinUserVicinity(
  opp: Opportunity,
  userLoc?: LocationPreference | null,
  preferredLocations: string[] = []
): {
  matches: boolean;
  reason: string;
  isLocal: boolean;
  isSameCountryRemote: boolean;
} {
  if (!userLoc || (!userLoc.city && userLoc.cityLatitude == null)) {
    return {
      matches: true,
      reason: "No candidate location set; showing all locations.",
      isLocal: false,
      isSameCountryRemote: opp.workMode === "Remote",
    };
  }

  const radiusKm = userLoc.nearbyRadiusKm || 80;
  const userCountry =
    userLoc.country || inferCountryFromLocation(userLoc.displayLabel || userLoc.city);
  const rawLocCountry = inferCountryFromLocation(opp.location);
  const titleCountry = opp.title ? inferCountryFromLocation(opp.title) : "";
  const oppCountry = rawLocCountry || titleCountry;
  const locLower = (opp.location || "").toLowerCase();

  // Strictly block foreign-country or ambiguous global-remote jobs when user has a resolved local country
  if (
    opp.workMode === "Remote" &&
    userCountry &&
    oppCountry &&
    oppCountry.toLowerCase() !== userCountry.toLowerCase()
  ) {
    return {
      matches: false,
      reason: `Remote role restricted to ${oppCountry} (outside ${userCountry})`,
      isLocal: false,
      isSameCountryRemote: false,
    };
  }

  // Block ambiguous/unspecified "Worldwide", "Global", or "Anywhere" remote roles from local VICINITY
  if (
    opp.workMode === "Remote" &&
    userCountry &&
    !oppCountry &&
    (/\b(anywhere|worldwide|global|emea|latam|apac|north america|europe)\b/i.test(
      locLower
    ) ||
      locLower.trim() === "remote" ||
      locLower.trim() === "unspecified")
  ) {
    return {
      matches: false,
      reason: `Global / unspecified-region remote role excluded from ${userLoc.city} vicinity`,
      isLocal: false,
      isSameCountryRemote: false,
    };
  }

  // 1. Exact Haversine radius match (recomputed dynamically for userLoc coordinates)
  const resolvedHub = opp.location ? resolveCityHubFromText(opp.location) : null;
  const oppLat = opp.latitude ?? resolvedHub?.latitude ?? null;
  const oppLon = opp.longitude ?? resolvedHub?.longitude ?? null;
  const liveDistanceKm =
    userLoc.cityLatitude != null &&
    userLoc.cityLongitude != null &&
    oppLat != null &&
    oppLon != null
      ? calculateDistanceKm(userLoc.cityLatitude, userLoc.cityLongitude, oppLat, oppLon)
      : opp.distanceKm ?? null;

  if (liveDistanceKm !== null && liveDistanceKm !== undefined) {
    if (liveDistanceKm <= radiusKm) {
      return {
        matches: true,
        reason: `Within ${liveDistanceKm} km of ${userLoc.city} (limit ${radiusKm} km)`,
        isLocal: true,
        isSameCountryRemote: false,
      };
    }
  }

  // 2. Direct city / preferred location string match
  if (userLoc.city && doesOpportunityMatchCity(opp.location, userLoc.city)) {
    return {
      matches: true,
      reason: `Direct city match (${userLoc.city})`,
      isLocal: true,
      isSameCountryRemote: false,
    };
  }
  for (const pref of preferredLocations) {
    const cleanPref = pref.trim();
    if (!cleanPref || /^remote$/i.test(cleanPref)) continue;
    if (doesOpportunityMatchCity(opp.location, cleanPref)) {
      return {
        matches: true,
        reason: `Matches preferred hub (${cleanPref})`,
        isLocal: true,
        isSameCountryRemote: false,
      };
    }
  }

  // 3. Remote / Flexible jobs explicitly in the candidate's same country (never ambiguous global/foreign)
  if (
    opp.workMode === "Remote" &&
    userCountry &&
    oppCountry &&
    oppCountry.toLowerCase() === userCountry.toLowerCase()
  ) {
    return {
      matches: true,
      reason: `Remote role eligible in ${userCountry}`,
      isLocal: false,
      isSameCountryRemote: true,
    };
  }

  // 4. Country-wide / unspecified-city listing in the same country (e.g. "India (Multiple Locations)" or just "India")
  if (
    !resolvedHub &&
    userCountry &&
    oppCountry === userCountry &&
    (/\b(multiple|pan[\s-]?india|nationwide|all locations|remote|flexible)\b/i.test(locLower) ||
      locLower.trim() === userCountry.toLowerCase())
  ) {
    return {
      matches: true,
      reason: `Multi-location opening in ${userCountry}`,
      isLocal: false,
      isSameCountryRemote: true,
    };
  }

  const distNote =
    liveDistanceKm != null
      ? `${liveDistanceKm.toLocaleString()} km from ${userLoc.city}`
      : opp.location;
  return {
    matches: false,
    reason: `Outside ${userLoc.city} vicinity (${distNote})`,
    isLocal: false,
    isSameCountryRemote: false,
  };
}
