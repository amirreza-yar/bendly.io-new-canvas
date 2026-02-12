import { graphStore } from '@/lib/flashing/store/store';
import { Node } from '@/lib/flashing/types/types';
import { shortId } from '@/lib/flashing/engine/helpers/engine';
import { G } from '@svgdotjs/svg.js';
import { BaseMode } from './base';
import DrawModeUI, { DrawModeComponentProps } from '@/components/canvas/draw';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { createAngleAnnotations } from '../helpers/annotation';

export class DrawMode extends BaseMode {
  name = 'draw';
  isPanAllowed: boolean = false;
  canDraw: boolean = true;
  foldToRemove: 'start' | 'end' | null = null;

  sFNode: Node | null = null;
  longPressTimer: number | null = null;

  ComponentUI = DrawModeUI;
  setModeProps: Dispatch<SetStateAction<DrawModeComponentProps>> | undefined;

  constructor() {
    super();
    const state = graphStore.getState();
    if (state.data?.startCrushFold && state.drawDirection === false) {
      state.setDrawDirection(true);
    } else if (state.data?.endCrushFold && state.drawDirection === true) {
      state.setDrawDirection(false);
    }
  }

  annotaionObjects(nodes: Map<string, Node>, g: G) {
    if (!this.drawAnnotations) return;
    const scale = graphStore.getState().scale;
    createAngleAnnotations(nodes, g, scale, this.ANNO_TEXT_SIZE, this.ANNO_CHANGE_SCALE_OFFSET);
  }

  onUIReady(setModeProps: Dispatch<SetStateAction<DrawModeComponentProps>>) {
    this.setModeProps = setModeProps;

    setModeProps((prev) => ({
      ...prev,
      onRemoveFold: this.removeFold.bind(this),
      onLineDeselect: this.lineDeselect.bind(this),
      onRemoveLine: this.removeLine.bind(this),
    }));

    const state = graphStore.getState();

    if (state.data?.startCrushFold && state.data?.endCrushFold) {
      this.canDraw = false;
      setTimeout(() => {
        setModeProps((prev) => ({ ...prev, showCantDrawAlert: true }));
      }, 300);
    }
  }

  removeLine() {
    const state = graphStore.getState();
    if (!state || !state.data?.nodes || !this.sFNode) return false;

    state.beginHistory();

    const nodes = new Map(state.data.nodes);

    const baseNode = { ...nodes.get(this.sFNode.node_id)! };
    nodes.set(baseNode.node_id, baseNode);

    const nodeToRemove = nodes.get(baseNode.next_node_id ?? '');
    if (!nodeToRemove) return;

    const offsetX = nodeToRemove.x - baseNode.x;
    const offsetY = nodeToRemove.y - baseNode.y;

    let tmpNode = nodes.get(nodeToRemove.next_node_id ?? '');

    nodes.delete(nodeToRemove.node_id);

    baseNode.next_node_id = tmpNode?.node_id;
    baseNode.next_line_bside_length = nodeToRemove?.next_line_bside_length;

    if (tmpNode) {
      tmpNode = { ...tmpNode };
      nodes.set(tmpNode.node_id, tmpNode);
      tmpNode.prev_node_id = baseNode.node_id;
    }

    if (baseNode.next_line_bside_length) {
      delete baseNode.next_line_bside_length;
    }

    while (tmpNode) {
      tmpNode.x -= offsetX;
      tmpNode.y -= offsetY;

      const next = nodes.get(tmpNode.next_node_id ?? '');
      if (!next) break;

      tmpNode = { ...next };
      nodes.set(tmpNode.node_id, tmpNode);
    }

    this.sFNode = null;

    state.setData({ ...state.data, nodes });
    const commitRes = state.commitHistory();

    if (commitRes) {
      toast('Line removed');
      return true;
    }
  }

  lineLongPress(e: Event, node: Node) {
    this.longPressTimer = window.setTimeout(() => {
      // @ts-expect-error clientX and clientY exists
      const x = e.clientX,
        // @ts-expect-error clientX and clientY exists
        y = e.clientY;

      this.sFNode = node;

      graphStore.getState().setTriggerRender(true);

      this.setModeProps?.((prev) => ({
        ...prev,
        openLineDropdown: true,
        dropdownPosition: { x: x, y: y },
        lineID: node.node_id,
      }));
    }, this.LONG_PRESS_DURATION);
  }

  lineDeselect() {
    this.sFNode = null;
    graphStore.getState().setTriggerRender(true);
  }

  edgeObject(g: G, node: Node, to: Node): undefined {
    const { data: pathD } = this.createLineORFoldPathData(node, to);
    const isSLine = this.sFNode === node;

    const lineG = g.group();

    this.createPath(lineG, pathD, {
      color: isSLine ? 'var(--primary)' : undefined,
      dasharray: isSLine ? `${Math.round(this.getFlexStrokeWidth() * 3)}` : undefined,
    });

    if (isSLine) {
      this.createPath(lineG, pathD, {
        color: 'var(--primary)',
        width: this.getFlexStrokeWidth() * 5,
      }).opacity(0.2);
    }

    this.createPath(lineG, pathD, {
      color: '#00000000',
      width: this.getFlexStrokeWidth() * 10,
    });

    this.createLengthAnno({
      node,
      to,
      g: lineG,
      bgColor: isSLine ? 'var(--anno-length-selected)' : undefined,
    });

    lineG?.on('pointerdown', (e) => {
      e.stopPropagation();
      this.lineLongPress(e, node);
    });

    lineG?.on('pointerup pointerleave', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;

        if (this.sFNode === node) return;

        this.setModeProps?.((prev) => ({
          ...prev,
          openLineDropdown: false,
        }));

        this.lineDeselect();
      }
    });
  }

  removeFold() {
    const state = graphStore.getState();

    if (!state || !this.foldToRemove) {
      return;
    }

    state.beginHistory();

    if (this.foldToRemove === 'start') {
      state.setData({ ...state.data, startCrushFold: false });
      state.setDrawDirection(false);
    } else {
      state.setData({ ...state.data, endCrushFold: false });
      state.setDrawDirection(true);
    }

    this.canDraw = true;

    state.commitHistory();
    state.setTriggerRender(true);
  }

  nodeObject(g: G, node: Node) {
    const state = graphStore.getState();
    const drawDirection = state.drawDirection;

    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = node.next_node_id === undefined;

    const isStartBlocked = isFirstNode && state.data?.startCrushFold;
    const isEndBlocked = isLastNode && state.data?.endCrushFold;
    const isBlocked = isStartBlocked || isEndBlocked;

    const isEndpoint = isFirstNode || isLastNode;

    if (isBlocked) {
      this.createNode(g, node, {
        radius: this.getFlexStrokeWidth() * 15,
        fill: '#00000000',
      }).on('pointerdown', () => {
        this.foldToRemove = node.prev_node_id ? 'end' : 'start';

        this.setModeProps?.((prev) => ({
          ...prev,
          showRemoveFoldAlert: true,
        }));
      });
      return;
    }

    const isPrimaryActive =
      (isLastNode && drawDirection === true) || (isFirstNode && drawDirection === false);

    if (isEndpoint && isPrimaryActive) {
      this.createNode(g, node, {
        fill: 'var(--draw-pointer-foreground)',
      });

      this.createNode(
        g,
        node,
        {
          radius: this.getFlexStrokeWidth() * 8,
          fill: 'var(--draw-pointer)',
        },
        {
          width: this.getFlexStrokeWidth() * 0.7,
          color: 'var(--draw-pointer-foreground)',
          linecap: 'round',
        },
      );
      return;
    }

    if (isEndpoint) {
      this.createNode(g, node);

      this.createNode(g, node, {
        radius: this.getFlexStrokeWidth() * 15,
        fill: '#00000000',
      }).on('pointerdown', () => {
        if (node.next_node_id === undefined) {
          state.setDrawDirection(true);
        } else if (node.prev_node_id === undefined) {
          state.setDrawDirection(false);
        }
      });

      return;
    }

    this.createNode(g, node);
  }

  onPointerDown(e: MouseEvent, world: { x: number; y: number }) {
    // @ts-expect-error instance exists on event traget
    if (e.target?.instance.type !== 'rect') return;

    if (this.sFNode) return;

    const state = graphStore.getState();
    if (!state.data) return;
    const nodes = state.data.nodes;

    if (!this.canDraw) {
      this.setModeProps?.((prev) => ({ ...prev, showCantDrawAlert: true }));
      return;
    }
    const gap = state.gridGap ?? 50; // fallback, be boring

    const snap = (v: number) => Math.round(v / gap) * gap;
    const snapX = snap(world.x);
    const snapY = snap(world.y);

    const exists = Array.from(nodes.values()).some((node) => node.x === snapX && node.y === snapY);

    if (exists) return;

    state.beginHistory();
    const id = shortId();

    const firstNode = nodes.get(
      Array.from(nodes.values()).find((n) => n.prev_node_id === undefined)?.node_id ?? '',
    );

    const lastNode = nodes.get(
      Array.from(nodes.values()).find((n) => n.next_node_id === undefined)?.node_id ?? '',
    );

    if (state.drawDirection) {
      if (lastNode) {
        lastNode.next_node_id = id;
      }

      nodes.set(id, {
        node_id: id,
        x: snapX,
        y: snapY,
        next_node_id: undefined,
        prev_node_id: lastNode?.node_id,
      });
    } else {
      if (firstNode) {
        firstNode.prev_node_id = id;
      }

      nodes.set(id, {
        node_id: id,
        x: snapX,
        y: snapY,
        next_node_id: firstNode?.node_id,
        prev_node_id: undefined,
      });
    }

    state.setData({ ...state.data, nodes });
    state.commitHistory();
  }
}
