import { G } from '@svgdotjs/svg.js';
import { graphStore } from '@/lib/flashing/store/store';
import { Node } from '@/lib/flashing/types/types';
import { createCurshFoldD } from '@/lib/flashing/engine/helpers/fold';
import { BaseMode } from './base';

export class IdleMode extends BaseMode {
  name = 'idle';
  title = 'Idle';

  constructor() {
    super();
  }

  nodeObject(g: G, node: Node) {
    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = node.next_node_id === undefined;
    const state = graphStore.getState();

    if (!(isFirstNode && state.data?.startCrushFold) && !(isLastNode && state.data?.endCrushFold)) {
      this.createNode(g, node);
    }
  }

  edgeObject(g: G, node: Node, to: Node) {
    const state = graphStore.getState();
    const D = createCurshFoldD(node, to, this.getCrushFoldOffset());

    if (D !== undefined) {
      this.createPath(g, D);
    } else {
      this.createLine(g, node, to);
    }
  }
}
