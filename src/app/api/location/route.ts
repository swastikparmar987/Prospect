import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { publishRealtimeEvent } from "@/lib/realtime/opportunity-events";
import {
  KNOWN_CITY_HUBS,
  buildManualLocationPreference,
  resolveCityHubFromText,
  reverseGeocodeCoordinates,
} from "@/lib/location-intelligence";
import { LocationPreference, WorkMode } from "@/types";

function parseStoredLocationPreference(
  profile: {
    location?: string | null;
    preferredWorkModes?: string | null;
    locationPreferenceJson?: string | null;
  } | null
): LocationPreference {
  const workModes: WorkMode[] = (() => {
    try {
      const parsed = JSON.parse(profile?.preferredWorkModes || "[]");
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : ["Remote", "Hybrid", "On-site"];
    } catch {
      return ["Remote", "Hybrid", "On-site"];
    }
  })();

  if (profile?.locationPreferenceJson) {
    try {
      const parsed = JSON.parse(profile.locationPreferenceJson);
      if (parsed && typeof parsed === "object" && parsed.source) {
        return {
          city: parsed.city || "",
          region: parsed.region || "",
          country: parsed.country || "",
          displayLabel:
            parsed.displayLabel ||
            parsed.city ||
            profile.location ||
            "Location not set",
          source: parsed.source || "NONE",
          permissionState: parsed.permissionState || "prompt",
          cityLatitude:
            typeof parsed.cityLatitude === "number" ? parsed.cityLatitude : null,
          cityLongitude:
            typeof parsed.cityLongitude === "number" ? parsed.cityLongitude : null,
          nearbyRadiusKm:
            typeof parsed.nearbyRadiusKm === "number" ? parsed.nearbyRadiusKm : 80,
          preferredWorkModes:
            Array.isArray(parsed.preferredWorkModes) &&
            parsed.preferredWorkModes.length > 0
              ? parsed.preferredWorkModes
              : workModes,
          lastResolvedAt: parsed.lastResolvedAt || null,
          errorReason: parsed.errorReason || null,
        };
      }
    } catch {
      // Fall through to profile location derivation
    }
  }

  const profileLoc = (profile?.location || "").trim();
  if (
    profileLoc &&
    profileLoc.toLowerCase() !== "remote / flexible" &&
    profileLoc.toLowerCase() !== "unspecified"
  ) {
    const hub = resolveCityHubFromText(profileLoc);
    return {
      city: hub?.city || profileLoc.split(",")[0]?.trim() || profileLoc,
      region: hub?.region || profileLoc.split(",")[1]?.trim() || "",
      country: hub?.country || profileLoc.split(",")[2]?.trim() || "",
      displayLabel: hub?.displayLabel || profileLoc,
      source: "PROFILE",
      permissionState: "prompt",
      cityLatitude: hub?.latitude ?? null,
      cityLongitude: hub?.longitude ?? null,
      nearbyRadiusKm: 80,
      preferredWorkModes: workModes,
      lastResolvedAt: null,
      errorReason: null,
    };
  }

  return {
    city: "",
    region: "",
    country: "",
    displayLabel: "Location not set",
    source: "NONE",
    permissionState: "prompt",
    cityLatitude: null,
    cityLongitude: null,
    nearbyRadiusKm: 80,
    preferredWorkModes: workModes,
    lastResolvedAt: null,
    errorReason: null,
  };
}

export async function GET(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const profile =
      (await prisma.userProfile.findFirst({
        where: { userId: user.userId },
        orderBy: { updatedAt: "desc" },
      })) ||
      (await prisma.userProfile.findFirst({
        orderBy: { updatedAt: "desc" },
      }));

    const locationPreference = parseStoredLocationPreference(profile);

    return NextResponse.json({
      ok: true,
      locationPreference,
      knownCityHubs: KNOWN_CITY_HUBS.map((h) => ({
        city: h.city,
        region: h.region,
        country: h.country,
        displayLabel: h.displayLabel,
        latitude: h.latitude,
        longitude: h.longitude,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load location preferences",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json();
    const action = body.action || "SET_MANUAL_LOCATION";

    let profile =
      (await prisma.userProfile.findFirst({
        where: { userId: user.userId },
        orderBy: { updatedAt: "desc" },
      })) ||
      (await prisma.userProfile.findFirst({
        orderBy: { updatedAt: "desc" },
      }));

    const existingPref = parseStoredLocationPreference(profile);
    const nearbyRadiusKm =
      typeof body.nearbyRadiusKm === "number" && body.nearbyRadiusKm > 0
        ? body.nearbyRadiusKm
        : existingPref.nearbyRadiusKm || 80;
    const preferredWorkModes: WorkMode[] =
      Array.isArray(body.preferredWorkModes) && body.preferredWorkModes.length > 0
        ? body.preferredWorkModes
        : existingPref.preferredWorkModes;

    let updatedPref: LocationPreference = existingPref;
    let geocodeResult = null;

    if (action === "REVERSE_GEOCODE") {
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);

      geocodeResult = await reverseGeocodeCoordinates(latitude, longitude);

      if (geocodeResult.ok) {
        updatedPref = {
          city: geocodeResult.city,
          region: geocodeResult.region,
          country: geocodeResult.country,
          displayLabel: geocodeResult.displayLabel,
          source: "BROWSER_GPS",
          permissionState: "granted",
          // Store city-centroid coordinates, NEVER raw high-precision GPS coordinates
          cityLatitude: geocodeResult.cityLatitude,
          cityLongitude: geocodeResult.cityLongitude,
          nearbyRadiusKm,
          preferredWorkModes,
          lastResolvedAt: new Date().toISOString(),
          errorReason: null,
        };
      } else {
        // Honest handling of geocoding failure: do NOT pretend location was detected!
        updatedPref = {
          ...existingPref,
          permissionState: "granted",
          errorReason:
            geocodeResult.error ||
            "Reverse geocoding failed to resolve coordinates to a city.",
        };
      }
    } else if (action === "SET_MANUAL_LOCATION" || action === "SET_MANUAL") {
      const manualInput = String(body.manualLocation || body.city || "").trim();
      updatedPref = buildManualLocationPreference(
        manualInput,
        preferredWorkModes,
        nearbyRadiusKm
      );
      if (body.permissionState) {
        updatedPref.permissionState = body.permissionState;
      }
    } else if (action === "RECORD_PERMISSION_STATE") {
      const permissionState = body.permissionState || "denied";
      const errorReason =
        body.errorReason ||
        (permissionState === "denied"
          ? "Browser location permission was denied. You can select or enter your city manually below."
          : permissionState === "unavailable"
            ? "Browser geolocation services are unavailable on this device. Please select a city manually."
            : null);

      updatedPref = {
        ...existingPref,
        permissionState,
        // Never pretend location was detected by GPS when permission was denied or unavailable
        source:
          existingPref.source === "BROWSER_GPS" ? "NONE" : existingPref.source,
        errorReason,
      };
    }

    if (profile) {
      const existingPreferredLocations: string[] = (() => {
        try {
          return JSON.parse(profile.preferredLocations || "[]");
        } catch {
          return [];
        }
      })();

      const nextPreferredLocations =
        updatedPref.city &&
        !existingPreferredLocations.some(
          (l) => l.toLowerCase() === updatedPref.displayLabel.toLowerCase()
        )
          ? [updatedPref.displayLabel, ...existingPreferredLocations].slice(0, 8)
          : existingPreferredLocations;

      profile = await prisma.userProfile.update({
        where: { id: profile.id },
        data: {
          location: updatedPref.displayLabel !== "Location not set" ? updatedPref.displayLabel : profile.location,
          preferredLocations: JSON.stringify(nextPreferredLocations),
          preferredWorkModes: JSON.stringify(updatedPref.preferredWorkModes),
          locationPreferenceJson: JSON.stringify(updatedPref),
        },
      });
    } else {
      profile = await prisma.userProfile.create({
        data: {
          userId: user.userId,
          location:
            updatedPref.displayLabel !== "Location not set"
              ? updatedPref.displayLabel
              : "",
          preferredLocations: JSON.stringify(
            updatedPref.city ? [updatedPref.displayLabel] : []
          ),
          preferredWorkModes: JSON.stringify(updatedPref.preferredWorkModes),
          locationPreferenceJson: JSON.stringify(updatedPref),
        },
      });
    }

    if (action !== "REVERSE_GEOCODE" || geocodeResult?.ok) {
      publishRealtimeEvent(
        "PROFILE_UPDATED",
        `Active vicinity updated to ${updatedPref.displayLabel || "Custom Radius"} (${updatedPref.nearbyRadiusKm} km).`,
        {
          city: updatedPref.city,
          country: updatedPref.country,
          nearbyRadiusKm: updatedPref.nearbyRadiusKm,
        },
        user.userId
      );
    }

    return NextResponse.json({
      ok: action === "REVERSE_GEOCODE" ? Boolean(geocodeResult?.ok) : true,
      locationPreference: updatedPref,
      geocodeResult,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to update location preference",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 400 }
    );
  }
}
