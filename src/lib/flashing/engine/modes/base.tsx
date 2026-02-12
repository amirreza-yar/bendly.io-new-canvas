import { G, PathCommand, StrokeData } from '@svgdotjs/svg.js';
import { graphStore } from '@/lib/flashing/store/store';
import { AngleAnnoType, LengthAnnoType, Mode, Node } from '@/lib/flashing/types/types';
import {
  createAngleAnnotations,
  createLengthAnno,
  createLengthAnnotations,
  drawAngleArc,
  drawAngleText,
} from '@/lib/flashing/engine/helpers/annotation';
import BaseModeUI from '@/components/canvas/base';
import { calculateLineAngle, computeAngle, createCrushFoldCoords } from '../helpers/geometry';

export class BaseMode implements Mode {
  name: string = 'draw';
  isPanAllowed: boolean = true;
  drawFolds: boolean = true;
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

  LONG_PRESS_DURATION = 500;

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

  createLengthAnno({
    node,
    to,
    g,
    scale = graphStore.getState().scale,
    textSize = this.ANNO_TEXT_SIZE,
    scaleOffset = this.ANNO_CHANGE_SCALE_OFFSET,
    textPrefix = '',
    bgColor,
    bgColorSec,
    showTapered = true,
  }: LengthAnnoType) {
    return createLengthAnno(
      node,
      to,
      g,
      scale,
      textSize,
      scaleOffset,
      bgColor,
      bgColorSec,
      showTapered,
      textPrefix,
    );
  }

  createAngleAnno({
    g,
    prevNode,
    node,
    nextNode,
    scale = graphStore.getState().scale,
    textSize = this.ANNO_TEXT_SIZE,
    scaleOffset = this.ANNO_CHANGE_SCALE_OFFSET,
    bgColor,
    bgColorSec,
  }: AngleAnnoType) {
    const { angle, startAngle, endAngle } = computeAngle(prevNode, node, nextNode);

    const arc = drawAngleArc(g, node, startAngle, endAngle, 18, scale);
    const label = drawAngleText(
      g,
      node,
      startAngle,
      endAngle,
      angle,
      40,
      textSize,
      scale,
      scaleOffset,
      bgColor,
      bgColorSec,
    );

    return {
      arc: arc,
      label: label,
    };
  }

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

  edgeObject(
    g: G,
    node: Node,
    to: Node,
    // eslint-disable-next-line
    render?: () => void,
    // eslint-disable-next-line
    extraLayer?: G,
  ): G | undefined | void {
    const { data: pathD } = this.createLineORFoldPathData(node, to);

    const lineG = g.group();

    this.createPath(lineG, pathD);

    this.createLengthAnno({
      node,
      to,
      g: lineG,
    });

    return lineG;
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
      // fill = strokeStyle?.color ?? 'var(--base-drawing-color)',
      fill = nodeStyle?.fill ?? 'var(--base-drawing)',
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
      color = strokeStyle?.color ?? 'var(--base-drawing)',
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
      color = strokeStyle?.color ?? 'var(--base-drawing)',
      linecap = strokeStyle?.linecap ?? 'round',
      dasharray = strokeStyle?.dasharray,
      linejoin = strokeStyle?.linejoin ?? 'round';

    return g
      .path(D)
      .stroke({
        width: width,
        color: color,
        linecap: linecap,
        dasharray: dasharray,
        linejoin: linejoin,
      })
      .fill('#00000000');
  }

  shouldAddCrushFold(node: Node, to: Node): { add: boolean; first: boolean } {
    const state = graphStore.getState();
    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = to.next_node_id === undefined;

    if (isFirstNode && state.data?.startCrushFold) {
      return { add: true, first: true };
    }

    if (isLastNode && state.data?.endCrushFold) {
      return { add: true, first: false };
    }

    return { add: false, first: false };
  }

  getCrushFoldDir(isFirst: boolean): 1 | -1 | undefined {
    const state = graphStore.getState();
    if (isFirst) {
      return state.data?.crushFoldDir ? -1 : 1;
    }
    if (!isFirst) {
      return state.data?.crushFoldDir ? 1 : -1;
    }
  }

  getCrushFoldAngle(node: Node, to: Node, isFirst: boolean): number | void {
    const state = graphStore.getState();

    if (isFirst && state.data?.startCrushFold) {
      return calculateLineAngle(node, to);
    }

    if (!isFirst && state.data?.endCrushFold) {
      return calculateLineAngle(to, node);
    }
  }

  createLineORFoldPathData(node: Node, to: Node): { data: PathCommand[] } {
    if (!this.drawFolds) {
      return {
        data: [
          ['M', node.x, node.y],
          ['L', to.x, to.y],
        ],
      };
    }

    const { add: shouldAdd, first: isFirst } = this.shouldAddCrushFold(node, to);
    if (!shouldAdd) {
      return {
        data: [
          ['M', node.x, node.y],
          ['L', to.x, to.y],
        ],
      };
    }

    const foldDir = this.getCrushFoldDir(isFirst);
    const angle = this.getCrushFoldAngle(node, to, isFirst);
    const M = isFirst ? node : to;
    const baseM = isFirst ? to : node;
    const offset = this.getCrushFoldOffset();

    const { A1, A2, A3, A4 } = createCrushFoldCoords(M, offset, angle!, foldDir!);

    return {
      data: [
        ['M', baseM.x, baseM.y],
        ['L', M.x, M.y],
        ['C', A1.x, A1.y, A2.x, A2.y, A3.x, A3.y],
        ['L', A4.x, A4.y],
      ],
    };
  }
}
