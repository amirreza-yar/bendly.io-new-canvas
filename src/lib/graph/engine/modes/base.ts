import { G } from "@svgdotjs/svg.js";
import { graphStore } from "../../store/store";
import { Mode, Node } from "../../types/types";

export class BaseMode implements Mode {
  name: string = "draw";
  isPanAllowed: boolean = true;
  NODE_RADIUS: number = 10;
  NODE_HIT_WIDTH: number = 40;
  NODE_OVERLAY_RADIUS: number = 25;
  LINE_STROKE_WIDTH: number = 4;
  LINE_HIT_WIDTH: number = 30;

  constructor() {
    const state = graphStore.getState()
    this.LINE_STROKE_WIDTH = state.LINE_STROKE_WIDTH;
    this.NODE_RADIUS = state.NODE_RADIUS;
    this.NODE_HIT_WIDTH = state.NODE_HIT_WIDTH;
    this.NODE_OVERLAY_RADIUS = state.NODE_OVERLAY_RADIUS;
    this.LINE_HIT_WIDTH = state.LINE_HIT_WIDTH;
  }

  // eslint-disable-next-line
  nodeObject(g: G, node: Node) {
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
