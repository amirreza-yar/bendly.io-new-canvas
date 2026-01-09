import { G } from "@svgdotjs/svg.js";
import { BaseMode } from "./base";
import { Node } from "../../types/types";

export class RemoveMode extends BaseMode {
  name = "remove";
  isPanAllowed: boolean = true;
  selectedLines: string[] = [];

  constructor() {
    super();
  }

  nodeObject(g: G, node: Node) {
    g.circle(0).center(0, 0).fill("#000").front();
  }

  edgeObject(g: G, node: Node, to: Node) {
    if (this.selectedLines?.includes(`${node.node_id}-${to.node_id}`)) {
      g.line(node.x, node.y, to.x, to.y)
        .stroke({
          width: this.LINE_STROKE_WIDTH,
          color: "#da1616ff",
          linecap: "round",
          dasharray: "10",
        })
        .data("lineId", `${node.node_id}-${to.node_id}`);

      g.line(node.x, node.y, to.x, to.y)
        .stroke({
          width: this.LINE_HIT_WIDTH,
          color: "#163ada55",
          linecap: "round",
        })
        .on("pointerdown", () => {
          console.log("selected line unselected");
          this.selectedLines = this.selectedLines?.filter(
            (line) => line !== `${node.node_id}-${to.node_id}`
          );
          this.state.setTriggerRender(true);

          this.state.setCanDoModeAction(this.selectedLines.length > 0);
        });
    } else {
      g.line(node.x, node.y, to.x, to.y)
        .stroke({
          width: this.LINE_STROKE_WIDTH,
          color: "#000",
          linecap: "round",
        })
        .data("lineId", `${node.node_id}-${to.node_id}`);

      g.line(node.x, node.y, to.x, to.y)
        .stroke({
          width: this.LINE_HIT_WIDTH,
          color: "#da161655",
          linecap: "round",
        })
        .on("pointerdown", () => {
          console.log("uselected line selected");
          this.selectedLines.push(`${node.node_id}-${to.node_id}`);

          this.state.setTriggerRender(true);
          this.state.setCanDoModeAction(true);
        });
    }
  }

  onAction() {
    const nodes = this.state.data?.nodes;

    this.state.beginHistory();

    console.log("remove action");

    for (const sl of this.selectedLines) {
      const slNodes = sl.split("-");

      console.log(nodes?.values(), slNodes)

      const node1 = nodes?.get(slNodes[0]);
      const node2 = nodes?.get(slNodes[1]);
      const offsetX = node2?.x - node1?.x;
      const offsetY = node2?.y - node1?.y;

      let tragetNode = nodes?.get(node2?.next_node_id) ?? undefined;
      if (tragetNode && node1 && node2) {
        tragetNode.x = tragetNode.x - offsetX;
        tragetNode.y = tragetNode.y - offsetY;

        node1.next_node_id = tragetNode.node_id;
        tragetNode.prev_node_id = node1?.node_id;
      }

      tragetNode = nodes?.get(tragetNode?.next_node_id) ?? undefined;
      while (tragetNode) {
        tragetNode.x = tragetNode.x - offsetX;
        tragetNode.y = tragetNode.y - offsetY;

        tragetNode = nodes?.get(tragetNode?.next_node_id) ?? undefined;
      }

      nodes?.delete(node2?.node_id);
    }
    this.state.setData({ nodes });
    this.state.commitHistory();
  }
}
