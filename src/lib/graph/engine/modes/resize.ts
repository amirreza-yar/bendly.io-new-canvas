import { G } from "@svgdotjs/svg.js";
import { BaseMode } from "./base";
import { Node } from "../../types/types";
import { graphStore } from "../../store/store";
import {
  calculateAngle,
  calculateLength,
  getChangeAngleDiff,
  getChangeLengthDiff,
  getFinalChangeAngleRad,
} from "../helpers/geometry";
import { createCurshFoldD } from "../helpers/fold";

export class ResizeMode extends BaseMode {
  name = "resize";
  sLine: string | null = null;
  sNode: string | null = null;
  meta: string | number | null = null;

  constructor() {
    super();
  }

  nodeObject(g: G, node: Node) {
    const state = graphStore.getState();
    const nodes = state.data?.nodes;

    const pNode = nodes?.get(node.prev_node_id ?? "");
    const nNode = nodes?.get(node.next_node_id ?? "");

    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = node.next_node_id === undefined;

    if (
      !(isFirstNode && state.data?.startCrushFold) &&
      !(isLastNode && state.data?.endCrushFold)
    ) {
      g.circle(this.NODE_RADIUS).center(0, 0).fill("#000");
    }

    if (nNode && pNode) {
      g.circle(this.NODE_OVERLAY_RADIUS * 2)
        .center(0, 0)
        .fill(this.sNode === node.node_id ? "#163ada66" : "#2100da28")
        .stroke({
          width: this.sNode === node.node_id ? this.LINE_STROKE_WIDTH : 0,
          color: "#da1616ff",
          linecap: "round",
        })
        .front()
        .on("pointerdown", () => {
          console.log(
            calculateAngle(pNode.x, pNode.y, node.x, node.y, nNode.x, nNode.y)
          );

          if (this.sNode === node.node_id) {
            this.sNode = null;
            state.setCanDoModeAction(false);
          } else {
            this.sNode = node.node_id;
            console.log(
              calculateAngle(pNode.x, pNode.y, node.x, node.y, nNode.x, nNode.y)
            );

            state.setModeMeta(
              calculateAngle(pNode.x, pNode.y, node.x, node.y, nNode.x, nNode.y)
            );

            state.setCanDoModeAction(true);
          }
          this.sLine = null;

          state.setTriggerRender(true);
        });
    }
  }

  edgeObject(g: G, node: Node, to: Node): void {
    const state = graphStore.getState();
    const isSLine = this.sLine?.split("-")[0] === node.node_id;

    const D = createCurshFoldD(node, to, state, state.CRUSH_FOLD_OFFSET);

    if (D !== undefined) {
      g.path(D)
        .stroke({
          width: this.LINE_STROKE_WIDTH,
          color: isSLine ? "#da1616ff" : "#000",
          linecap: "round",
        })
        .fill("#00000000");

      g.path(D)
        .stroke({
          width: this.LINE_HIT_WIDTH,
          color: isSLine ? "#163ada66" : "#da161628",
          linecap: "round",
        })
        .fill("#00000000")
        .on("pointerdown", () => {
          if (isSLine) {
            this.sLine = null;
            state.setCanDoModeAction(false);
          } else {
            this.sLine = `${node.node_id}-${to.node_id}`;
            console.log(calculateLength(node, to));
            state.setModeMeta(calculateLength(node, to));
            state.setCanDoModeAction(true);
          }

          this.sNode = null;
          state.setTriggerRender(true);
        });
    } else {
      g.line(node.x, node.y, to.x, to.y)
        .stroke({
          width: this.LINE_STROKE_WIDTH,
          color: isSLine ? "#da1616ff" : "#000",
          linecap: "round",
        })
        .data("lineId", node.node_id);

      g.line(node.x, node.y, to.x, to.y)
        .stroke({
          width: this.LINE_HIT_WIDTH,
          color: isSLine ? "#163ada66" : "#da161628",
          linecap: "round",
        })
        .on("pointerdown", () => {
          if (isSLine) {
            this.sLine = null;
            state.setCanDoModeAction(false);
          } else {
            this.sLine = `${node.node_id}-${to.node_id}`;
            console.log(calculateLength(node, to));
            state.setModeMeta(calculateLength(node, to));
            state.setCanDoModeAction(true);
          }

          this.sNode = null;
          state.setTriggerRender(true);
        });
    }
  }

  onAction(s: number) {
    const state = graphStore.getState();
    const nodes = state.data?.nodes;

    if (!state || !nodes) return;
    if (!s || s < 1) return;

    state.beginHistory();

    if (this.sLine && !this.sNode) {
      const sl = this.sLine.split("-");

      const node1 = nodes?.get(sl[0] ?? "");
      const node2 = nodes?.get(node1?.next_node_id ?? "");
      if (!node1 || !node2) return;

      const { dx, dy } = getChangeLengthDiff(node1, node2, s);

      let tNode: Node | null | undefined = node2;

      while (tNode) {
        tNode.x = tNode.x - dx;
        tNode.y = tNode.y - dy;

        tNode = nodes?.get(tNode.next_node_id ?? "");
      }
    } else if (!this.sLine && this.sNode) {
      const baseNode = nodes.get(this.sNode);
      const pNode = nodes?.get(baseNode?.prev_node_id ?? "");
      const nNode = nodes?.get(baseNode?.next_node_id ?? "");
      if (!baseNode || !pNode || !nNode) return;

      const finalradAngle = getFinalChangeAngleRad(pNode, baseNode, nNode, s);

      let tNode: Node | undefined = nNode;

      while (tNode) {
        const { rotatedDX, rotatedDY } = getChangeAngleDiff(
          baseNode,
          tNode,
          finalradAngle
        );

        tNode.x = baseNode.x + rotatedDX;
        tNode.y = baseNode.y + rotatedDY;

        tNode = nodes.get(tNode.next_node_id ?? "");
      }
    }

    state.setData({ ...state.data, nodes });
    state.commitHistory();
  }

  // eslint-disable-next-line
  onPointerDown(e: MouseEvent, _: { x: number; y: number }) {
    const state = graphStore.getState();

    // @ts-expect-error target have instance
    if (e.target?.instance.type === "svg") {
      this.sLine = null;
      this.sNode = null;
      state.setModeMeta(null);
      state.setTriggerRender(true);
      state.setCanDoModeAction(false);
    }
  }
}
