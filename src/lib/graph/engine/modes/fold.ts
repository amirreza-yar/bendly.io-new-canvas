import { G } from "@svgdotjs/svg.js";
import { Node } from "../../types/types";
import { BaseMode } from "./base";
import { graphStore } from "../../store/store";
import { createCurshFoldD } from "../helpers/fold";

export class FoldMode extends BaseMode {
  name = "fold";

  constructor() {
    super();
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

  onAction(s: {
    startCrushFold?: boolean;
    endCrushFold?: boolean;
    crushFoldDir?: boolean;
  }) {
    const state = graphStore.getState();

    state.beginHistory();

    if (s.startCrushFold !== undefined) {
      state.setData({ ...state.data, startCrushFold: s.startCrushFold });
    }

    if (s.endCrushFold !== undefined) {
      state.setData({ ...state.data, endCrushFold: s.endCrushFold });
    }

    if (s.crushFoldDir !== undefined) {
      state.setData({ ...state.data, crushFoldDir: s.crushFoldDir });
    }

    state.commitHistory();
  }
}
