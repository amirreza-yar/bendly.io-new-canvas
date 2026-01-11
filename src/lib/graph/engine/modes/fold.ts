import { G } from "@svgdotjs/svg.js";
import { Node } from "../../types/types";
import { BaseMode } from "./base";
import { graphStore } from "../../store/store";
import { calculateLineAngle } from "../geometry";

export class FoldMode extends BaseMode {
  name = "fold";
  CRUSH_FOLD_OFFSET: number = 10;
  crushFoldDir: boolean = false;
  startCrushFold: boolean = false;
  endCrushFold: boolean = false;

  constructor() {
    super();
    const state = graphStore.getState();

    this.CRUSH_FOLD_OFFSET = state.CRUSH_FOLD_OFFSET;
    this.crushFoldDir = state.crushFoldDir;
    this.startCrushFold = state.startCrushFold;
    this.endCrushFold = state.endCrushFold;
  }

  nodeObject(g: G, node: Node) {
    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = node.next_node_id === undefined;

    if (!(isFirstNode && this.startCrushFold) && !(isLastNode && this.endCrushFold)) {
      g.circle(this.NODE_RADIUS).center(0, 0).fill("#000");
    }
  }

  edgeObject(g: G, node: Node, to: Node) {
    const state = graphStore.getState();
    const nodes = state.data?.nodes;
    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = to.next_node_id === undefined;

    if (isFirstNode && this.startCrushFold) {
      const node1 = node;
      const node2 = nodes?.get(node.next_node_id ?? "");

      if (!node2) return;

      const angle = calculateLineAngle(node1, node2);

      const A1 = {
        y: node.y - this.CRUSH_FOLD_OFFSET * Math.sin((angle * Math.PI) / 180),
        x: node.x - this.CRUSH_FOLD_OFFSET * Math.cos((angle * Math.PI) / 180),
      };

      const A2 = {
        y:
          A1.y +
          this.CRUSH_FOLD_OFFSET *
            Math.sin(
              ((angle + 90 * (this.crushFoldDir ? 1 : -1)) * Math.PI) / 180
            ),
        x:
          A1.x +
          this.CRUSH_FOLD_OFFSET *
            Math.cos(
              ((angle + 90 * (this.crushFoldDir ? 1 : -1)) * Math.PI) / 180
            ),
      };

      const A3 = {
        y:
          node.y +
          this.CRUSH_FOLD_OFFSET *
            Math.sin(
              ((angle + 90 * (this.crushFoldDir ? 1 : -1)) * Math.PI) / 180
            ),
        x:
          node.x +
          this.CRUSH_FOLD_OFFSET *
            Math.cos(
              ((angle + 90 * (this.crushFoldDir ? 1 : -1)) * Math.PI) / 180
            ),
      };

      const A4 = {
        y: A3.y + this.CRUSH_FOLD_OFFSET * Math.sin((angle * Math.PI) / 180),
        x: A3.x + this.CRUSH_FOLD_OFFSET * Math.cos((angle * Math.PI) / 180),
      };

      g.path([
        ["M", to.x, to.y],
        ["L", node.x, node.y],
        ["C", A1.x, A1.y, A2.x, A2.y, A3.x, A3.y],
        ["L", A4.x, A4.y],
      ])
        .stroke({
          width: this.LINE_STROKE_WIDTH,
          color: "#000",
          linecap: "round",
        })
        .fill("#00000000");

    } else if (isLastNode && this.endCrushFold) {
      const node1 = node;
      const node2 = nodes?.get(node.next_node_id ?? "");

      if (!node2) return;

      const angle = calculateLineAngle(node2, node1);

      const A1 = {
        y: to.y - this.CRUSH_FOLD_OFFSET * Math.sin((angle * Math.PI) / 180),
        x: to.x - this.CRUSH_FOLD_OFFSET * Math.cos((angle * Math.PI) / 180),
      };

      const A2 = {
        y:
          A1.y +
          this.CRUSH_FOLD_OFFSET *
            Math.sin(
              ((angle + 90 * (this.crushFoldDir ? -1 : 1)) * Math.PI) / 180
            ),
        x:
          A1.x +
          this.CRUSH_FOLD_OFFSET *
            Math.cos(
              ((angle + 90 * (this.crushFoldDir ? -1 : 1)) * Math.PI) / 180
            ),
      };

      const A3 = {
        y:
          to.y +
          this.CRUSH_FOLD_OFFSET *
            Math.sin(
              ((angle + 90 * (this.crushFoldDir ? -1 : 1)) * Math.PI) / 180
            ),
        x:
          to.x +
          this.CRUSH_FOLD_OFFSET *
            Math.cos(
              ((angle + 90 * (this.crushFoldDir ? -1 : 1)) * Math.PI) / 180
            ),
      };

      const A4 = {
        y: A3.y + this.CRUSH_FOLD_OFFSET * Math.sin((angle * Math.PI) / 180),
        x: A3.x + this.CRUSH_FOLD_OFFSET * Math.cos((angle * Math.PI) / 180),
      };

      g.path([
        ["M", node.x, node.y],
        ["L", to.x, to.y],
        ["C", A1.x, A1.y, A2.x, A2.y, A3.x, A3.y],
        ["L", A4.x, A4.y],
      ])
        .stroke({
          width: this.LINE_STROKE_WIDTH,
          color: "#000",
          linecap: "round",
        })
        .fill("#00000000");
    } else {
      g.line(node.x, node.y, to.x, to.y).stroke({
        width: this.LINE_STROKE_WIDTH,
        color: "#000",
        linecap: "round",
      });
    }
  }
}
