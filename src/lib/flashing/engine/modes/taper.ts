import { G } from '@svgdotjs/svg.js';
import { BaseMode } from './base';
import { Node } from '@/lib/flashing/types/types';
import { graphStore } from '@/lib/flashing/store/store';
import { calculateLength, getChangeLengthDiff, getLongestLine } from '../helpers/geometry';
import { TaperModeComponentProps, TaperModeUI } from '@/components/canvas/taper';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';

export class TaperMode extends BaseMode {
  name = 'taper';
  sLine: { object: Node; isBSide: boolean } | null = null;
  historyStarted: boolean = false;
  path3DOffset: number = 0;
  yOffset: number = 0;
  private bSideNodes: Map<string, Node> = new Map();

  ComponentUI = TaperModeUI;
  setModeProps: Dispatch<SetStateAction<TaperModeComponentProps>> | undefined;

  annotaionObjects() {}
  nodeObject() {}

  constructor() {
    super();
  }

  onUIReady(setModeProps: Dispatch<SetStateAction<TaperModeComponentProps>>) {
    this.setModeProps = setModeProps;

    setModeProps((prev) => ({
      ...prev,
      onApplyValue: this.applyValue.bind(this),
      onSave: this.onSave.bind(this),
      onCancel: this.onCancel.bind(this),
      onDeselect: this.onDeselect.bind(this),
      onSelectNext: this.onSelectNext.bind(this),
      onSelectPrev: this.onSelectPrev.bind(this),
    }));
  }

  onDeselect() {
    this.sLine = null;
  }

  setCanNext(node: Node) {
    if (node.next_node_id !== undefined) {
      this.setModeProps?.((prev) => ({
        ...prev,
        canSelectNext: true,
      }));
    } else {
      this.setModeProps?.((prev) => ({
        ...prev,
        canSelectNext: false,
      }));
    }
  }

  setCanPrev(node: Node) {
    if (node.prev_node_id !== undefined) {
      this.setModeProps?.((prev) => ({
        ...prev,
        canSelectPrev: true,
      }));
    } else {
      this.setModeProps?.((prev) => ({
        ...prev,
        canSelectPrev: false,
      }));
    }
  }

  onSelectNext() {
    const state = graphStore.getState();
    const nodes = state.data?.nodes;

    if (!nodes) return;
    const { isBSide, object } = this.sLine ?? {};
    if (!object) return;

    const node = nodes.get(object.node_id);
    if (!node) return;
    const nextNode = nodes.get(node.next_node_id ?? '');

    if (!nextNode) return;

    if (nextNode.next_node_id) {
      const nextNextNode = nodes.get(nextNode?.next_node_id ?? '');
      if (!nextNextNode) return;
      this.onLinePointerDown(nextNode, nextNextNode, isBSide);
    } else {
      const firstNode = nodes.get(
        Array.from(nodes.values()).find((n) => n.prev_node_id === undefined)?.node_id ?? '',
      );
      const secNode = nodes.get(firstNode?.next_node_id ?? '');

      if (!firstNode || !secNode) return;

      this.onLinePointerDown(firstNode, secNode, !isBSide);
    }
  }

  onSelectPrev() {
    const state = graphStore.getState();
    const nodes = state.data?.nodes;

    if (!nodes) return;
    const { isBSide, object } = this.sLine ?? {};
    if (!object) return;

    const node = nodes.get(object.node_id);
    if (!node) return;
    const prevNode = nodes.get(node.prev_node_id ?? '');

    if (prevNode) {
      this.onLinePointerDown(prevNode, node, isBSide);
    } else {
      const lastNode = nodes.get(
        Array.from(nodes.values()).find((n) => n.next_node_id === undefined)?.node_id ?? '',
      );
      const lastSecNode = nodes.get(lastNode?.prev_node_id ?? '');

      if (!lastNode || !lastSecNode) return;

      this.onLinePointerDown(lastSecNode, lastNode, !isBSide);
    }
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

    const state = graphStore.getState();
    const nodes = state.data?.nodes;

    if (!s || typeof s !== 'number') return;
    if (!state || !nodes) return;

    if (!this.historyStarted) {
      state.beginHistory();
      this.historyStarted = true;

      this.setModeProps?.((prev) => ({ ...prev, canApply: true }));
    }

    if (!this.sLine?.object) return;

    if (!this.sLine.isBSide) {
      const node1 = this.sLine.object;
      const node2 = nodes?.get(node1?.next_node_id ?? '');
      if (!node2) return;

      const length = calculateLength(node1, node2);

      if (!node1.next_line_bside_length) {
        node1.next_line_bside_length = length;
      }

      if (node1.next_line_bside_length === s) {
        delete node1.next_line_bside_length;
      }

      const { dx, dy } = getChangeLengthDiff(node1, node2, s);

      let tNode: Node | null | undefined = node2;

      while (tNode) {
        tNode.x = tNode.x - dx;
        tNode.y = tNode.y - dy;

        tNode = nodes?.get(tNode.next_node_id ?? '');
      }
    } else {
      const node = nodes.get(this.sLine.object.node_id);
      const nextNode = nodes.get(node?.next_node_id ?? '');

      if (!node || !nextNode) return;

      if (calculateLength(node, nextNode) === s) {
        delete node.next_line_bside_length;
        return;
      }

      node.next_line_bside_length = s;
    }

    state.setData({ ...state.data, nodes });
  }

  private createBSideNodes(nodes: Map<string, Node> | undefined) {
    if (!nodes) return;
    nodes.forEach((node) => {
      this.bSideNodes.set(node.node_id, {
        node_id: node.node_id,
        x: node.x,
        y: node.y,
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

  initMode(nodes: Map<string, Node>) {
    this.createBSideNodes(nodes);
    this.path3DOffset = (getLongestLine(nodes)?.length ?? 100) * 1.2;
  }

  private onLinePointerDown(node: Node, to: Node, isBSide: boolean = false) {
    const state = graphStore.getState();
    const bSideSelected = this.sLine?.isBSide;

    if (this.sLine?.object.node_id === node.node_id && bSideSelected === isBSide) {
      this.sLine = null;

      this.setModeProps?.((prev) => ({
        ...prev,
        value: null,
        selected: false,
        drawerOpen: false,
        triggerCenterCon: false,
        canSelectNext: false,
        canSelectPrev: false,
      }));
    } else {
      let length = calculateLength(node, to);
      this.sLine = { object: node, isBSide: isBSide };

      if (isBSide && node.next_line_bside_length) {
        length = node.next_line_bside_length;
      }

      let canPrev = true;
      let canNext = true;

      if (!isBSide && !node.prev_node_id) {
        canPrev = false;
      }

      if (isBSide && !to.next_node_id) {
        canNext = false;
      }

      this.setModeProps?.((prev) => ({
        ...prev,
        value: length.toFixed(1),
        selected: true,
        drawerOpen: true,
        triggerCenterCon: true,
        canSelectNext: canNext,
        canSelectPrev: canPrev,
      }));
    }

    state.setTriggerRender(true);
  }

  private getOffsets() {
    const dx = this.path3DOffset;
    const dy = this.path3DOffset * 0.5;

    return { dx, dy };
  }

  private create3DFillers(extraLayer: G, node: Node, to: Node, bNode: Node, bTo: Node) {
    const { dx, dy } = this.getOffsets();
    this.createPath(
      extraLayer,
      [
        ['M', node.x, node.y],
        ['L', bNode.x + dx, bNode.y - dy],
        ['L', bTo.x + dx, bTo.y - dy],
        ['L', to.x, to.y],
        ['Z'],
      ],
      {
        width: this.getFlexStrokeWidth() / 2,
        color: '#50505017',
      },
    ).fill('#74747411');
  }

  private createAGroup(g: G, node: Node, to: Node) {
    const pathD = this.createLineORFoldPathData(node, to).data;
    const isTaperd = !!node.next_line_bside_length;

    const nLGroup = g.group().on('pointerdown', (e) => {
      e.stopPropagation();
      this.onLinePointerDown(node, to, false);
    });
    const shouldSelA = this.sLine?.object === node && !this.sLine.isBSide;

    this.createPath(nLGroup, pathD, {
      color: shouldSelA ? 'var(--primary)' : undefined,
      dasharray: shouldSelA ? `${Math.round(this.getFlexStrokeWidth() * 3)}` : undefined,
    });

    if (shouldSelA) {
      this.createPath(nLGroup, pathD, {
        color: 'var(--primary)',
        width: this.getFlexStrokeWidth() * 5,
      }).opacity(0.2);
    }

    this.createPath(nLGroup, pathD, {
      color: '#00000000',
      width: this.getFlexStrokeWidth() * 10,
    });

    this.createLengthAnno({
      node,
      to,
      g: nLGroup,
      bgColor: shouldSelA
        ? 'var(--anno-length-selected)'
        : isTaperd
          ? 'var(--anno-length-tapered)'
          : undefined,
      bgColorSec: shouldSelA
        ? 'var(--anno-length-selected)'
        : isTaperd
          ? 'var(--anno-length-tapered-muted)'
          : undefined,
      textPrefix: 'N-',
      showTapered: false,
    });
  }

  private createBGroup(g: G, node: Node, to: Node, isTaperd: boolean) {
    const { dx, dy } = this.getOffsets();

    const bPathD = this.createLineORFoldPathData(node, to).data;
    const shouldSelB = this.sLine?.object.node_id === node.node_id && this.sLine.isBSide;

    const fLGroup = g
      .group()
      .translate(dx, -dy)
      .front()
      .on('pointerdown', (e) => {
        e.stopPropagation();
        this.onLinePointerDown(node, to, true);
      });

    this.createPath(fLGroup, bPathD, {
      color: shouldSelB ? 'var(--primary)' : 'var(--base-drawing-secondary)',
      dasharray: shouldSelB ? `${Math.round(this.getFlexStrokeWidth() * 3)}` : undefined,
    });

    if (shouldSelB) {
      this.createPath(fLGroup, bPathD, {
        color: 'var(--primary)',
        width: this.getFlexStrokeWidth() * 5,
      }).opacity(0.2);
    }

    this.createPath(fLGroup, bPathD, {
      color: 'rgba(0, 0, 0, 0)',
      width: this.getFlexStrokeWidth() * 10,
    });

    this.createLengthAnno({
      node,
      to,
      g: fLGroup,
      bgColor: shouldSelB
        ? 'var(--anno-length-selected)'
        : isTaperd
          ? 'var(--anno-length-tapered)'
          : 'var(--anno-length-secondary)',
      bgColorSec: shouldSelB
        ? 'var(--anno-length-selected)'
        : isTaperd
          ? 'var(--anno-length-tapered-muted)'
          : 'var(--anno-length-secondary-muted)',
      textPrefix: 'F-',
      showTapered: false,
    });
  }

  edgeObject(g: G, node: Node, to: Node, _: () => void, extraLayer: G) {
    const bNode = this.bSideNodes.get(node.node_id)!,
      bTo = this.bSideNodes.get(to.node_id)!;

    this.create3DFillers(extraLayer, node, to, bNode, bTo);
    this.createAGroup(g, node, to);
    this.createBGroup(g, bNode, bTo, !!node.next_line_bside_length);
  }
}
