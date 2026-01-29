import { G } from "@svgdotjs/svg.js";
import { BaseMode } from "./base";
import { Node } from "../../types/types";
import { graphStore } from "../../store/store";

export class RemoveMode extends BaseMode {
  name = "remove";
  isPanAllowed: boolean = true;
  selectedLines: string[] = [];

  constructor() {
    super();
  }

  // eslint-disable-next-line
  nodeObject(g: G, node: Node) {
    g.circle(0).center(0, 0).fill("#000").front();
  }

  edgeObject(g: G, node: Node, to: Node) {
    const state = graphStore.getState();

    const isLineSelected = this.selectedLines?.includes(
      `${node.node_id}-${to.node_id}`
    );

    g.line(node.x, node.y, to.x, to.y)
      .stroke({
        width: this.LINE_STROKE_WIDTH,
        color: isLineSelected ? "#da1616ff" : "#000",
        linecap: "round",
        dasharray: isLineSelected ? "10" : "1",
      })
      .data("lineId", node.node_id);

    g.line(node.x, node.y, to.x, to.y)
      .stroke({
        width: this.LINE_HIT_WIDTH,
        color: isLineSelected ? "#163ada55" : "#da161655",
        linecap: "round",
      })
      .on("pointerdown", () => {
        if (isLineSelected) {
          this.selectedLines = this.selectedLines?.filter(
            (line) => line !== `${node.node_id}-${to.node_id}`
          );
        } else {
          this.selectedLines.push(`${node.node_id}-${to.node_id}`);
        }

        state.setTriggerRender(true);

        state.setCanDoModeAction(this.selectedLines.length > 0);
      });
  }

  onAction() {
    const state = graphStore.getState();
    const nodes = state.data?.nodes;

    if (!state || !nodes) return;

    state.beginHistory();

    for (const sl of this.selectedLines) {
      const [node1, node2] = sl.split("-");

      const baseN1 = nodes?.get(node1);
      const baseN2 = nodes?.get(node2);

      if (baseN1) {
        const baseNode = baseN1;
        if (!baseNode) continue;

        const nodeToRemove = nodes?.get(baseNode.next_node_id ?? "");
        if (!nodeToRemove) continue;

        const offsetX = nodeToRemove?.x - baseNode?.x;
        const offsetY = nodeToRemove?.y - baseNode?.y;

        let tmpNode = nodes?.get(nodeToRemove.next_node_id ?? "");

        nodes?.delete(nodeToRemove.node_id);

        baseNode.next_node_id = tmpNode?.node_id;

        if (!tmpNode) continue;
        tmpNode.prev_node_id = baseNode.node_id;

        while (tmpNode) {
          tmpNode.x = tmpNode.x - offsetX;
          tmpNode.y = tmpNode.y - offsetY;

          tmpNode = nodes?.get(tmpNode.next_node_id ?? "");
        }
      } else if (baseN2) {
        const baseNode = nodes?.get(baseN2.prev_node_id ?? "");
        if (!baseNode) continue;

        const nodeToRemove = baseN2;
        if (!nodeToRemove) continue;

        const offsetX = nodeToRemove?.x - baseNode?.x;
        const offsetY = nodeToRemove?.y - baseNode?.y;

        let tmpNode = nodes?.get(nodeToRemove.next_node_id ?? "");

        nodes?.delete(nodeToRemove.node_id);

        baseNode.next_node_id = tmpNode?.node_id;

        if (!tmpNode) continue;
        tmpNode.prev_node_id = baseNode.node_id;

        while (tmpNode) {
          tmpNode.x = tmpNode.x - offsetX;
          tmpNode.y = tmpNode.y - offsetY;

          tmpNode = nodes?.get(tmpNode.next_node_id ?? "");
        }
      }
    }

    this.selectedLines = [];

    state.setData({ ...state.data, nodes });
    state.commitHistory();
  }
}
