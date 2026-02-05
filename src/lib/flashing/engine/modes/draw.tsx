import { graphStore } from '@/lib/flashing/store/store';
import { Node } from '@/lib/flashing/types/types';
import { shortId } from '@/lib/flashing/engine/helpers/engine';
import { G } from '@svgdotjs/svg.js';
import { BaseMode } from './base';
import DrawModeUI from '@/components/canvas/draw';
import { Dispatch, SetStateAction } from 'react';
import { ResizeModeComponentProps } from '@/components/canvas/resize';

export class DrawMode extends BaseMode {
  name = 'draw';
  isPanAllowed: boolean = false;
  canDraw: boolean = true;

  ComponentUI = DrawModeUI;
  setModeProps: Dispatch<SetStateAction<ResizeModeComponentProps>> | undefined;

  constructor() {
    super();
    const state = graphStore.getState();
    if (state.data?.startCrushFold && state.drawDirection === false) {
      state.setDrawDirection(true);
    } else if (state.data?.endCrushFold && state.drawDirection === true) {
      state.setDrawDirection(false);
    }
  }

  onUIReady(setModeProps: Dispatch<SetStateAction<ResizeModeComponentProps>>) {
    this.setModeProps = setModeProps;

    const state = graphStore.getState();

    if (state.data?.startCrushFold && state.data?.endCrushFold) {
      this.canDraw = false;
      setTimeout(() => {
        setModeProps((prev) => ({ ...prev, showCantDrawAlert: true }));
      }, 300);
    }
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

    // ---------- BLOCKED ----------
    if (isBlocked) {
      this.createNode(g, node, {
        radius: this.getFlexStrokeWidth() * 15,
        fill: '#df070715',
      }).on('pointerdown', () => {
        alert('This ned is blocked');
      });
      return;
    }

    // ---------- ACTIVE ENDPOINT STYLE ----------
    const isPrimaryActive =
      (isLastNode && drawDirection === true) || (isFirstNode && drawDirection === false);

    if (isEndpoint && isPrimaryActive) {
      this.createNode(g, node, {
        fill: 'var(--primary)',
      });

      this.createNode(
        g,
        node,
        {
          radius: this.getFlexStrokeWidth() * 8,
          fill: '#1447e644',
        },
        {
          width: this.LINE_STROKE_WIDTH - 1,
          color: 'var(--primary)',
          linecap: 'round',
        },
      );
      return;
    }

    // ---------- SECONDARY ENDPOINT STYLE ----------
    if (isEndpoint) {
      this.createNode(g, node, {
        fill: 'var(--secondary-foreground)',
      });

      this.createNode(g, node, {
        radius: this.getFlexStrokeWidth() * 15,
        fill: '#cadf0777',
      }).on('pointerdown', () => {
        if (node.next_node_id === undefined) {
          state.setDrawDirection(true);
        } else if (node.prev_node_id === undefined) {
          state.setDrawDirection(false);
        }
      });

      return;
    }

    // ---------- DEFAULT ----------
    this.createNode(g, node, {
      fill: 'var(--secondary-foreground)',
    });
  }

  onPointerDown(e: MouseEvent, world: { x: number; y: number }) {
    // @ts-expect-error instance exists on event traget
    if (e.target?.instance.type !== 'rect') return;

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
