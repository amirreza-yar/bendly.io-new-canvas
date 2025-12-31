import { graphStore } from "../../store/store";
import { Mode } from "../../types/types";

export class DrawMode implements Mode {
  name = "draw";

  onPointerDown(_: PointerEvent, world: { x: number; y: number }) {
    const state = graphStore.getState();
    if (!state.data) return;

    state.beginHistory();
    const nodes = [...state.data.nodes];
    const id = crypto.randomUUID();
    
    if (nodes.length > 0) {
      nodes[nodes.length - 1].next_node_id = id;
    }
    
    nodes.push({
      node_id: id,
      x: world.x,
      y: world.y,
      next_node_id: undefined,
    });
    
    state.setData({ ...state.data, nodes });
    state.commitHistory();
  }
}
