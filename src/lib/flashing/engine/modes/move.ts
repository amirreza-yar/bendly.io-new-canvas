import { G } from '@svgdotjs/svg.js';
import { graphStore } from '@/lib/flashing/store/store';
import { Node } from '@/lib/flashing/types/types';
import { BaseMode } from './base';
import { MoveModeComponentProps, MoveModeUI } from '@/components/canvas/move';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { createAngleAnno, createLengthAnnotations } from '../helpers/annotation';

export class MoveMode extends BaseMode {
  name = 'move';
  isPanAllowed = true;
  drawFolds = false;
  selectedNode: Node | null = null;

  historyStarted: boolean = false;

  moved: boolean = false;
  offsetX: number | null = null;
  offsetY: number | null = null;

  ComponentUI = MoveModeUI;
  setModeProps: Dispatch<SetStateAction<MoveModeComponentProps>> | undefined;

  constructor() {
    super();
  }

  onUIReady(setModeProps: Dispatch<SetStateAction<MoveModeComponentProps>>) {
    this.setModeProps = setModeProps;
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);

    setModeProps((prev) => ({
      ...prev,
      onSave: this.onSave,
      onCancel: this.onCancel,
    }));
  }

  updateComponentValue(prop: MoveModeComponentProps) {
    this.setModeProps?.(prop);
  }

  onSave() {
    const state = graphStore.getState();
    const commitRes = state.commitHistory();
    if (commitRes) {
      toast('Flashing moved');
      return true;
    } else {
      this.historyStarted = false;
      this.setModeProps?.((prev) => ({ ...prev, canApply: false }));
      return false;
    }
  }

  onCancel() {
    return graphStore.getState().rollbackHistory();
  }

  annotaionObjects(nodes: Map<string, Node>, g: G) {
    if (!this.drawAnnotations) return;
    const scale = graphStore.getState().scale;

    createLengthAnnotations(
      nodes,
      g,
      scale * 1.2,
      this.ANNO_TEXT_SIZE,
      this.ANNO_CHANGE_SCALE_OFFSET,
    );

    const angleAnnoObjects: {
      object: { label: G | undefined };
      prev: Node;
      node: Node;
      to: Node;
    }[] = [];

    nodes.forEach((node) => {
      const prev = nodes.get(node.prev_node_id ?? '');
      const to = nodes.get(node.next_node_id ?? '');
      if (!prev || !to) return;

      const anno = createAngleAnno(
        g,
        prev,
        node,
        to,
        scale,
        this.ANNO_TEXT_SIZE / 1.2,
        this.ANNO_CHANGE_SCALE_OFFSET,
      );
      angleAnnoObjects.push({ object: anno, prev, node, to });
    });

    angleAnnoObjects.forEach(({ object, node }) => {
      if (!object.label) return;
      object.label.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onNodePointerDown(node);
      });
    });
  }

  onNodePointerDown(node: Node) {
    this.selectedNode = node;
    this.moved = false;
    this.isPanAllowed = false;
  }

  nodeObject(g: G, node: Node) {
    this.createNode(g, node, {
      fill: 'var(--move-pointer-foreground)',
    });

    this.createNode(
      g,
      node,
      {
        radius: this.getFlexStrokeWidth() * 10,
        fill: 'var(--move-pointer)',
      },
      {
        width: this.getFlexStrokeWidth(),
        color: 'var(--move-pointer-foreground)',
        linecap: 'round',
        dasharray: `${Math.round(this.getFlexStrokeWidth() * 2.5)}`,
      },
    );

    this.createNode(g, node, {
      fill: '#ff000000',
      radius: this.getFlexStrokeWidth() * 15,
    }).on('pointerdown', () => {
      this.onNodePointerDown(node);
    });
  }

  onPointerDown(_: PointerEvent, world: { x: number; y: number }) {
    if (this.selectedNode) {
      this.offsetX = world.x - this.selectedNode.x;
      this.offsetY = world.y - this.selectedNode.y;

      graphStore.getState().beginHistory();
    }
  }

  onPointerMove(e: PointerEvent, world: { x: number; y: number }) {
    if (!this.selectedNode) return;

    const state = graphStore.getState();
    if (!state.data) return;

    const nodes = state.data.nodes;

    if (!this.historyStarted) {
      state.beginHistory();
      this.historyStarted = true;
      this.setModeProps?.((prev) => ({ ...prev, canApply: true }));
    }

    const prevNode = nodes.get(this.selectedNode.prev_node_id ?? '');

    if (prevNode?.next_line_bside_length) {
      delete prevNode.next_line_bside_length;
    }

    if (this.selectedNode.next_line_bside_length) {
      delete this.selectedNode.next_line_bside_length;
    }

    this.selectedNode.x = world.x - (this.offsetX ?? 0);
    this.selectedNode.y = world.y - (this.offsetY ?? 0);

    state.setData({ ...graphStore.getState().data! });

    this.moved = true;
    state.setData({ ...state.data });
  }

  onPointerUp() {
    if (this.selectedNode && this.moved) {
      this.offsetX = null;
      this.offsetY = null;
    } else {
      // graphStore.getState().rollbackHistory();
    }

    this.setModeProps?.((prev) => ({
      ...prev,
      triggerCenterCon: true,
    }));

    this.selectedNode = null;
    this.moved = false;
    this.isPanAllowed = true;
  }
}
