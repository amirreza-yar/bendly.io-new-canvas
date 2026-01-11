import { G } from "@svgdotjs/svg.js";
import { graphStore } from "../../store/store";
import { Mode, Node } from "../../types/types";

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

  // eslint-disable-next-line
  nodeObject(g: G, _: Node) {
    g.circle(this.NODE_RADIUS).center(0, 0).fill("#000");
  }

  edgeObject(g: G, node: Node, to: Node) {
    g.line(node.x, node.y, to.x, to.y).stroke({
      width: this.LINE_STROKE_WIDTH,
      color: "#000",
      linecap: "round",
    });
  }
}
