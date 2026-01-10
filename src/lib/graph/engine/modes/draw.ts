import { graphStore } from "@/lib/graph/store/store";
import { Node } from "@/lib/graph/types/types";
import { shortId } from "../helpers";
import { G } from "@svgdotjs/svg.js";
import { BaseMode } from "./base";

export class DrawMode extends BaseMode {
  name = "draw";
  isPanAllowed: boolean = false;

  constructor() {
    super()
  }

  nodeObject(g: G, node: Node) {
    const state = graphStore.getState();
    const drawDirection = state.drawDirection;

    g.circle(this.NODE_RADIUS)
      .center(0, 0)
      .fill(
        (drawDirection === true && node.next_node_id === undefined) ||
          (drawDirection === false && node.prev_node_id === undefined)
          ? "#4400ffff"
          : "#000"
      );

    if (
      (drawDirection === true && node.next_node_id === undefined) ||
      (drawDirection === false && node.prev_node_id === undefined)
    ) {
      g.circle(this.NODE_OVERLAY_RADIUS)
        .center(0, 0)
        .fill("#4400ff42")
        .stroke({
          width: this.LINE_STROKE_WIDTH - 1,
          color: "#4400ff",
          linecap: "round",
        })
        .data("nodeId", `${node.node_id}`);
    } else if (
      (drawDirection === false && node.next_node_id === undefined) ||
      (drawDirection === true && node.prev_node_id === undefined)
    ) {
      g.circle(this.NODE_HIT_WIDTH)
        .center(0, 0)
        .fill("#df070777")
        .data("nodeId", `${node.node_id}`)
        .on("mousedown", () => {
          if (node.next_node_id === undefined) {
            state.setDrawDirection(true);
          } else if (node.prev_node_id === undefined) {
            state.setDrawDirection(false);
          }
        });
    }
  }

  edgeObject(g: G, node: Node, to: Node) {
    g.line(node.x, node.y, to.x, to.y).stroke({
      width: this.LINE_STROKE_WIDTH,
      color: "#444",
      linecap: "round",
    });

    // g.line(node.x, node.y, to.x, to.y)
    //   .stroke({ width: this.LINE_HIT_WIDTH, color: "#f0f", opacity: 50 })
    //   .attr({ "pointer-events": "stroke" }) // ensure stroke receives events
    //   .data("edgeId", `${node.node_id}-${to.node_id}`)

    // visible.front();
  }

  onPointerDown(e: MouseEvent, world: { x: number; y: number }) {
    const state = graphStore.getState();
    if (!state.data) return;

    // @ts-expect-error instance exists on event traget
    if (e.target?.instance.type !== "svg") return;

    state.beginHistory();
    const nodes = state.data.nodes;
    const id = shortId();

    const firstNode = nodes.get(
      nodes?.values()?.find((n) => n.prev_node_id === undefined)?.node_id ?? ""
    );

    const lastNode = nodes.get(
      nodes?.values()?.find((n) => n.next_node_id === undefined)?.node_id ?? ""
    );

    if (state.drawDirection) {
      if (lastNode) {
        lastNode.next_node_id = id;
      }

      nodes.set(id, {
        node_id: id,
        x: world.x,
        y: world.y,
        next_node_id: undefined,
        prev_node_id: lastNode?.node_id,
      });
    } else {
      if (firstNode) {
        firstNode.prev_node_id = id;
      }

      nodes.set(id, {
        node_id: id,
        x: world.x,
        y: world.y,
        next_node_id: firstNode?.node_id,
        prev_node_id: undefined,
      });
    }

    state.setData({ ...state.data, nodes });
    state.commitHistory();
  }
}
