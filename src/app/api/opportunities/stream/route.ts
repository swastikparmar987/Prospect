import {
  getRecentRealtimeEvents,
  subscribeRealtimeEvents,
} from "@/lib/realtime/opportunity-events";
import { LiveSystemEvent } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Server-Sent Events (SSE) endpoint pushing real-time job ingestion,
 * re-scoring, profile upload, and sync events straight to connected UI clients.
 */
export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const sendChunk = (eventName: string, data: unknown) => {
        if (closed) return;
        try {
          const serialized = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(serialized));
        } catch {
          // Stream already closed by client
        }
      };

      const initialEvent: LiveSystemEvent = {
        id: `evt-connect-${Date.now()}`,
        type: "CONNECTED",
        message: "Live Prospect real-time event stream connected.",
        timestamp: new Date().toISOString(),
        payload: {
          recentEvents: getRecentRealtimeEvents(5),
        },
      };
      sendChunk("system", initialEvent);

      const unsubscribe = subscribeRealtimeEvents((event) => {
        sendChunk("system", event);
      });

      const heartbeatTimer = setInterval(() => {
        sendChunk("heartbeat", {
          type: "HEARTBEAT",
          timestamp: new Date().toISOString(),
        });
      }, 5000);

      // Gracefully close stream before Vercel serverless execution limits (25s)
      // Native EventSource in the browser automatically reconnects cleanly
      const maxStreamTimer = setTimeout(() => {
        sendChunk("system", {
          id: `evt-reconnect-${Date.now()}`,
          type: "CONNECTED",
          message: "Periodic stream cycle completed. Reconnecting...",
          timestamp: new Date().toISOString(),
        });
        cleanup();
      }, 25000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeatTimer);
        clearTimeout(maxStreamTimer);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Ignore close errors
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
