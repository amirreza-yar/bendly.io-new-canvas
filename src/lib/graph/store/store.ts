// engine/store.ts
import { createStore } from "zustand/vanilla";
import type { GraphData, Node } from "../types/types";
import { hasEdgeCrossing } from "../engine/helpers";

export type StoreState = {
  LINE_HIT_WIDTH: number;
  LINE_STROKE_WIDTH: number;
  NODE_HIT_WIDTH: number;
  NODE_RADIUS: number;
  NODE_OVERLAY_RADIUS: number;

  triggerRender: boolean;
  setTriggerRender: (t: boolean) => void;

  canDoModeAction: boolean;
  setCanDoModeAction: (t: boolean) => void;

  data: { nodes: Map<string, Node> } | null;
  setData: (data: { nodes: Map<string, Node> }) => void;

  activeMode: string;
  setMode: (mode: string) => void;

  drawDirection: boolean;
  setDrawDirection: (dir: boolean) => void;

  panX: number;
  panY: number;
  zoom: number;
  setTransform: (zoom: number, panX: number, panY: number) => void;

  viewBox: { x: number; y: number; width: number; height: number } | null;
  setViewBox: (v: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;

  history: GraphData[];
  future: GraphData[];
  undo: () => void;
  redo: () => void;

  pendingHistory?: GraphData | null;
  beginHistory: () => void;
  commitHistory: () => void;
  rollbackHistory: () => void;
};

let undoLock = false;
let redoLock = false;

export const graphStore = createStore<StoreState>((set, get) => ({
  LINE_HIT_WIDTH: 30,
  LINE_STROKE_WIDTH: 3,
  NODE_HIT_WIDTH: 40,
  NODE_RADIUS: 10,
  NODE_OVERLAY_RADIUS: 25,

  triggerRender: false,
  setTriggerRender: (t: boolean) => {
    set({ triggerRender: t });
  },

  canDoModeAction: false,
  setCanDoModeAction: (t: boolean) => set({ canDoModeAction: t }),

  data: null,
  setData: (data) => set({ data }),

  activeMode: "draw",
  setMode: (mode) => set({ activeMode: mode }),

  drawDirection: true,
  setDrawDirection: (dir: boolean) => set({ drawDirection: dir }),

  panX: 0,
  panY: 0,
  zoom: 1,
  setTransform: (zoom, panX, panY) => set({ zoom, panX, panY }),

  viewBox: null,
  setViewBox: (v) => set({ viewBox: v }),

  history: [],
  future: [],

  pendingHistory: null,

  beginHistory: () => {
    const { data, pendingHistory } = get();
    if (!data || pendingHistory) return; // <- critical
    set({ pendingHistory: structuredClone(data) });
  },

  commitHistory: () => {
    const { pendingHistory, data, history } = get();
    if (!pendingHistory || !data) {
      set({ pendingHistory: null });
      return;
    }

    if (hasEdgeCrossing(data)) {
      set({ data: pendingHistory, pendingHistory: null });
      alert("Polygon unallowed");
      return;
    }

    set({
      history: [...history, structuredClone(pendingHistory)],
      future: [],
      pendingHistory: null,
    });
  },

  rollbackHistory: () => {
    const { pendingHistory } = get();
    if (!pendingHistory) return;
    set({ data: pendingHistory, pendingHistory: null });
  },

  undo: () => {
    if (undoLock) return;
    undoLock = true;

    const { history, data, future } = get();

    if (!data || history.length === 0) {
      undoLock = false;
      return;
    }

    const prev = history[history.length - 1];

    set({
      data: prev,
      history: history.slice(0, -1),
      future: [structuredClone(data), ...future],
    });

    queueMicrotask(() => {
      undoLock = false;
    });
  },

  redo: () => {
    if (redoLock) return;
    redoLock = true;

    const { history, data, future } = get();
    if (!data || future.length === 0) {
      redoLock = false;
      return;
    }

    const next = future[0];

    set({
      data: next,
      history: [...history, structuredClone(data)],
      future: future.slice(1),
    });

    queueMicrotask(() => {
      redoLock = false;
    });
  },
}));
