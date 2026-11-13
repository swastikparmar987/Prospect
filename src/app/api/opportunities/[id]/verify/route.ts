import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toolInspectPublicSource } from "@/lib/agent/tools";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const opp = await prisma.opportunity.findUnique({ where: { id } });

    if (!opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const targetUrl = opp.applyUrl || opp.sourceUrl;

    // 1. Run genuine inspection tool with SSRF guards
    const inspection = await toolInspectPublicSource({ url: targetUrl });

    // 2. Assess verification status based on tool observation
    let verificationStatus = opp.verificationStatus;
    let sourceConfidence = opp.sourceConfidence;
    const findings: string[] = [];

    if (opp.isDemo) {
      verificationStatus = "DEMO_DATA";
      findings.push("Synthetic test listing verified against local seed dataset. Labeled DEMO_DATA.");
    } else if (inspection.isReachable) {
      // Check if domain is an official domain or career portal
      const parsedUrl = new URL(targetUrl);
      const host = parsedUrl.hostname.toLowerCase();
      const isOfficialDomain =
        host.endsWith(".edu") ||
        host.endsWith(".gov") ||
        host.endsWith(".org") ||
        host.includes("greenhouse.io") ||
        host.includes("lever.co") ||
        host.includes("myworkdayjobs.com") ||
        host.includes("careers.") ||
        host.includes(opp.organization.toLowerCase().replace(/[^a-z0-9]/g, ""));

      if (isOfficialDomain) {
        verificationStatus = "VERIFIED_SOURCE";
        sourceConfidence = Math.min(0.98, sourceConfidence + 0.1);
        findings.push(`Direct source URL verified active (${inspection.statusText}) on recognized organization domain (${host}).`);
      } else {
        // HTTP reachability alone does not verify legitimacy
        verificationStatus = "PARTIALLY_CHECKED";
        sourceConfidence = Math.max(0.6, sourceConfidence);
        findings.push(`Direct URL is reachable (${inspection.statusText}), but HTTP reachability alone does not verify program legitimacy. Marked PARTIALLY_CHECKED pending direct employer confirmation.`);
      }
    } else {
      verificationStatus = "UNVERIFIABLE";
      sourceConfidence = 0.3;
      findings.push(`Target source is unreachable or blocked: ${inspection.statusText}.`);
    }

    // Check for expired deadline
    if (opp.deadline && new Date(opp.deadline).getTime() < Date.now()) {
      verificationStatus = "STALE";
      findings.push(`Deadline passed on ${new Date(opp.deadline).toLocaleDateString()}. Stale posting.`);
    }

    // 3. Update existing evidence array
    const existingEvidence = JSON.parse(opp.sourceEvidence || "[]");
    const newEvidenceItem = {
      claim: `Live inspection tool run on ${new Date().toLocaleDateString()}`,
      excerpt: inspection.sourceSnippet || inspection.statusText,
      url: targetUrl,
      observedAt: inspection.checkedAt,
      verified: inspection.isReachable,
    };
    const updatedEvidence = [newEvidenceItem, ...existingEvidence];

    // 4. Update Opportunity in DB
    await prisma.opportunity.update({
      where: { id },
      data: {
        verificationStatus,
        sourceConfidence,
        sourceEvidence: JSON.stringify(updatedEvidence),
        lastCheckedAt: new Date(),
      },
    });

    // 5. Record agent step trace
    await prisma.agentRun.create({
      data: {
        id: `run-verify-${id}-${Date.now()}`,
        trigger: "VERIFY",
        query: opp.title,
        status: inspection.isReachable ? "COMPLETED" : "PARTIAL_FAILURE",
        summary: `Verification agent checked ${targetUrl}. Status: ${verificationStatus}.`,
        completedAt: new Date(),
        steps: {
          create: [
            {
              stepNumber: 1,
              toolName: "inspect_public_source",
              status: inspection.isReachable ? "SUCCESS" : "FAILED",
              inputSummary: `URL: ${targetUrl}`,
              outputSummary: inspection.statusText,
              sourceReferences: JSON.stringify([targetUrl]),
              executedAt: new Date(),
            },
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      verificationStatus,
      sourceConfidence,
      inspection,
      findings,
      updatedEvidence,
      message: `Verification complete: ${findings.join(" ")}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Verification agent execution failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
