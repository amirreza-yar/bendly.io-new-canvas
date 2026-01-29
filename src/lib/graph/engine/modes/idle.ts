import { G } from "@svgdotjs/svg.js";
import { graphStore } from "../../store/store";
import { Mode, Node } from "../../types/types";
import { calculateLineAngle } from "../helpers/geometry";
import { generateCrushFoldState, createCurshFoldD } from "../helpers/fold";

export class IdleMode implements Mode {
  name = "idle";
  isPanAllowed: boolean = true;
  NODE_RADIUS: number = 10;
  LINE_STROKE_WIDTH: number = 4;

  constructor() {
    const state = graphStore.getState();
    this.LINE_STROKE_WIDTH = state.LINE_STROKE_WIDTH;
    this.NODE_RADIUS = state.NODE_RADIUS;
  }

  nodeObject(g: G, node: Node) {
    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = node.next_node_id === undefined;
    const state = graphStore.getState();

    if (
      !(isFirstNode && state.data?.startCrushFold) &&
      !(isLastNode && state.data?.endCrushFold)
    ) {
      g.circle(this.NODE_RADIUS).center(0, 0).fill("#000");
    }
  }

  edgeObject(g: G, node: Node, to: Node) {
    const state = graphStore.getState();
    const D = createCurshFoldD(node, to, state, state.CRUSH_FOLD_OFFSET);

    if (D !== undefined) {
      g.path(D)
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
