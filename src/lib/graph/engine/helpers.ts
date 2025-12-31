
import { GraphData, Point } from "../types/types";
import { segmentsIntersect } from "./geometry";

export function getEdges(data: GraphData) {
  const map = new Map(data.nodes.map((n) => [n.node_id, n]));
  const edges: { a: Point; b: Point; aId: string; bId: string }[] = [];

  for (const n of data.nodes) {
    if (!n.next_node_id) continue;
    const to = map.get(n.next_node_id);
    if (!to) continue;

    edges.push({
      a: { x: n.x, y: n.y },
      b: { x: to.x, y: to.y },
      aId: n.node_id,
      bId: to.node_id,
    });
  }

  return edges;
}

export function hasEdgeCrossing(data: GraphData): boolean {
  const edges = getEdges(data);

  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];

      // skip shared endpoints
      if (
        e1.aId === e2.aId ||
        e1.aId === e2.bId ||
        e1.bId === e2.aId ||
        e1.bId === e2.bId
      ) {
        continue;
      }

      if (segmentsIntersect(e1.a, e1.b, e2.a, e2.b)) {
        return true;
      }
    }
  }
  return false;
}


export function getViewBox(draw: any) {
  // svg.js .viewbox() returns an object { x, y, width, height }
  return draw.viewbox();
}

export function screenToWorld(clientX: number, clientY: number, container: HTMLElement, draw: any) {
  const rect = container.getBoundingClientRect();
  const vb = getViewBox(draw);
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  return {
    x: vb.x + (sx / rect.width) * vb.width,
    y: vb.y + (sy / rect.height) * vb.height,
  };
}

export function worldToScreen(wx: number, wy: number, container: HTMLElement, draw: any) {
  const rect = container.getBoundingClientRect();
  const vb = getViewBox(draw);
  return {
    x: ((wx - vb.x) / vb.width) * rect.width + rect.left,
    y: ((wy - vb.y) / vb.height) * rect.height + rect.top,
  };
}
