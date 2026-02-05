import { GraphData, Point } from '@/lib/flashing/types/types';
import { segmentsIntersect } from './geometry';
import { type Svg } from '@svgdotjs/svg.js';

export function getEdges(data: GraphData) {
  const edges: { a: Point; b: Point; aId: string; bId: string }[] = [];

  data.nodes.forEach((n) => {
    if (!n.next_node_id) return;
    const to = data.nodes.get(n.next_node_id);
    if (!to) return;

    edges.push({
      a: { x: n.x, y: n.y },
      b: { x: to.x, y: to.y },
      aId: n.node_id,
      bId: to.node_id,
    });
  });

  return edges;
}

export function hasEdgeCrossing(data: GraphData): boolean {
  const edges = getEdges(data);

  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];

      // skip shared endpoints
      if (e1.aId === e2.aId || e1.aId === e2.bId || e1.bId === e2.aId || e1.bId === e2.bId) {
        continue;
      }

      if (segmentsIntersect(e1.a, e1.b, e2.a, e2.b)) {
        return true;
      }
    }
  }
  return false;
}

export function getViewBox(draw: Svg) {
  // svg.js .viewbox() returns an object { x, y, width, height }
  return draw.viewbox();
}

export function shortId(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return btoa(String.fromCharCode(...bytes))
    .replace(/[+/=]/g, '')
    .slice(0, length);
}

// Convert screen clientX/clientY -> world coords according to current viewBox
export function screenToWorld(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  vb: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
) {
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  return {
    x: vb.x + (sx / rect.width) * vb.width,
    y: vb.y + (sy / rect.height) * vb.height,
  };
}

// Convert world -> screen (useful for overlays)
export function worldToScreen(
  wx: number,
  wy: number,
  rect: DOMRect,
  vb: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
) {
  return {
    x: rect.left + ((wx - vb.x) / vb.width) * rect.width,
    y: rect.top + ((wy - vb.y) / vb.height) * rect.height,
  };
}
