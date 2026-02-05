import { G, PathCommand } from '@svgdotjs/svg.js';
import { BaseMode } from './base';
import { Node } from '@/lib/flashing/types/types';
import { graphStore } from '@/lib/flashing/store/store';
import { createLengthAnno } from '@/lib/flashing/engine/helpers/annotation';
import { createCurshFoldD } from '@/lib/flashing/engine/helpers/fold';
import { calculateLength, getChangeLengthDiff, getLongestLine } from '../helpers/geometry';

export class TaperMode extends BaseMode {
  name = 'taper';
  sLine: { object: string; isBSide: boolean } | null = null;
  path3DOffset: number;
  yOffset: number = 0;
  private bSideNodes: Map<string, Node> = new Map();

  constructor() {
    super();

    const nodes = graphStore.getState().data?.nodes;

    this.path3DOffset = (getLongestLine(nodes)?.length ?? 100) * 1.2;
  }

  private createBSideNodes(nodes: Map<string, Node> | undefined) {
    if (!nodes) return;

    const { dx, dy } = this.getOffsets();

    nodes.forEach((node) => {
      this.bSideNodes.set(node.node_id, {
        node_id: node.node_id,
        x: node.x + dx,
        y: node.y - dy,
        next_node_id: node.next_node_id,
        prev_node_id: node.prev_node_id,
        next_line_bside_length: node.next_line_bside_length,
      });
    });

    this.bSideNodes.forEach((node) => {
      if (node.next_line_bside_length) {
        const baseNode = this.bSideNodes.get(node.node_id);
        let tNode: Node | undefined = this.bSideNodes.get(baseNode?.next_node_id ?? '');
        if (!baseNode || !tNode) return;

        const { dx, dy } = getChangeLengthDiff(baseNode, tNode, node.next_line_bside_length);

        while (tNode) {
          tNode.x = tNode.x - dx;
          tNode.y = tNode.y - dy;

          tNode = this.bSideNodes.get(tNode.next_node_id ?? '');
        }

        delete node.next_line_bside_length;
      }
    });
  }

  initMode(nodes: Map<string, Node>, g: G) {
    this.createBSideNodes(nodes);
    nodes.forEach((node) => {
      const to = nodes.get(node.next_node_id ?? '');
      if (!to) return;
      this.create3DFillers(g, node, to);
    });
  }

  annotaionObjects(nodes: Map<string, Node>, g: G) {
    if (!this.drawAnnotations || !this.bSideNodes) return;
    const scale = graphStore.getState().scale;

    const annoObjects: { object: G; node: Node; to: Node }[] = [];
    const bAnnoObjects: { object: G; node: Node; to: Node }[] = [];

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
      annoObjects.push({ object: anno, node: node, to: to });
    });

    this.bSideNodes.forEach((node) => {
      const to = this.bSideNodes.get(node.next_node_id ?? '');
      if (!to) return;
      const anno = createLengthAnno(
        node,
        to,
        g,
        scale,
        this.ANNO_TEXT_SIZE,
        this.ANNO_CHANGE_SCALE_OFFSET,
        '#2e2f57ff',
        '#64659cff',
      );
      bAnnoObjects.push({ object: anno, node: node, to: to });
    });

    annoObjects.forEach(({ object, node, to }) => {
      object.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onEdgePointerDown(node, to);
      });
    });

    bAnnoObjects.forEach(({ object, node, to }) => {
      object.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onEdgePointerDown(node, to, true);
      });
    });
  }

  private onEdgePointerDown(node: Node, to: Node, isBSide: boolean = false) {
    const state = graphStore.getState();

    if (this.sLine?.object === `${node.node_id}-${to.node_id}`) {
      this.sLine = null;
      state.setCanDoModeAction(false);
    } else {
      this.sLine = { object: `${node.node_id}-${to.node_id}`, isBSide: isBSide };
      state.setModeMeta(calculateLength(node, to));
      state.setCanDoModeAction(true);
    }

    state.setTriggerRender(true);
  }

  // eslint-disable-next-line
  nodeObject(g: G, node: Node) {}

  private getOffsets() {
    const dx = this.path3DOffset;
    const dy = this.path3DOffset * 0.5;

    return { dx, dy };
  }

  private create3DFillers(g: G, node: Node, to: Node) {
    const bNode = this.bSideNodes.get(node.node_id);
    const bTo = this.bSideNodes.get(to.node_id);

    if (!bNode || !bTo) return;

    this.createPath(
      g,
      [
        ['M', node.x, node.y],
        ['L', bNode.x, bNode.y],
        ['L', bTo.x, bTo.y],
        ['L', to.x, to.y],
        ['Z'],
      ],
      {
        width: this.getFlexStrokeWidth() / 2,
        color: '#50505017',
      },
    ).fill('#74747417');
  }

  private createEdgeBLine(g: G, node: Node, to: Node) {
    const bNode = this.bSideNodes.get(node.node_id);
    const bTo = this.bSideNodes.get(to.node_id);

    const isSLine = this.sLine?.object.split('-')[0] === node.node_id;
    const isSLineBLine = this.sLine?.isBSide;

    if (!bNode || !bTo) return;

    this.createLine(g, bNode, bTo, {
      color: isSLine && !isSLineBLine ? '#1619daff' : '#000',
    }).fill('#00000000');

    const hitbox = this.createLine(g, bNode, bTo, {
      width: this.getFlexStrokeWidth() * 10,
      color: isSLine && isSLineBLine ? '#163ada66' : '#da161628',
    });

    hitbox.on('pointerdown', () => {
      this.onEdgePointerDown(node, to, true);
    });
  }

  private createEdgeBFolded(g: G, node: Node, to: Node, D: PathCommand[]) {
    const { dx, dy } = this.getOffsets();
    const isSLine = this.sLine?.object.split('-')[0] === node.node_id;
    const isSLineBLine = this.sLine?.isBSide;

    this.createPath(g, D, {
      color: '#494949ff',
    })
      .fill('#00000000')
      .translate(dx, -dy);

    const hitbox = this.createPath(g, D, {
      width: this.getFlexStrokeWidth() * 10,
      color: isSLine && isSLineBLine ? '#163ada66' : '#da161628',
    }).translate(dx, -dy);

    hitbox.on('pointerdown', () => {
      this.onEdgePointerDown(node, to, true);
    });
  }

  private createEdgeALine(g: G, node: Node, to: Node) {
    const isSLine = this.sLine?.object.split('-')[0] === node.node_id;
    const isSLineBLine = this.sLine?.isBSide;

    this.createLine(g, node, to, { color: isSLine && !isSLineBLine ? '#da1616ff' : '#000' });

    const hitbox = this.createLine(g, node, to, {
      width: this.getFlexStrokeWidth() * 10,
      color: isSLine && !isSLineBLine ? '#163ada66' : '#da161628',
    });

    hitbox.on('pointerdown', () => {
      this.onEdgePointerDown(node, to);
    });
  }

  private createEdgeAFolded(g: G, node: Node, to: Node, D: PathCommand[]) {
    const isSLine = this.sLine?.object.split('-')[0] === node.node_id;
    const isSLineBLine = this.sLine?.isBSide;

    this.createPath(g, D, { color: isSLine && !isSLineBLine ? '#da1616ff' : '#000' });

    const hitbox = this.createPath(g, D, {
      width: this.getFlexStrokeWidth() * 10,
      color: isSLine && !isSLineBLine ? '#163ada66' : '#da161628',
    });

    hitbox.on('pointerdown', () => {
      this.onEdgePointerDown(node, to);
    });
  }

  edgeObject(g: G, node: Node, to: Node) {
    const state = graphStore.getState();
    const D = createCurshFoldD(node, to, state, this.CRUSH_FOLD_OFFSET);

    if (D !== undefined) {
      this.createEdgeAFolded(g, node, to, D);
      this.createEdgeBFolded(g, node, to, D);
    } else {
      this.createEdgeALine(g, node, to);
      this.createEdgeBLine(g, node, to);
    }
  }
}
