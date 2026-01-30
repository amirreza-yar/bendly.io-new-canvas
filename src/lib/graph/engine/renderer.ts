import { G, SVG, type Svg } from "@svgdotjs/svg.js";
import type { GraphData, Mode } from "../types/types";
import "@svgdotjs/svg.panzoom.js";

export class SvgRenderer {
  draw: Svg;
  nodesLayer: G;
  edgesLayer: G;
  annotationLayer: G;
  viewport: G;
  selectedNodeId: string | null = null;
  selectedEdgeId: string | null = null;

  constructor(el: HTMLElement) {
    this.draw = SVG().addTo(el).size("100%", "100%");
    this.edgesLayer = this.draw.group();
    this.nodesLayer = this.draw.group();
    this.annotationLayer = this.draw.group();
    this.viewport = this.draw.group();
  }

  setViewBox(x: number, y: number, width: number, height: number) {
    this.draw.viewbox(x, y, width, height);
  }

  render(data: GraphData, activeMode: Mode) {
    this.edgesLayer.clear();
    this.nodesLayer.clear();
    this.annotationLayer.clear()

    data.nodes?.forEach((node) => {
      if (!node.next_node_id) return;
      const g = this.edgesLayer.group();
      const to = data.nodes.get(node.next_node_id);
      if (!to) return;

      activeMode.edgeObject(g, node, to);
    });

    data.nodes?.forEach((node) => {
      const g = this.nodesLayer.group();
      g.translate(node.x, node.y);

      activeMode.nodeObject(g, node);
    });
  }
}
