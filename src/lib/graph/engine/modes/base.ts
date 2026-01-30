import { G } from "@svgdotjs/svg.js";
import { graphStore } from "../../store/store";
import { Mode, Node } from "../../types/types";
import { createAngleAnnotations, createLengthAnnotations } from "../helpers/annotation";

export class BaseMode implements Mode {
  name: string = "draw";
  isPanAllowed: boolean = true;
  drawAnnotations: boolean = true;
  NODE_RADIUS: number = 10;
  NODE_HIT_WIDTH: number = 40;
  NODE_OVERLAY_RADIUS: number = 25;
  LINE_STROKE_WIDTH: number = 4;
  LINE_HIT_WIDTH: number = 30;
  ANNO_TEXT_SIZE: number = 14;
  ANNO_CHANGE_SCALE_OFFSET: number = 0.7;
  scale: number = 1;

  constructor() {
    const state = graphStore.getState()
    this.LINE_STROKE_WIDTH = state.LINE_STROKE_WIDTH;
    this.NODE_RADIUS = state.NODE_RADIUS;
    this.NODE_HIT_WIDTH = state.NODE_HIT_WIDTH;
    this.NODE_OVERLAY_RADIUS = state.NODE_OVERLAY_RADIUS;
    this.LINE_HIT_WIDTH = state.LINE_HIT_WIDTH;
    this.ANNO_TEXT_SIZE = state.ANNO_TEXT_SIZE
    this.scale = state.scale;
    this.ANNO_CHANGE_SCALE_OFFSET = graphStore.getState().ANNO_CHANGE_SCALE_OFFSET
  }

  annotaionObjects(nodes: Map<string, Node>, g: G) {
    if (!this.drawAnnotations) return
    const scale = graphStore.getState().scale
    createLengthAnnotations(nodes, g, scale, this.ANNO_TEXT_SIZE, this.ANNO_CHANGE_SCALE_OFFSET)
    createAngleAnnotations(nodes, g, scale, this.ANNO_TEXT_SIZE, this.ANNO_CHANGE_SCALE_OFFSET)
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
