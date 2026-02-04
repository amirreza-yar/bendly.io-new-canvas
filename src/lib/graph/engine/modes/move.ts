import { G } from '@svgdotjs/svg.js';
import { graphStore } from '@/lib/graph/store/store';
import { Node } from '@/lib/graph/types/types';
import { BaseMode } from './base';

export class MoveMode extends BaseMode {
  name = 'move';
  isPanAllowed = true;
  selectedNode: Node | null = null;

  moved: boolean = false;
  offsetX: number | null = null;
  offsetY: number | null = null;

  constructor() {
    super();
  }

  nodeObject(g: G, node: Node) {
    g.circle(this.NODE_RADIUS).center(0, 0).fill('#1ca010');

    g.circle(this.NODE_OVERLAY_RADIUS)
      .center(0, 0)
      .fill('#1ca01044')
      .stroke({
        width: this.LINE_STROKE_WIDTH - 1,
        color: '#1ca010',
        linecap: 'round',
        dasharray: '5',
      });

    g.circle(this.NODE_HIT_WIDTH)
      .center(0, 0)
      .fill('#ff00002f')
      .on('pointerdown', () => {
        this.selectedNode = node;
        this.moved = false;
        this.isPanAllowed = false;
      });
  }

  edgeObject(g: G, node: Node, to: Node) {
    g.line(node.x, node.y, to.x, to.y).stroke({
      width: this.LINE_STROKE_WIDTH,
      color: '#000',
      linecap: 'round',
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

    this.selectedNode.x = world.x - (this.offsetX ?? 0);
    this.selectedNode.y = world.y - (this.offsetY ?? 0);

    state.setData({ ...graphStore.getState().data! });

    this.moved = true;
    state.setData({ ...state.data });
  }

  onPointerUp() {
    if (this.selectedNode && this.moved) {
      graphStore.getState().commitHistory();
      this.offsetX = null;
      this.offsetY = null;
    } else {
      // graphStore.getState().rollbackHistory();
    }

    this.selectedNode = null;
    this.moved = false;
    this.isPanAllowed = true;
  }
}
