import { G } from "@svgdotjs/svg.js";
import { SvgRenderer } from "../engine/renderer";

export type Point = { x: number; y: number };

export type Node = {
  node_id: string;
  x: number;
  y: number;
  next_node_id?: string;
  prev_node_id?: string;
};

export type GraphData = {
  nodes: Map<string, Node>;
  crushFoldDir: boolean;
  startCrushFold: boolean;
  endCrushFold: boolean;
};

export interface Mode {
  name: string;
  isPanAllowed: boolean;

  nodeObject(g: G, node?: Node, render?: () => void): void;
  edgeObject(g: G, node: Node, to: Node, render?: () => void): void;

  // eslint-disable-next-line
  onAction?(p?: any): void;

  onPointerDown?(
    e: PointerEvent,
    world: { x: number; y: number }
  ): { isPanAllowed: boolean } | void;
  onPointerMove?(e: PointerEvent, world: { x: number; y: number }): void;
  onPointerUp?(e: PointerEvent, world: { x: number; y: number }): void;
  onRender?(renderer: SvgRenderer, data: GraphData): void; // optional special visuals
}

export type ScreenToWorld = (
  clientX: number,
  clientY: number
) => { x: number; y: number };
