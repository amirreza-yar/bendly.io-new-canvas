import { graphStore } from '@/lib/graph/store/store';
import { Node } from '@/lib/graph/types/types';
import { shortId } from '@/lib/graph/engine/helpers/engine';
import { G } from '@svgdotjs/svg.js';
import { BaseMode } from './base';
import { Component, ReactNode, RefObject } from 'react';
import { Engine } from '../engine';
import { IdleMode } from './idle';
import { Button } from '@/components/ui/button';
import { ArrowRight, Redo2, Settings, Undo2, X } from 'lucide-react';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import {
  Crosshair,
  CrushFold,
  Drawing,
  DrawingBold,
  Modify,
  Resize,
  ResizeBold,
  Taper,
} from '@/components/icons';
import { ResizeMode } from './resize';
import { cn } from '@/lib/utils';

export class DrawMode extends BaseMode {
  name = 'draw';
  isPanAllowed: boolean = false;

  constructor() {
    super();
  }

  nodeObject(g: G, node: Node) {
    const state = graphStore.getState();
    const drawDirection = state.drawDirection;

    g.circle(this.NODE_RADIUS)
      .center(0, 0)
      .fill(
        (drawDirection === true && node.next_node_id === undefined) ||
          (drawDirection === false && node.prev_node_id === undefined)
          ? '#4400ffff'
          : '#000',
      );

    if (
      (drawDirection === true && node.next_node_id === undefined) ||
      (drawDirection === false && node.prev_node_id === undefined)
    ) {
      g.circle(this.NODE_OVERLAY_RADIUS)
        .center(0, 0)
        .fill('#4400ff42')
        .stroke({
          width: this.LINE_STROKE_WIDTH - 1,
          color: '#4400ff',
          linecap: 'round',
        })
        .data('nodeId', `${node.node_id}`);
    } else if (
      (drawDirection === false && node.next_node_id === undefined) ||
      (drawDirection === true && node.prev_node_id === undefined)
    ) {
      g.circle(this.NODE_HIT_WIDTH)
        .center(0, 0)
        .fill('#df070777')
        .data('nodeId', `${node.node_id}`)
        .on('mousedown', () => {
          if (node.next_node_id === undefined) {
            state.setDrawDirection(true);
          } else if (node.prev_node_id === undefined) {
            state.setDrawDirection(false);
          }
        });
    }
  }

  edgeObject(g: G, node: Node, to: Node) {
    g.line(node.x, node.y, to.x, to.y).stroke({
      width: this.LINE_STROKE_WIDTH,
      color: '#444',
      linecap: 'round',
    });
  }

  onPointerDown(e: MouseEvent, world: { x: number; y: number }) {
    const state = graphStore.getState();
    if (!state.data) return;
    const nodes = state.data.nodes;

    // @ts-expect-error instance exists on event traget
    if (e.target?.instance.type !== 'rect') return;

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
