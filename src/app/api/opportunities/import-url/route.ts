import { NextResponse } from "next/server";
import { importJobFromUrl } from "@/lib/url-importer";
import { publishRealtimeEvent } from "@/lib/realtime/opportunity-events";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawUrl = body.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'url' parameter in request body." },
        { status: 400 }
      );
    }

    const result = await importJobFromUrl(rawUrl);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    if (result.opportunity) {
      publishRealtimeEvent("OPPORTUNITY_UPSERTED", `Imported live posting: ${result.opportunity.title} at ${result.opportunity.organization}`, {
        opportunityId: result.opportunity.id,
        title: result.opportunity.title,
        organization: result.opportunity.organization,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during URL import.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

