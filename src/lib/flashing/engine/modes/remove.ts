import { G } from '@svgdotjs/svg.js';
import { BaseMode } from './base';
import { Node } from '@/lib/flashing/types/types';
import { graphStore } from '@/lib/flashing/store/store';
import { RemoveModeComponentProps, RemoveModeUI } from '@/components/canvas/remove';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { createLengthAnnotations } from '../helpers/annotation';
export class RemoveMode extends BaseMode {
  name = 'remove';
  selectedLines: string[] = [];
  historyStarted: boolean = false;

  ComponentUI = RemoveModeUI;
  setModeProps: Dispatch<SetStateAction<RemoveModeComponentProps>> | undefined;

  constructor() {
    super();
  }

  onUIReady(setModeProps: Dispatch<SetStateAction<RemoveModeComponentProps>>) {
    this.setModeProps = setModeProps;
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);

    setModeProps((prev) => ({
      ...prev,
      onSave: this.onSave,
      onCancel: this.onCancel,
    }));
  }

  onSave() {
    const state = graphStore.getState();
    const nodes = state.data?.nodes;

    if (!state || !nodes) return false;

    state.beginHistory();

    for (const sl of this.selectedLines) {
      const [node1, node2] = sl.split('-');

      const baseN1 = nodes?.get(node1);
      const baseN2 = nodes?.get(node2);

      if (baseN1) {
        const baseNode = baseN1;
        if (!baseNode) continue;

        const nodeToRemove = nodes?.get(baseNode.next_node_id ?? '');
        if (!nodeToRemove) continue;

        const offsetX = nodeToRemove?.x - baseNode?.x;
        const offsetY = nodeToRemove?.y - baseNode?.y;

        let tmpNode = nodes?.get(nodeToRemove.next_node_id ?? '');

        nodes?.delete(nodeToRemove.node_id);

        baseNode.next_node_id = tmpNode?.node_id;

        if (!tmpNode) continue;
        tmpNode.prev_node_id = baseNode.node_id;

        if (baseNode.next_line_bside_length) {
          delete baseNode.next_line_bside_length;
        }

        while (tmpNode) {
          tmpNode.x = tmpNode.x - offsetX;
          tmpNode.y = tmpNode.y - offsetY;

          tmpNode = nodes?.get(tmpNode.next_node_id ?? '');
        }
      } else if (baseN2) {
        const baseNode = nodes?.get(baseN2.prev_node_id ?? '');
        if (!baseNode) continue;

        const nodeToRemove = baseN2;
        if (!nodeToRemove) continue;

        const offsetX = nodeToRemove?.x - baseNode?.x;
        const offsetY = nodeToRemove?.y - baseNode?.y;

        let tmpNode = nodes?.get(nodeToRemove.next_node_id ?? '');

        nodes?.delete(nodeToRemove.node_id);

        baseNode.next_node_id = tmpNode?.node_id;

        if (!tmpNode) continue;
        tmpNode.prev_node_id = baseNode.node_id;

        while (tmpNode) {
          tmpNode.x = tmpNode.x - offsetX;
          tmpNode.y = tmpNode.y - offsetY;

          tmpNode = nodes?.get(tmpNode.next_node_id ?? '');
        }
      }
    }

    this.selectedLines = [];

    state.setData({ ...state.data, nodes });
    const commitRes = state.commitHistory();

    if (commitRes) {
      toast('Flashing line(s) removed');
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

  annotaionObjects(nodes: Map<string, Node>, g: G): void {
    const annos = createLengthAnnotations(
      nodes,
      g,
      Infinity,
      this.ANNO_TEXT_SIZE,
      this.ANNO_CHANGE_SCALE_OFFSET,
    );

    annos.forEach(({ object }) => {
      object.opacity(0);
    });
  }

  onLineSelect(node: Node, to: Node, isLineSelected: boolean) {
    const state = graphStore.getState();

    if (isLineSelected) {
      this.selectedLines = this.selectedLines?.filter(
        (line) => line !== `${node.node_id}-${to.node_id}`,
      );
    } else {
      this.selectedLines.push(`${node.node_id}-${to.node_id}`);
    }

    state.setTriggerRender(true);

    if (this.selectedLines.length > 0) {
      this.historyStarted = true;
      this.setModeProps?.((prev) => ({ ...prev, canApply: true }));
    } else {
      this.historyStarted = false;
      this.setModeProps?.((prev) => ({ ...prev, canApply: false }));
    }
  }

  edgeObject(g: G, node: Node, to: Node) {
    const pathD = this.createLineORFoldPathData(node, to).data;
    const isLineSelected = this.selectedLines?.includes(`${node.node_id}-${to.node_id}`);

    this.createPath(g, pathD, {
      color: isLineSelected ? 'var(--remove-line-selected-foreground)' : undefined,
      linecap: 'round',
      dasharray: isLineSelected ? '10' : undefined,
    }).on('pointerdown', () => {
      this.onLineSelect(node, to, isLineSelected);
    });

    if (isLineSelected) {
      this.createPath(g, pathD, {
        width: this.getFlexStrokeWidth() * 6,
        color: isLineSelected ? 'var(--remove-line-selected)' : undefined,
        linecap: 'round',
      }).on('pointerdown', () => {
        this.onLineSelect(node, to, isLineSelected);
      });
    }

    this.createPath(g, pathD, {
      width: this.getFlexStrokeWidth() * 12,
      color: '#00000000',
      linecap: 'round',
      dasharray: isLineSelected ? '10' : '1',
    })
      .front()
      .on('pointerdown', () => {
        this.onLineSelect(node, to, isLineSelected);
      });
  }
}
