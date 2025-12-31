// engine/renderer.ts
import { G, SVG, type Svg } from "@svgdotjs/svg.js";
import type { GraphData } from "../types/types";
import "@svgdotjs/svg.panzoom.js";

export class SvgRenderer {
  draw: Svg;
  nodesLayer: G;
  edgesLayer: G;
  viewport: G;
  selectedNodeId: string | null = null;
  selectedEdgeId: string | null = null;

  constructor(el: HTMLElement) {
    this.draw = SVG().addTo(el).size("100%", "100%");
    this.edgesLayer = this.draw.group();
    this.nodesLayer = this.draw.group();
    this.viewport = this.draw.group();

    // this.draw.viewbox(0, 0, 1000, 1000);
    
  }

  setViewBox(x: number, y: number, width: number, height: number) {
    this.draw.viewbox(x, y, width, height);
  }

  render(data: GraphData) {
    this.edgesLayer.clear();
    this.nodesLayer.clear();

    const map = new Map(data.nodes.map((n) => [n.node_id, n]));

    // edges
    for (const node of data.nodes) {
      if (!node.next_node_id) continue;
      const to = map.get(node.next_node_id);
      if (!to) continue;

      // visible line
      const visible = this.edgesLayer
        .line(node.x, node.y, to.x, to.y)
        .stroke({ width: 2, color: "#444", linecap: "round", dasharray: "10" });

      // hit area (invisible but wide)
      const HIT_WIDTH = 18; // adjust for easier clicking/touch
      this.edgesLayer
        .line(node.x, node.y, to.x, to.y)
        .stroke({ width: HIT_WIDTH, color: "#f0f", opacity: 50 }) // invisible
        .attr({ "pointer-events": "stroke" }) // ensure stroke receives events
        .data("edgeId", `${node.node_id}-${to.node_id}`);
      // .on("click", () => {
      //   this.selectedEdgeId = `${node.node_id}-${to.node_id}`;
      //   // update visible stroke to indicate selection
      //   visible.stroke({ color: "#f00" });
      // });

      // ensure visible line stays on top
      visible.front();
    }

    // nodes
    for (const node of data.nodes) {
      const g = this.nodesLayer.group();
      g.translate(node.x, node.y);

      g.circle(40)
        .center(0, 0)
        .fill(this.selectedNodeId === node.node_id ? "#f0f" : "#fff")
        .stroke({ width: 2, color: "#222" });

      //   circle.click(() => {
      //     this.selectedNodeId = node.node_id;
      //     this.render(data); // re-render to update selection
      //   });

      //   g.text(node.node_id).font({ size: 12 }).center(0, 0);
    }
  }
}
