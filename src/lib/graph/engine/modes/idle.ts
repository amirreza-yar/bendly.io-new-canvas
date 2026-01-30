import { G } from "@svgdotjs/svg.js";
import { graphStore } from "../../store/store";
import { Node } from "../../types/types";
import { createCurshFoldD } from "../helpers/fold";
import { BaseMode } from "./base";

export class IdleMode extends BaseMode {
  name = "idle";
  isPanAllowed: boolean = true;

  constructor() {
    super()    
  }  

  nodeObject(g: G, node: Node) {
    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = node.next_node_id === undefined;
    const state = graphStore.getState();

    if (
      !(isFirstNode && state.data?.startCrushFold) &&
      !(isLastNode && state.data?.endCrushFold)
    ) {
      g.circle(Math.max(this.NODE_RADIUS * 0.3, Math.min(this.NODE_RADIUS / state.scale, this.NODE_RADIUS * 1.5))).center(0, 0).fill("#000");
    }
  }

  edgeObject(g: G, node: Node, to: Node) {
    const state = graphStore.getState();
    const D = createCurshFoldD(node, to, state, state.CRUSH_FOLD_OFFSET);

    if (D !== undefined) {
      g.path(D)
        .stroke({
          width: Math.max(this.LINE_STROKE_WIDTH * 0.3, Math.min(this.LINE_STROKE_WIDTH / state.scale, this.LINE_STROKE_WIDTH * 1.5)),
          color: "#000",
          linecap: "round",
        })
        .fill("#00000000");
    } else {
      g.line(node.x, node.y, to.x, to.y).stroke({
        width: Math.max(this.LINE_STROKE_WIDTH * 0.3, Math.min(this.LINE_STROKE_WIDTH / state.scale, this.LINE_STROKE_WIDTH * 1.5)),
        color: "#000",
        linecap: "round",
      });
    }
  }
}
