import { G } from '@svgdotjs/svg.js';
import { Node } from '@/lib/flashing/types/types';
import { BaseMode } from './base';
import { graphStore } from '@/lib/flashing/store/store';
import { FoldModeUI } from '@/components/canvas/fold';
import { Dispatch, SetStateAction } from 'react';
import { RemoveModeComponentProps } from '@/components/canvas/remove';
import { toast } from 'sonner';
import { calculateLineAngle } from '../helpers/geometry';
import { createLengthAnnotations } from '../helpers/annotation';

const PATH_DATA = `M12.0817 0.75V10.0891C12.0817 11.1932 11.1871 12.0882 10.0835 12.0882C8.67968 12.0882 7.71347 10.6782 8.21964 9.36833L9.22718 6.76096M0.75 8.58577L5.08333 4.25244M0.75 4.25244L5.08333 8.58577`;

export class FoldMode extends BaseMode {
  name = 'fold';
  historyStarted: boolean = false;

  ComponentUI = FoldModeUI;
  setModeProps: Dispatch<SetStateAction<RemoveModeComponentProps>> | undefined;

  constructor() {
    super();
  }

  onUIReady(setModeProps: Dispatch<SetStateAction<RemoveModeComponentProps>>) {
    this.setModeProps = setModeProps;

    setModeProps((prev) => ({
      ...prev,
      onSave: this.onSave.bind(this),
      onCancel: this.onCancel.bind(this),
      onToggleFoldDir: this.onToggleFoldDir.bind(this),
      triggerCenterCon: true,
    }));
  }

  onToggleFoldDir() {
    const state = graphStore.getState();

    if (!this.historyStarted) {
      state.beginHistory();
      this.historyStarted = true;
      this.setModeProps?.((prev) => ({ ...prev, canApply: true }));
    }

    state.setData({
      ...state.data,
      crushFoldDir: !!state.data?.crushFoldDir ? false : true,
    });
  }

  onSave() {
    const state = graphStore.getState();
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

  createFoldButton(g: G, node: Node, firstFold: boolean) {
    const state = graphStore.getState();

    const haveCrushFold =
      (firstFold && state.data?.startCrushFold) || (!firstFold && state.data?.endCrushFold);

    this.createNode(
      g,
      node,
      {
        radius: this.getFlexStrokeWidth() * 15,
        fill: haveCrushFold ? 'var(--primary)' : '#00000000',
      },
      {
        width: this.getFlexStrokeWidth(),
        color: 'var(--primary)',
      },
    );

    if (haveCrushFold) {
      const path = this.createPath(g, PATH_DATA, {
        width: 1.5,
        color: 'var(--primary-foreground)',
      });
      const bbox = path.bbox();
      path.move(-bbox.width / 2 - bbox.x, -bbox.height / 2 - bbox.y);
      const pb = path.bbox();
      const scale = (this.getFlexStrokeWidth() * 5) / Math.max(pb.width, pb.height);
      path.scale(scale);
      path.center(0, 0);
    }
  }

  onFoldButtonPointerDown(button: G, firstFold: boolean) {
    const state = graphStore.getState();

    if (!this.historyStarted) {
      state.beginHistory();
      this.historyStarted = true;
      this.setModeProps?.((prev) => ({ ...prev, canApply: true }));
    }

    if (firstFold) {
      state.setData({ ...state.data, startCrushFold: !state.data?.startCrushFold });
    } else {
      state.setData({ ...state.data, endCrushFold: !state.data?.endCrushFold });
    }
  }

  nodeObject(g: G, node: Node): void {
    if (node.prev_node_id === undefined) {
      const state = graphStore.getState();
      const nodes = state.data?.nodes;
      const to = nodes?.get(node.next_node_id ?? '');

      if (!to) return;
      const angle = calculateLineAngle(node, to);

      const A1 = {
        y: -this.getCrushFoldOffset() * 5 * Math.sin((angle * Math.PI) / 180),
        x: -this.getCrushFoldOffset() * 5 * Math.cos((angle * Math.PI) / 180),
      };

      const button = g.group().translate(A1.x, A1.y);

      this.createFoldButton(button, node, true);

      button.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onFoldButtonPointerDown(button, true);
      });
    }

    if (node.next_node_id === undefined) {
      const state = graphStore.getState();
      const nodes = state.data?.nodes;
      const to = nodes?.get(node.prev_node_id ?? '');

      if (!to) return;
      const angle = calculateLineAngle(node, to);

      const A1 = {
        y: -this.getCrushFoldOffset() * 5 * Math.sin((angle * Math.PI) / 180),
        x: -this.getCrushFoldOffset() * 5 * Math.cos((angle * Math.PI) / 180),
      };

      const button = g.group().translate(A1.x, A1.y);

      this.createFoldButton(button, node, false);

      button.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onFoldButtonPointerDown(button, false);
      });
    }
  }

  edgeObject(g: G, node: Node, to: Node) {
    const { data: pathD } = this.createLineORFoldPathData(node, to);
    this.createPath(g, pathD);
  }

  onAction(s: { startCrushFold?: boolean; endCrushFold?: boolean; crushFoldDir?: boolean }) {
    const state = graphStore.getState();

    state.beginHistory();

    if (s.startCrushFold !== undefined) {
      state.setData({ ...state.data, startCrushFold: s.startCrushFold });
    }

    if (s.endCrushFold !== undefined) {
      state.setData({ ...state.data, endCrushFold: s.endCrushFold });
    }

    if (s.crushFoldDir !== undefined) {
      state.setData({ ...state.data, crushFoldDir: s.crushFoldDir });
    }

    state.commitHistory();
  }
}
