import { graphStore } from "../../store/store";
import { Mode } from "../../types/types";

export class MoveMode implements Mode {
  name = "move";
  selectedNode: string | null = null;
  moved = false;
  offsetX: number | null = null;
  offsetY: number | null = null;

  onPointerDown(_: PointerEvent, world: { x: number; y: number }) {
    const state = graphStore.getState();
    const node = state.data?.nodes.find(
      (n) => Math.hypot(n.x - world.x, n.y - world.y) < 30
    );
    if (node) {
      this.selectedNode = node.node_id;
      this.moved = false;

      this.offsetX = world.x - node.x;
      this.offsetY = world.y - node.y;

      state.beginHistory();
    }
  }

  onPointerMove(_: PointerEvent, world: { x: number; y: number }) {
    if (!this.selectedNode || !this.offsetX || !this.offsetY) return;

    const state = graphStore.getState();
    if (!state.data) return;

    const nodes = state.data.nodes.map((n) =>
      n.node_id === this.selectedNode
        ? {
            ...n,
            x: world.x - (this.offsetX ?? 0),
            y: world.y - (this.offsetY ?? 0),
          }
        : n
    );

    this.moved = true;
    state.setData({ ...state.data, nodes });
  }

  onPointerUp() {
    if (this.selectedNode && this.moved) {
      graphStore.getState().commitHistory();
      this.offsetX = null;
      this.offsetY = null;
    } else {
      graphStore.getState().rollbackHistory();
    }

    this.selectedNode = null;
    this.moved = false;
  }
}
