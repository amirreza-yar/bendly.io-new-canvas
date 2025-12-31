// engine/store.ts
import { createStore } from "zustand/vanilla";
import type { GraphData } from "../types/types";
import { hasEdgeCrossing } from "../engine/helpers";

export type State = {
  data: GraphData | null;
  setData: (data: GraphData) => void;

  activeMode: string;
  setMode: (mode: string) => void;

  panX: number;
  panY: number;
  zoom: number;
  setTransform: (zoom: number, panX: number, panY: number) => void;

  viewBox: { x: number; y: number; width: number; height: number };
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

export const graphStore = createStore<State>((set, get) => ({
  data: null,
  setData: (data) => set({ data }),

  activeMode: "draw",
  setMode: (mode) => set({ activeMode: mode }),

  panX: 0,
  panY: 0,
  zoom: 1,
  setTransform: (zoom, panX, panY) => set({ zoom, panX, panY }),

  viewBox: { x: 0, y: 0, width: 500, height: 500 },
  setViewBox: (v) => set({ viewBox: v }),

  history: [],
  future: [],

  pendingHistory: null,

  beginHistory: () => {
    const { data } = get();
    if (!data) return;
    set({ pendingHistory: structuredClone(data) });
  },

  commitHistory: () => {
    const { pendingHistory, data, history } = get();
    if (!pendingHistory || !data) {
      set({ pendingHistory: null });
      return;
    }

    if (hasEdgeCrossing(data)) {
      // rollback to previous snapshot
      set({
        data: pendingHistory,
        pendingHistory: null,
      });
      return;
    }

    set({
      history: [...history, pendingHistory],
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
    const { history, data, future } = get();
    if (!data || history.length === 0) return;

    const prev = history[history.length - 1];

    set({
      data: prev,
      history: history.slice(0, -1),
      future: [structuredClone(data), ...future],
    });
  },

  redo: () => {
    const { history, data, future } = get();
    if (!data || future.length === 0) return;

    const next = future[0];

    set({
      data: next,
      history: [...history, structuredClone(data)],
      future: future.slice(1),
    });
  },
}));
