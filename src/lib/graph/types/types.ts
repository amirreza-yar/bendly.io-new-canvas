import { SvgRenderer } from "../engine/renderer"

export type Point = { x: number; y: number };

// engine/types.ts
export type Node = {
  node_id: string
  x: number
  y: number
  next_node_id?: string
  prev_node_id?: string
}

export type GraphData = {
  nodes: Node[]
}

export interface Mode {
  name: string;
  onPointerDown?(e: PointerEvent, world: {x: number, y: number}): void;
  onPointerMove?(e: PointerEvent, world: {x: number, y: number}): void;
  onPointerUp?(e: PointerEvent, world: {x: number, y: number}): void;
  onRender?(renderer: SvgRenderer, data: GraphData): void; // optional special visuals
}