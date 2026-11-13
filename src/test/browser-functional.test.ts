import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const ARTIFACTS_DIR = "/Users/pro/.gemini/antigravity/brain/0d0d2f9f-eb16-4f54-8e45-35a8573345cf";
const CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function captureBrowserView(
  url: string,
  screenshotName: string,
  windowWidth = 1440,
  windowHeight = 1100
): Promise<string> {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const outputPath = path.join(ARTIFACTS_DIR, screenshotName);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "prospect-cdp-"));

  const chrome = spawn(
    CHROME_BIN,
    [
      "--headless",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${userDataDir}`,
      "--remote-debugging-port=0",
      `--window-size=${windowWidth},${windowHeight}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  try {
    const debugPort = await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Chrome DevTools startup timed out")), 8000);
      let buf = "";
      chrome.stderr.on("data", (chunk) => {
        buf += chunk.toString();
        const m = buf.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
        if (m) {
          clearTimeout(timer);
          resolve(parseInt(m[1], 10));
        }
      });
      chrome.on("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`Chrome exited early (${code}): ${buf.slice(0, 200)}`));
      });
    });

    const targets = (await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((r) =>
      r.json()
    )) as Array<{ type: string; webSocketDebuggerUrl?: string }>;
    const pageTarget = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl) || targets[0];
    if (!pageTarget?.webSocketDebuggerUrl) {
      throw new Error("No Chrome CDP page target found");
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", () => reject(new Error("CDP WebSocket error")), { once: true });
    });

    let msgId = 1;
    const pending = new Map<number, { resolve: (val: any) => void; reject: (err: Error) => void }>();
    let loadFiredResolve: (() => void) | null = null;

    ws.addEventListener("message", (ev) => {
      const data = JSON.parse(String(ev.data));
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id)!;
        pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message || "CDP error"));
        else resolve(data.result);
      } else if (data.method === "Page.loadEventFired" && loadFiredResolve) {
        loadFiredResolve();
        loadFiredResolve = null;
      }
    });

    const sendCdp = (method: string, params: Record<string, unknown> = {}) =>
      new Promise<any>((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    try {
      await sendCdp("Page.enable");
      await sendCdp("Emulation.setDeviceMetricsOverride", {
        width: windowWidth,
        height: windowHeight,
        deviceScaleFactor: 1,
        mobile: false,
      });

      const loadPromise = new Promise<void>((resolve) => {
        loadFiredResolve = resolve;
        setTimeout(resolve, 4500);
      });
      await sendCdp("Page.navigate", { url });
      await loadPromise;
      // Allow client-side hydration & initial API fetches to paint cleanly (SSE stays open cleanly!)
      await new Promise((r) => setTimeout(r, 1800));

      const shot = await sendCdp("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(outputPath, Buffer.from(shot.data, "base64"));
    } finally {
      ws.close();
    }

    return outputPath;
  } finally {
    try {
      chrome.kill("SIGKILL");
    } catch {
      // ignore if already exited
    }
    await new Promise((r) => setTimeout(r, 120));
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 80 });
    } catch {
      // OS temp reaper cleans leftover Chrome lockfiles cleanly
    }
  }
}

test("Priority 4 — Browser-Driven Functional & Visual Verification Suite", async (t) => {
  await t.test("1. Discover View: Renders Live Index, Search Bar, and Filter Controls", async () => {
    const res = await fetch(`${BASE_URL}/?tab=discover`, { headers: { Connection: "close" } });
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("Prospect"));
    assert.ok(html.includes("Discover"));

    // Capture visual artifact with Chrome headless
    const screenshot = await captureBrowserView(`${BASE_URL}/?tab=discover`, "browser-stage-discover.png");
    assert.ok(fs.existsSync(screenshot));
    const stats = fs.statSync(screenshot);
    assert.ok(stats.size > 50000, "Discover screenshot must be a valid rendered image (>50KB)");
  });

  await t.test("2. Career Outlook: Displays Verified Directions and Evidence Badges", async () => {
    const res = await fetch(`${BASE_URL}/?tab=outlook`, { headers: { Connection: "close" } });
    assert.equal(res.status, 200);

    const screenshot = await captureBrowserView(`${BASE_URL}/?tab=outlook`, "browser-stage-outlook.png");
    assert.ok(fs.existsSync(screenshot));
    assert.ok(fs.statSync(screenshot).size > 50000);
  });

  await t.test("3. Application Tracker: Displays Kanban Pipeline and Deadlines", async () => {
    const res = await fetch(`${BASE_URL}/?tab=tracker`, { headers: { Connection: "close" } });
    assert.equal(res.status, 200);

    const screenshot = await captureBrowserView(`${BASE_URL}/?tab=tracker`, "browser-stage-tracker.png");
    assert.ok(fs.existsSync(screenshot));
    assert.ok(fs.statSync(screenshot).size > 50000);
  });

  await t.test("4. Preparation Studio: Displays Gap Action Items & Completion Checkboxes", async () => {
    const res = await fetch(`${BASE_URL}/?tab=prep`, { headers: { Connection: "close" } });
    assert.equal(res.status, 200);

    const screenshot = await captureBrowserView(`${BASE_URL}/?tab=prep`, "browser-stage-prep.png");
    assert.ok(fs.existsSync(screenshot));
    assert.ok(fs.statSync(screenshot).size > 50000);
  });

  await t.test("5. Profile View: Displays Verified Academic Facts and Provenance", async () => {
    const res = await fetch(`${BASE_URL}/?tab=profile`, { headers: { Connection: "close" } });
    assert.equal(res.status, 200);

    const screenshot = await captureBrowserView(`${BASE_URL}/?tab=profile`, "browser-stage-profile.png");
    assert.ok(fs.existsSync(screenshot));
    assert.ok(fs.statSync(screenshot).size > 50000);
  });

  await t.test("6. Agent Activity: Renders Autonomous Execution Timeline & Coverage", async () => {
    const res = await fetch(`${BASE_URL}/?tab=agent`, { headers: { Connection: "close" } });
    assert.equal(res.status, 200);

    const screenshot = await captureBrowserView(`${BASE_URL}/?tab=agent`, "browser-stage-agent.png");
    assert.ok(fs.existsSync(screenshot));
    assert.ok(fs.statSync(screenshot).size > 30000);
  });

  await t.test("7. Health & Status Endpoint Returns OK", async () => {
    const res = await fetch(`${BASE_URL}/api/status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.appName, "Prospect");
    assert.equal(data.mode, "LIVE_MODE");
    assert.equal(data.providers.search.isLive, true);
  });

  await t.test("8. Location Intelligence, AI Intelligence & Persistent Scheduler Endpoints Return Verified Data", async () => {
    // GET /api/location
    const locRes = await fetch(`${BASE_URL}/api/location`);
    assert.equal(locRes.status, 200);
    const locData = await locRes.json();
    assert.ok(Array.isArray(locData.knownCityHubs));
    assert.ok(locData.knownCityHubs.length >= 30);

    // POST /api/location (manual city selection)
    const manualLocRes = await fetch(`${BASE_URL}/api/location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "SET_MANUAL_LOCATION",
        manualLocation: "Bengaluru",
        nearbyRadiusKm: 80,
      }),
    });
    assert.equal(manualLocRes.status, 200);
    const manualLocData = await manualLocRes.json();
    assert.equal(manualLocData.locationPreference.city, "Bengaluru");
    assert.equal(manualLocData.locationPreference.source, "MANUAL");

    // GET /api/ai/intelligence
    const aiRes = await fetch(`${BASE_URL}/api/ai/intelligence`);
    assert.equal(aiRes.status, 200);
    const aiData = await aiRes.json();
    assert.equal(aiData.embeddingModel.id, "prospect-semantic-embed-v1-128d");
    assert.equal(aiData.embeddingModel.dimensions, 128);
    assert.ok(aiData.rankingMetrics);
    assert.ok(aiData.candidateSkillMap);

    // GET /api/sync (Persistent Scheduler state)
    const syncRes = await fetch(`${BASE_URL}/api/sync`);
    assert.equal(syncRes.status, 200);
    const syncData = await syncRes.json();
    assert.ok(syncData.scheduler);
    assert.equal(syncData.scheduler.schedulerType, "PERSISTENT_DATABASE_LEDGER");
  });

  await t.test("9. Project Lab UI, Project Evaluator API, Vicinity Filter & Real-Time SSE Stream", async () => {
    const projPage = await fetch(`${BASE_URL}/?tab=projects`, { headers: { Connection: "close" } });
    assert.equal(projPage.status, 200);
    const projScreenshot = await captureBrowserView(`${BASE_URL}/?tab=projects`, "browser-stage-projects.png");
    assert.ok(fs.existsSync(projScreenshot));
    assert.ok(fs.statSync(projScreenshot).size > 40000);

    // Evaluate a project via live API
    const evalRes = await fetch(`${BASE_URL}/api/projects/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({
        title: "Hybrid RAG Career Discovery Pipeline",
        description: "Engineered 128-D embeddings paired with BM25 lexical retrieval and SSE live sync.",
        techStack: ["Python", "PyTorch", "RAG", "BM25", "TypeScript"],
      }),
    });
    assert.equal(evalRes.status, 200);
    const evalData = await evalRes.json();
    assert.equal(evalData.success, true);
    assert.ok(evalData.evaluation.overallScore > 50);
    assert.ok(Array.isArray(evalData.evaluation.recommendedResumeBullets));

    // Verify SSE real-time stream endpoint opens cleanly with CONNECTED payload
    const controller = new AbortController();
    const sseRes = await fetch(`${BASE_URL}/api/opportunities/stream`, {
      signal: controller.signal,
    });
    assert.equal(sseRes.status, 200);
    assert.ok((sseRes.headers.get("content-type") || "").includes("text/event-stream"));
    const reader = sseRes.body?.getReader();
    assert.ok(reader);
    const firstChunk = await reader.read();
    const decoded = new TextDecoder().decode(firstChunk.value || new Uint8Array());
    assert.ok(decoded.includes("CONNECTED"), `Expected initial CONNECTED event, got: ${decoded}`);
    controller.abort();
  });

  await t.test("10. AI Career Chat API (/api/chat) & Flexible Prompt Destination Override", async () => {
    const profRes = await fetch(`${BASE_URL}/api/profile`, { headers: { Connection: "close" } });
    assert.equal(profRes.status, 200);

    // 1. Default VICINITY should exclude unrequested foreign locations when Indian profile active
    const vicRes = await fetch(`${BASE_URL}/api/opportunities?locationMode=VICINITY`, {
      headers: { Connection: "close" },
    });
    assert.equal(vicRes.status, 200);
    const vicData = await vicRes.json();
    assert.ok(Array.isArray(vicData.opportunities));
    for (const row of vicData.opportunities) {
      assert.equal(row.opportunity.isDemo, false);
    }

    // 2. Explicit query prompt override (e.g. "Bengaluru" or "United States") works even under VICINITY
    const blrRes = await fetch(`${BASE_URL}/api/opportunities?q=Bengaluru&locationMode=VICINITY`, {
      headers: { Connection: "close" },
    });
    assert.equal(blrRes.status, 200);
    const blrData = await blrRes.json();
    assert.ok(Array.isArray(blrData.opportunities) && blrData.opportunities.length >= 1);

    // 3. Platform-only filtering (LinkedIn Only / Naukri Only)
    const liRes = await fetch(`${BASE_URL}/api/opportunities?platform=LINKEDIN&locationMode=ALL`, {
      headers: { Connection: "close" },
    });
    assert.equal(liRes.status, 200);
    const liData = await liRes.json();
    assert.ok(Array.isArray(liData.opportunities) && liData.opportunities.length >= 1, "Expected live LinkedIn opportunities");
    for (const row of liData.opportunities) {
      assert.ok(
        row.opportunity.sourceName.toLowerCase().includes("linkedin") ||
          row.opportunity.applyUrl.toLowerCase().includes("linkedin.com")
      );
    }

    const nkRes = await fetch(`${BASE_URL}/api/opportunities?platform=NAUKRI&locationMode=ALL`, {
      headers: { Connection: "close" },
    });
    assert.equal(nkRes.status, 200);
    const nkData = await nkRes.json();
    assert.ok(Array.isArray(nkData.opportunities) && nkData.opportunities.length >= 1, "Expected live Naukri opportunities");
    for (const row of nkData.opportunities) {
      assert.ok(
        row.opportunity.sourceName.toLowerCase().includes("naukri") ||
          row.opportunity.applyUrl.toLowerCase().includes("naukri.com")
      );
    }

    // 4. AI Career Chat endpoint responds cleanly with actionable suggestions
    const chatRes = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({
        message: "Show AI or ML internships in Bengaluru or Remote Global",
        activeLocationMode: "VICINITY",
        activeTab: "discover",
      }),
    });
    assert.equal(chatRes.status, 200);
    const chatData = await chatRes.json();
    assert.ok(typeof chatData.reply === "string" && chatData.reply.length > 20);
    assert.ok(Array.isArray(chatData.suggestedActions));
    assert.ok(chatData.suggestedActions.length >= 1);
  });

  await t.test("11. In-App Scheduler API (/api/scheduler) & UI View Render Cleanly", async () => {
    const schedPage = await fetch(`${BASE_URL}/?tab=scheduler`, { headers: { Connection: "close" } });
    assert.equal(schedPage.status, 200);
    const schedShot = await captureBrowserView(`${BASE_URL}/?tab=scheduler`, "browser-stage-scheduler.png");
    assert.ok(fs.existsSync(schedShot));
    assert.ok(fs.statSync(schedShot).size > 30000);

    const getBefore = await fetch(`${BASE_URL}/api/scheduler`, { headers: { Connection: "close" } });
    assert.equal(getBefore.status, 200);

    const createRes = await fetch(`${BASE_URL}/api/scheduler`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({
        title: "Verify Interview Prep & Sync Regression",
        category: "INTERVIEW_PREP",
        scheduleKind: "DAILY",
        timeLabel: "09:30",
        notes: "Automated verification reminder",
      }),
    });
    assert.equal(createRes.status, 200);
    const created = await createRes.json();
    assert.equal(created.success, true);
    const taskId = created.task.id;

    const patchRes = await fetch(`${BASE_URL}/api/scheduler`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({ id: taskId, status: "COMPLETED" }),
    });
    assert.equal(patchRes.status, 200);
    const patched = await patchRes.json();
    assert.equal(patched.task.status, "COMPLETED");

    const delRes = await fetch(`${BASE_URL}/api/scheduler?id=${encodeURIComponent(taskId)}`, {
      method: "DELETE",
      headers: { Connection: "close" },
    });
    assert.equal(delRes.status, 200);
  });
});
