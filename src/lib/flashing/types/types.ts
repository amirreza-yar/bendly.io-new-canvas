import { Circle, G, Path, PathCommand, StrokeData } from '@svgdotjs/svg.js';
import { SvgRenderer } from '../engine/renderer';
import { ReactNode } from 'react';

export type Material = {
  mat_id: number;
  mat_name: string;
  type: 'color' | 'thickness';
  id: number;
  label: string;
  value: string | number;
};

export type Point = { x: number; y: number };

export type Node = {
  node_id: string;
  x: number;
  y: number;
  next_node_id?: string;
  prev_node_id?: string;
  next_line_bside_length?: number;
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
  title?: string;

  // eslint-disable-next-line
  ComponentUI?(props: any): ReactNode;
  // eslint-disable-next-line
  onUIReady?(props: any): void;
  extraComponent?(): ReactNode;

  // eslint-disable-next-line
  applyValue?(prop: any): void;

  initMode?(nodes: Map<string, Node>, g: G): void;
  nodeObject(g: G, node?: Node, render?: () => void): void;
  edgeObject(g: G, node: Node, to: Node, render?: () => void, extraLayer?: G): void | G;
  annotaionObjects?(nodes: Map<string, Node>, g: G): void;

  createNode(g: G, node: Node, nodeStyle?: { radius?: number; fill?: string }): Circle;
  createLine(g: G, node: Node, to: Node, strokeStyle?: StrokeData): Path;
  createPath(g: G, D: PathCommand[], strokeStyle?: StrokeData): Path;

  // eslint-disable-next-line
  onAction?(p?: any): void;

  onPointerDown?(
    e: PointerEvent,
    world: { x: number; y: number },
  ): { isPanAllowed: boolean } | void;
  onPointerMove?(e: PointerEvent, world: { x: number; y: number }): void;
  onPointerUp?(e: PointerEvent, world: { x: number; y: number }): void;
  onRender?(renderer: SvgRenderer, data: GraphData): void; // optional special visuals
}

export type ScreenToWorld = (clientX: number, clientY: number) => { x: number; y: number };

export type LengthAnnoType = {
  node: Node;
  to: Node;
  g: G;
  scale?: number;
  textSize?: number;
  scaleOffset?: number;
  showTapered?: boolean;
  textPrefix?: string;
  bgColor?: string;
  bgColorSec?: string;
};

export type AngleAnnoType = {
  g: G;
  prevNode: Node;
  node: Node;
  nextNode: Node;
  scale?: number;
  textSize?: number;
  scaleOffset?: number;
  bgColor?: string;
  bgColorSec?: string;
};
