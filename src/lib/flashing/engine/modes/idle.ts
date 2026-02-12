import { G } from '@svgdotjs/svg.js';
import { BaseMode } from './base';
import IdleModeUI, { IdleModeComponentProps } from '@/components/canvas/idle';
import { Node } from '../../types/types';
import { graphStore } from '../../store/store';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { createAngleAnnotations } from '../helpers/annotation';
export class IdleMode extends BaseMode {
  name = 'idle';
  longPressTimer: number | null = null;
  sFNode: Node | null = null;
  historyStarted: boolean = false;

  ComponentUI = IdleModeUI;
  setModeProps: Dispatch<SetStateAction<IdleModeComponentProps>> | undefined;

  constructor() {
    super();
  }

  onUIReady(setModeProps: Dispatch<SetStateAction<IdleModeComponentProps>>) {
    this.setModeProps = setModeProps;

    setModeProps((prev) => ({
      ...prev,
      onLineDeselect: this.lineDeselect.bind(this),
      onRemoveLine: this.removeLine.bind(this),
    }));
  }

  annotaionObjects(nodes: Map<string, Node>, g: G) {
    if (!this.drawAnnotations) return;
    const scale = graphStore.getState().scale;
    createAngleAnnotations(nodes, g, scale, this.ANNO_TEXT_SIZE, this.ANNO_CHANGE_SCALE_OFFSET);
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

  nodeObject(g: G, node: Node): void {
    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = node.next_node_id === undefined;
    const state = graphStore.getState();
    if (!(isFirstNode && state.data?.startCrushFold) && !(isLastNode && state.data?.endCrushFold)) {
      this.createNode(g, node);
    }
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
}
