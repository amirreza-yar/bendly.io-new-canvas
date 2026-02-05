import { G, PathCommand, StrokeData } from '@svgdotjs/svg.js';
import { graphStore } from '@/lib/flashing/store/store';
import { Mode, Node } from '@/lib/flashing/types/types';
import {
  createAngleAnnotations,
  createLengthAnnotations,
} from '@/lib/flashing/engine/helpers/annotation';
import { createCurshFoldD } from '@/lib/flashing/engine/helpers/fold';
import BaseModeUI from '@/components/canvas/base';

export class BaseMode implements Mode {
  name: string = 'draw';
  isPanAllowed: boolean = true;
  drawAnnotations: boolean = true;
  NODE_RADIUS: number = 10;
  NODE_HIT_WIDTH: number = 40;
  NODE_OVERLAY_RADIUS: number = 25;
  LINE_STROKE_WIDTH: number = 4;
  LINE_HIT_WIDTH: number = 30;
  ANNO_TEXT_SIZE: number = 14;
  ANNO_CHANGE_SCALE_OFFSET: number = 0.7;
  CRUSH_FOLD_OFFSET: number = 10;
  scale: number = 1;

  constructor() {
    const state = graphStore.getState();
    this.LINE_STROKE_WIDTH = state.LINE_STROKE_WIDTH;
    this.NODE_RADIUS = state.NODE_RADIUS;
    this.NODE_HIT_WIDTH = state.NODE_HIT_WIDTH;
    this.NODE_OVERLAY_RADIUS = state.NODE_OVERLAY_RADIUS;
    this.LINE_HIT_WIDTH = state.LINE_HIT_WIDTH;
    this.ANNO_TEXT_SIZE = state.ANNO_TEXT_SIZE;
    this.scale = state.scale;
    this.ANNO_CHANGE_SCALE_OFFSET = graphStore.getState().ANNO_CHANGE_SCALE_OFFSET;
    this.CRUSH_FOLD_OFFSET = state.CRUSH_FOLD_OFFSET;
  }

  ComponentUI = BaseModeUI;

  annotaionObjects(nodes: Map<string, Node>, g: G) {
    if (!this.drawAnnotations) return;
    const scale = graphStore.getState().scale;
    createLengthAnnotations(nodes, g, scale, this.ANNO_TEXT_SIZE, this.ANNO_CHANGE_SCALE_OFFSET);
    createAngleAnnotations(nodes, g, scale, this.ANNO_TEXT_SIZE, this.ANNO_CHANGE_SCALE_OFFSET);
  }

  nodeObject(g: G, node: Node) {
    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = node.next_node_id === undefined;
    const state = graphStore.getState();
    if (!(isFirstNode && state.data?.startCrushFold) && !(isLastNode && state.data?.endCrushFold)) {
      this.createNode(g, node);
    }
  }

  edgeObject(g: G, node: Node, to: Node) {
    const D = createCurshFoldD(node, to, this.getCrushFoldOffset());

    if (D !== undefined) {
      this.createPath(g, D);
    } else {
      this.createLine(g, node, to);
    }
  }

  createNode(
    g: G,
    node: Node,
    nodeStyle?: { radius?: number; fill?: string },
    strokeStyle?: StrokeData,
  ) {
    const radius =
        nodeStyle?.radius ??
        Math.max(
          this.NODE_RADIUS * 0.3,
          Math.min(this.NODE_RADIUS / graphStore.getState().scale, this.NODE_RADIUS * 1.5),
        ),
      fill = nodeStyle?.fill ?? 'var(--secondary-foreground)',
      dasharray = strokeStyle?.dasharray,
      width = strokeStyle?.width,
      color = strokeStyle?.color,
      linecap = strokeStyle?.linecap;

    return g.circle(radius).center(0, 0).fill(fill).stroke({
      dasharray: dasharray,
      width: width,
      color: color,
      linecap: linecap,
    });
  }

  getFlexStrokeWidth() {
    return Math.max(
      this.LINE_STROKE_WIDTH * 0.3,
      Math.min(this.LINE_STROKE_WIDTH / graphStore.getState().scale, this.LINE_STROKE_WIDTH * 1.5),
    );
  }

  getCrushFoldOffset() {
    return Math.max(
      this.CRUSH_FOLD_OFFSET * 0.3,
      Math.min(this.CRUSH_FOLD_OFFSET / graphStore.getState().scale, this.CRUSH_FOLD_OFFSET * 1.5),
    );
  }

  createLine(g: G, node: Node, to: Node, strokeStyle?: StrokeData) {
    const width = strokeStyle?.width ?? this.getFlexStrokeWidth(),
      color = strokeStyle?.color ?? 'var(--secondary-foreground)',
      linecap = strokeStyle?.linecap ?? 'round',
      dasharray = strokeStyle?.dasharray;

    return g
      .path([
        ['M', node.x, node.y],
        ['L', to.x, to.y],
      ])
      .stroke({
        width: width,
        color: color,
        linecap: linecap,
        dasharray: dasharray,
      });
  }

  createPath(g: G, D: PathCommand[] | string, strokeStyle?: StrokeData) {
    const width = strokeStyle?.width ?? this.getFlexStrokeWidth(),
      color = strokeStyle?.color ?? 'var(--secondary-foreground)',
      linecap = strokeStyle?.linecap ?? 'round';

    return g
      .path(D)
      .stroke({
        width: width,
        color: color,
        linecap: linecap,
      })
      .fill('#00000000');
  }
}
