import { G } from '@svgdotjs/svg.js';
import { BaseMode } from './base';
import { Node } from '@/lib/graph/types/types';
import { graphStore } from '@/lib/graph/store/store';
import {
  calculateAngle,
  calculateLength,
  getChangeAngleDiff,
  getChangeLengthDiff,
  getFinalChangeAngleRad,
} from '@/lib/graph/engine/helpers/geometry';
import { createCurshFoldD } from '@/lib/graph/engine/helpers/fold';
import { Resize, ResizeBold } from '@/components/icons';
import { Dispatch, SetStateAction } from 'react';
import { ResizeModeComponentProps, ResizeModeUI } from '@/components/canvas/resize';

export class ResizeMode extends BaseMode {
  name = 'resize';
  title = 'Adjust';
  icon = Resize;
  iconBold = ResizeBold;
  sLine: string | null = null;
  sNode: string | null = null;
  meta: string | number | null = null;

  ComponentUI = ResizeModeUI;

  setModeProps: Dispatch<SetStateAction<ResizeModeComponentProps>> | undefined;

  constructor() {
    super();
  }

  onUIReady(setModeProps: Dispatch<SetStateAction<ResizeModeComponentProps>>) {
    this.setModeProps = setModeProps;
  }

  updateComponentValue(prop: ResizeModeComponentProps) {
    this.setModeProps?.(prop);
  }

  nodeObject(g: G, node: Node) {
    const state = graphStore.getState();
    const nodes = state.data?.nodes;

    const pNode = nodes?.get(node.prev_node_id ?? '');
    const nNode = nodes?.get(node.next_node_id ?? '');

    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = node.next_node_id === undefined;

    if (!(isFirstNode && state.data?.startCrushFold) && !(isLastNode && state.data?.endCrushFold)) {
      // g.circle(this.NODE_RADIUS).center(0, 0).fill('#000');
      this.createNode(g, node);
    }

    if (nNode && pNode) {
      this.createNode(g, node, {
        radius: this.getFlexStrokeWidth() * 15,
        fill: this.sNode === node.node_id ? '#163ada66' : '#2100da28',
      })
        .front()
        .on('pointerdown', () => {
          console.log(calculateAngle(pNode.x, pNode.y, node.x, node.y, nNode.x, nNode.y));

          if (this.sNode === node.node_id) {
            this.sNode = null;
            state.setCanDoModeAction(false);
          } else {
            this.sNode = node.node_id;
            console.log(calculateAngle(pNode.x, pNode.y, node.x, node.y, nNode.x, nNode.y));

            state.setModeMeta(calculateAngle(pNode.x, pNode.y, node.x, node.y, nNode.x, nNode.y));

            state.setCanDoModeAction(true);
          }
          this.sLine = null;

          state.setTriggerRender(true);
        });
    }
  }

  edgeObject(g: G, node: Node, to: Node): void {
    const state = graphStore.getState();
    const isSLine = this.sLine?.split('-')[0] === node.node_id;

    const D = createCurshFoldD(node, to, state, state.CRUSH_FOLD_OFFSET);

    if (D !== undefined) {
      this.createPath(g, D, {
        color: isSLine ? '#da1616ff' : '#000',
      });

      this.createPath(g, D, {
        width: this.getFlexStrokeWidth() * 10,
        color: isSLine ? '#da1616ff' : '#000',
      }).on('pointerdown', () => {
        if (isSLine) {
          this.sLine = null;
          state.setCanDoModeAction(false);
        } else {
          this.sLine = `${node.node_id}-${to.node_id}`;
          console.log(calculateLength(node, to));
          state.setModeMeta(calculateLength(node, to));
          state.setCanDoModeAction(true);
        }

        this.sNode = null;
        state.setTriggerRender(true);
      });
    } else {
      this.createLine(g, node, to, {
        color: isSLine ? '#da1616ff' : '#000',
      });

      this.createLine(g, node, to, {
        color: isSLine ? '#163ada66' : '#da161628',
        width: this.getFlexStrokeWidth() * 10,
      }).on('pointerdown', () => {
        if (isSLine) {
          this.sLine = null;
          state.setCanDoModeAction(false);
          this.updateComponentValue({
            value: null,
            selected: false,
            type: 'line',
            drawerOpen: false,
          });
        } else {
          this.sLine = `${node.node_id}-${to.node_id}`;
          console.log(calculateLength(node, to));
          this.updateComponentValue({
            value: String(calculateLength(node, to)),
            selected: true,
            type: 'line',
            drawerOpen: true,
          });
          state.setModeMeta(calculateLength(node, to));
          state.setCanDoModeAction(true);
        }

        this.sNode = null;
        state.setTriggerRender(true);
      });
    }
  }

  onAction(s: number) {
    const state = graphStore.getState();
    const nodes = state.data?.nodes;

    if (!state || !nodes) return;
    if (!s || s < 1) return;

    state.beginHistory();

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
    state.commitHistory();
  }

  // eslint-disable-next-line
  onPointerDown(e: MouseEvent, _: { x: number; y: number }) {
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
