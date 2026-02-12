// engine/store.ts
import { createStore } from 'zustand/vanilla';
import type { GraphData, Material } from '../types/types';
import { hasEdgeCrossing } from '../engine/helpers/engine';

export type StoreState = {
  material: Material | null;
  setMaterial: (m: Material) => void;

  engineReady: boolean;
  setEngineReady: (e: boolean) => void;

  openPolygonAlert: boolean;
  setOpenPolygonAlert: (o: boolean) => void;

  LINE_HIT_WIDTH: number;
  LINE_STROKE_WIDTH: number;
  NODE_HIT_WIDTH: number;
  NODE_RADIUS: number;
  NODE_OVERLAY_RADIUS: number;
  CRUSH_FOLD_OFFSET: number;
  ANNO_TEXT_SIZE: number;
  ANNO_CHANGE_SCALE_OFFSET: number;

  gridGap: number;
  gridGapIsPixels: boolean;
  setGridGap: (g: number) => void;
  setGridGapIsPixels: (v: boolean) => void;

  gridBaseStrokePx: number;
  gridStrokeCoeff: number;
  gridStrokeMinPx: number;
  gridStrokeMaxPx: number;
  setGridStrokeCoeff: (c: number) => void;

  scale: number;
  setScale: (scale: number) => void;

  unit: 'mm' | 'in';
  setUnit: (u: 'mm' | 'in') => void;

  triggerRender: boolean;
  setTriggerRender: (t: boolean) => void;

  canDoModeAction: boolean;
  setCanDoModeAction: (t: boolean) => void;
  modeMeta: string | number | null | undefined;
  setModeMeta: (t: string | number | null | undefined) => void;

  data: GraphData | null;
  setData: (data: Partial<GraphData>) => void;

  activeMode: string;
  setMode: (mode: string) => void;

  drawDirection: boolean;
  setDrawDirection: (dir: boolean) => void;

  panX: number;
  panY: number;
  zoom: number;
  setTransform: (zoom: number, panX: number, panY: number) => void;

  viewBox: { x: number; y: number; width: number; height: number } | null;
  setViewBox: (v: { x: number; y: number; width: number; height: number }) => void;

  history: GraphData[];
  future: GraphData[];
  undo: () => void;
  redo: () => void;

  pendingHistory?: GraphData | null;
  beginHistory: () => void;
  commitHistory: () => boolean;
  rollbackHistory: () => boolean;
};

let undoLock = false;
let redoLock = false;

export const graphStore = createStore<StoreState>((set, get) => ({
  material: null,
  setMaterial: (m) => set({ material: m }),

  engineReady: false,
  setEngineReady: (t) => set({ engineReady: t }),

  openPolygonAlert: false,
  setOpenPolygonAlert: (o) => set({ openPolygonAlert: o }),

  // Base configs
  LINE_HIT_WIDTH: 30,
  LINE_STROKE_WIDTH: 3,
  NODE_HIT_WIDTH: 40,
  NODE_RADIUS: 10,
  NODE_OVERLAY_RADIUS: 25,
  CRUSH_FOLD_OFFSET: 10,
  ANNO_TEXT_SIZE: 14,
  ANNO_CHANGE_SCALE_OFFSET: 0.4,

  drawDirection: true,
  setDrawDirection: (dir) => set({ drawDirection: dir }),

  gridGap: 50, // interpreted as world units unless gridGapIsPixels true
  gridGapIsPixels: false, // if true, gridGap is screen pixels
  setGridGap: (g: number) => set({ gridGap: g }),
  setGridGapIsPixels: (v: boolean) => set({ gridGapIsPixels: v }),

  gridBaseStrokePx: 0.7,
  gridStrokeCoeff: 1.0,
  gridStrokeMinPx: 0.2,
  gridStrokeMaxPx: 1.2,
  setGridStrokeCoeff: (c) => set({ gridStrokeCoeff: c }),

  panX: 0,
  panY: 0,
  zoom: 1,
  setTransform: (zoom, panX, panY) => set({ zoom, panX, panY }),

  viewBox: null,
  setViewBox: (v) => set({ viewBox: v }),

  scale: 1,
  setScale: (scale: number) => set({ scale: scale }),

  unit: 'mm',
  setUnit: (u) => set({ unit: u }),

  // Rendering and Engine
  triggerRender: false,
  setTriggerRender: (t) => {
    set({ triggerRender: t });
  },

  // Flashing data
  data: null,
  // setData: (data) => set({ data }),
  setData: (patch) =>
    set((state) => {
      if (state.data === null) {
        // decide your policy here
        // either reject, or initialize defaults
        return {
          data: {
            nodes: patch.nodes ?? new Map(),
            crushFoldDir: patch.crushFoldDir ?? false,
            startCrushFold: patch.startCrushFold ?? false,
            endCrushFold: patch.endCrushFold ?? false,
          },
        };
      }

      return {
        data: {
          ...state.data,
          ...patch,
        },
      };
    }),

  // Modes
  activeMode: 'draw',
  setMode: (mode) => set({ activeMode: mode }),
  canDoModeAction: false,
  setCanDoModeAction: (t) => set({ canDoModeAction: t }),
  modeMeta: null,
  setModeMeta: (t) => set({ modeMeta: t }),

  // History and rolebacks
  history: [],
  future: [],

  pendingHistory: null,

  beginHistory: () => {
    const { data, pendingHistory } = get();
    if (!data || pendingHistory) return;
    set({ pendingHistory: structuredClone(data) });
  },

  commitHistory: () => {
    const { pendingHistory, data, history } = get();
    if (!pendingHistory || !data) {
      set({ pendingHistory: null });
      return false;
    }

    if (hasEdgeCrossing(data)) {
      // console.warn('Polygon unallowed');
      // alert('Polygon unallowed');
      set({ data: pendingHistory, pendingHistory: null, openPolygonAlert: true });

      return false;
    }

    set({
      history: [...history, structuredClone(pendingHistory)],
      future: [],
      pendingHistory: null,
    });

    return true;
  },

  rollbackHistory: () => {
    try {
      const { pendingHistory } = get();
      if (!pendingHistory) return false;
      set({ data: pendingHistory, pendingHistory: null });

      return true;
    } catch {
      return false;
    }
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
