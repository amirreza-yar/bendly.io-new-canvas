import { G, Polyline } from '@svgdotjs/svg.js';
import { BaseMode } from './base';
import { Node } from '@/lib/flashing/types/types';
import { graphStore } from '@/lib/flashing/store/store';
import {
  calculateAngle,
  calculateLength,
  getChangeAngleDiff,
  getChangeLengthDiff,
  getFinalChangeAngleRad,
} from '@/lib/flashing/engine/helpers/geometry';
import { createCurshFoldD } from '@/lib/flashing/engine/helpers/fold';
import { Resize, ResizeBold } from '@/components/icons';
import { Dispatch, SetStateAction } from 'react';
import { ResizeModeComponentProps, ResizeModeUI } from '@/components/canvas/resize';
import { toast } from 'sonner';
import { createAngleAnno, createLengthAnno } from '../helpers/annotation';

export class ResizeMode extends BaseMode {
  name = 'resize';
  title = 'Adjust';
  icon = Resize;
  iconBold = ResizeBold;
  sLine: string | null = null;
  sNode: string | null = null;
  historyStarted: boolean = false;

  ComponentUI = ResizeModeUI;
  setModeProps: Dispatch<SetStateAction<ResizeModeComponentProps>> | undefined;

  constructor() {
    super();
  }

  onUIReady(setModeProps: Dispatch<SetStateAction<ResizeModeComponentProps>>) {
    this.setModeProps = setModeProps;

    this.applyValue = this.applyValue.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);

    setModeProps((prev) => ({
      ...prev,
      onApplyValue: this.applyValue,
      onSave: this.onSave,
      onCancel: this.onCancel,
    }));
  }

  onSave() {
    const state = graphStore.getState();
    const commitRes = state.commitHistory();
    if (commitRes) {
      toast('Flashing adjusted');
      return true;
    } else {
      state.beginHistory();
      this.historyStarted = false;
      this.setModeProps?.((prev) => ({ ...prev, canApply: false }));
      return false;
    }
  }

  onCancel() {
    return graphStore.getState().rollbackHistory();
  }

  applyValue(value: string | number) {
    const s = Number(value);
    console.log(s);
    const state = graphStore.getState();
    const nodes = state.data?.nodes;

    if (!s || typeof s !== 'number' || s < 20) return;
    if (!state || !nodes) return;

    if (!this.historyStarted) {
      state.beginHistory();
      this.historyStarted = true;

      this.setModeProps?.((prev) => ({ ...prev, canApply: true }));
    }

    if (this.sLine && !this.sNode) {
      const sl = this.sLine.split('-');

      const node1 = nodes?.get(sl[0] ?? '');
      const node2 = nodes?.get(node1?.next_node_id ?? '');
      if (!node1 || !node2) return;

      const { dx, dy } = getChangeLengthDiff(node1, node2, s);

      let tNode: Node | null | undefined = node2;

      while (tNode) {
        tNode.x = tNode.x - dx;
        tNode.y = tNode.y - dy;

        tNode = nodes?.get(tNode.next_node_id ?? '');
      }
    } else if (!this.sLine && this.sNode) {
      const baseNode = nodes.get(this.sNode);
      const pNode = nodes?.get(baseNode?.prev_node_id ?? '');
      const nNode = nodes?.get(baseNode?.next_node_id ?? '');
      if (!baseNode || !pNode || !nNode) return;

      const finalradAngle = getFinalChangeAngleRad(pNode, baseNode, nNode, s);

      let tNode: Node | undefined = nNode;

      while (tNode) {
        const { rotatedDX, rotatedDY } = getChangeAngleDiff(baseNode, tNode, finalradAngle);

        tNode.x = baseNode.x + rotatedDX;
        tNode.y = baseNode.y + rotatedDY;

        tNode = nodes.get(tNode.next_node_id ?? '');
      }
    }

    state.setData({ ...state.data, nodes });
  }

  annotaionObjects(nodes: Map<string, Node>, g: G) {
    if (!this.drawAnnotations) return;
    const scale = graphStore.getState().scale;

    const lengthAnnoObjects: { object: G; node: Node; to: Node }[] = [];
    const angleAnnoObjects: {
      object: { arc: Polyline; label: G | undefined };
      prev: Node;
      node: Node;
      to: Node;
    }[] = [];

    nodes.forEach((node) => {
      const to = nodes.get(node.next_node_id ?? '');
      if (!to) return;
      const anno = createLengthAnno(
        node,
        to,
        g,
        scale,
        this.ANNO_TEXT_SIZE,
        this.ANNO_CHANGE_SCALE_OFFSET,
      );
      lengthAnnoObjects.push({ object: anno, node: node, to: to });
    });

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
        this.ANNO_TEXT_SIZE,
        this.ANNO_CHANGE_SCALE_OFFSET,
      );
      angleAnnoObjects.push({ object: anno, prev, node, to });
    });

    lengthAnnoObjects.forEach(({ object, node, to }) => {
      object.on('pointerdown', (e) => {
        e.stopPropagation();
        const isSLine = this.sLine?.split('-')[0] === node.node_id;
        this.onLinePointerDown(node, to, isSLine);
      });
    });

    angleAnnoObjects.forEach(({ object, prev, node, to }) => {
      if (!object.label) return;
      object.label.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onNodePointerDown(prev, node, to);
      });
    });
  }

  onNodePointerDown(pNode: Node, node: Node, nNode: Node) {
    const state = graphStore.getState();
    if (this.sNode === node.node_id) {
      this.sNode = null;
      state.setCanDoModeAction(false);
      this.setModeProps?.((prev) => ({
        ...prev,
        value: null,
        selected: false,
        type: 'line',
        drawerOpen: false,
        triggerCenterCon: false,
      }));
    } else {
      this.sNode = node.node_id;

      const angle = calculateAngle(pNode, node, nNode);

      this.setModeProps?.((prev) => ({
        ...prev,
        value: angle.toFixed(0),
        selected: true,
        type: 'node',
        drawerOpen: true,
        triggerCenterCon: true,
      }));

      state.setModeMeta(angle);

      state.setCanDoModeAction(true);
    }
    this.sLine = null;

    state.setTriggerRender(true);
  }

  onLinePointerDown(node: Node, to: Node, isSLine: boolean) {
    const state = graphStore.getState();
    if (isSLine) {
      this.sLine = null;
      state.setCanDoModeAction(false);
      this.setModeProps?.((prev) => ({
        ...prev,
        value: null,
        selected: false,
        type: 'line',
        drawerOpen: false,
        triggerCenterCon: false,
      }));
    } else {
      const length = calculateLength(node, to);
      this.sLine = `${node.node_id}-${to.node_id}`;
      this.setModeProps?.((prev) => ({
        ...prev,
        value: length.toFixed(1),
        selected: true,
        type: 'line',
        drawerOpen: true,
        triggerCenterCon: true,
      }));
      state.setModeMeta(length);
      state.setCanDoModeAction(true);
    }

    this.sNode = null;
    state.setTriggerRender(true);
  }

  nodeObject(g: G, node: Node) {
    const state = graphStore.getState();
    const nodes = state.data?.nodes;

    const pNode = nodes?.get(node.prev_node_id ?? '');
    const nNode = nodes?.get(node.next_node_id ?? '');

    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = node.next_node_id === undefined;

    if (!(isFirstNode && state.data?.startCrushFold) && !(isLastNode && state.data?.endCrushFold)) {
      this.createNode(g, node);
    }

    if (nNode && pNode) {
      this.createNode(g, node, {
        radius: this.getFlexStrokeWidth() * 15,
        fill: '#00000000',
      })
        .front()
        .on('pointerdown', () => {
          this.onNodePointerDown(pNode, node, nNode);
        });
    }
  }

  edgeObject(g: G, node: Node, to: Node): void {
    const isSLine = this.sLine?.split('-')[0] === node.node_id;

    const D = createCurshFoldD(node, to, this.getCrushFoldOffset());

    if (D !== undefined) {
      this.createPath(g, D, {
        color: isSLine ? 'var(--primary)' : 'var(--secondary-foreground)',
      });

      this.createPath(g, D, {
        width: this.getFlexStrokeWidth() * 10,
      }).on('pointerdown', () => {
        this.onLinePointerDown(node, to, isSLine);
      });
    } else {
      this.createLine(g, node, to, {
        color: isSLine ? 'var(--primary)' : 'var(--secondary-foreground)',
      });

      this.createLine(g, node, to, {
        color: '#00000000',
        width: this.getFlexStrokeWidth() * 10,
      }).on('pointerdown', () => {
        this.onLinePointerDown(node, to, isSLine);
      });
    }
  }

  onPointerDown(e: MouseEvent) {
    const state = graphStore.getState();

    // @ts-expect-error target have instance
    if (e.target?.instance.type === 'svg') {
      this.sLine = null;
      this.sNode = null;
      state.setModeMeta(null);
      state.setTriggerRender(true);
      state.setCanDoModeAction(false);
    }
  }
}
