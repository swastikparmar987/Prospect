import { EventEmitter } from "events";
import { LiveSystemEvent, LiveSystemEventType } from "@/types";

const GLOBAL_BUS_KEY = "__prospectRealtimeEventBus";
const MAX_RECENT_EVENTS = 40;

interface GlobalEventBusState {
  emitter: EventEmitter;
  recentEvents: LiveSystemEvent[];
  seq: number;
}

function getBusState(): GlobalEventBusState {
  const g = globalThis as unknown as Record<string, GlobalEventBusState | undefined>;
  if (!g[GLOBAL_BUS_KEY]) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(100);
    g[GLOBAL_BUS_KEY] = {
      emitter,
      recentEvents: [],
      seq: 0,
    };
  }
  return g[GLOBAL_BUS_KEY]!;
}

/**
 * Publishes a live opportunity, profile, or sync event to all connected SSE clients.
 * Used across Next.js route handlers and background workers so UI views update automatically
 * without manual browser refreshes.
 */
export function publishRealtimeEvent(
  type: LiveSystemEventType,
  message: string,
  payload?: Record<string, unknown>,
  userId?: string
): LiveSystemEvent {
  const state = getBusState();
  state.seq += 1;

  const event: LiveSystemEvent = {
    id: `evt-${Date.now()}-${state.seq}`,
    type,
    message,
    timestamp: new Date().toISOString(),
    userId,
    payload,
  };

  state.recentEvents.push(event);
  if (state.recentEvents.length > MAX_RECENT_EVENTS) {
    state.recentEvents.splice(0, state.recentEvents.length - MAX_RECENT_EVENTS);
  }

  state.emitter.emit("system-event", event);
  return event;
}

/**
 * Subscribes a listener to live system events and returns an unsubscribe cleanup callback.
 */
export function subscribeRealtimeEvents(
  listener: (event: LiveSystemEvent) => void
): () => void {
  const state = getBusState();
  state.emitter.on("system-event", listener);
  return () => {
    state.emitter.off("system-event", listener);
  };
}

/**
 * Returns recent buffered events so reconnecting clients can see recent changes.
 */
export function getRecentRealtimeEvents(limit = 10): LiveSystemEvent[] {
  const state = getBusState();
  return state.recentEvents.slice(-Math.max(1, limit));
}
