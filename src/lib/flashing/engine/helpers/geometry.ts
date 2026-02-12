import { Node, Point } from '@/lib/flashing/types/types';

function orient(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a: Point, b: Point, c: Point) {
  return (
    Math.min(a.x, b.x) <= c.x &&
    c.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= c.y &&
    c.y <= Math.max(a.y, b.y)
  );
}

export function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const o1 = orient(p1, p2, p3);
  const o2 = orient(p1, p2, p4);
  const o3 = orient(p3, p4, p1);
  const o4 = orient(p3, p4, p2);

  if (o1 * o2 < 0 && o3 * o4 < 0) return true;

  if (o1 === 0 && onSegment(p1, p2, p3)) return true;
  if (o2 === 0 && onSegment(p1, p2, p4)) return true;
  if (o3 === 0 && onSegment(p3, p4, p1)) return true;
  if (o4 === 0 && onSegment(p3, p4, p2)) return true;

  return false;
}

export function isAngleInverted(pNode: Node, baseNode: Node, nNode: Node): boolean | null {
  const ux = pNode.x - baseNode.x,
    uy = pNode.y - baseNode.y,
    vx = nNode.x - baseNode.x,
    vy = nNode.y - baseNode.y;
  const lu = Math.hypot(ux, uy),
    lv = Math.hypot(vx, vy);
  if (!lu || !lv) return null;

  // angles & delta
  const θ1 = Math.atan2(uy, ux),
    θ2 = Math.atan2(vy, vx);
  let δ = θ2 - θ1;
  if (δ <= -Math.PI) δ += 2 * Math.PI;
  else if (δ > Math.PI) δ -= 2 * Math.PI;

  return δ >= 0 ? true : false;
}

export function sortNodes(nodesMap: Map<string, Node>): Node[] {
  if (!nodesMap.size) return [];

  // 1️⃣ find head (no prev)
  const head = Array.from(nodesMap.values()).find((n) => !n.prev_node_id);

  if (!head) {
    console.warn('No head found. Possibly broken chain.');
    return [];
  }

  // 2️⃣ follow next pointers
  const result: Node[] = [];

  let current: Node | undefined = head;

  while (current) {
    result.push(current);

    if (!current.next_node_id) break;

    current = nodesMap.get(current.next_node_id);
  }

  return result;
}

export function calculateAngle(pNode: Node, baseNode: Node, nNode: Node): number {
  const ax = pNode.x,
    ay = pNode.y,
    px = baseNode.x,
    py = baseNode.y,
    bx = nNode.x,
    by = nNode.y;

  const ux = ax - px,
    uy = ay - py,
    vx = bx - px,
    vy = by - py;
  const lu = Math.hypot(ux, uy),
    lv = Math.hypot(vx, vy);
  if (!lu || !lv) return 0;

  const theta1 = Math.atan2(uy, ux),
    theta2 = Math.atan2(vy, vx);
  let etha = theta2 - theta1;
  if (etha <= -Math.PI) etha += 2 * Math.PI;
  else if (etha > Math.PI) etha -= 2 * Math.PI;

  const deg = Math.round((Math.abs(etha) * 180) / Math.PI);

  return deg;
}

export function degree2Rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function getFinalChangeAngleRad(
  pNode: Node,
  baseNode: Node,
  nNode: Node,
  newAngle: number,
): number {
  const currentAngle = calculateAngle(pNode, baseNode, nNode);

  return degree2Rad(
    isAngleInverted(pNode, baseNode, nNode) ? newAngle - currentAngle : currentAngle - newAngle,
  );
}

export function getChangeAngleDiff(
  baseNode: Node,
  nNode: Node,
  finRadAngle: number,
): { rotatedDX: number; rotatedDY: number } {
  const dx = nNode.x - baseNode.x,
    dy = nNode.y - baseNode.y,
    rotatedDX = dx * Math.cos(finRadAngle) - dy * Math.sin(finRadAngle),
    rotatedDY = dx * Math.sin(finRadAngle) + dy * Math.cos(finRadAngle);

  return { rotatedDX, rotatedDY };
}

export function calculateLength(node1: Node, node2: Node): number {
  return Math.round(Math.hypot(node1.x - node2.x, node1.y - node2.y) * 10) / 10;
}

export function mmToInch(mm: string | number) {
  if (typeof mm === 'number') {
    return mm / 25.4;
  } else {
    return Number(mm) / 25.4;
  }
}

export function inchToMm(inch: string | number) {
  if (typeof inch === 'number') {
    return inch * 25.4;
  } else {
    return Number(inch) * 25.4;
  }
}

export function calculateLineAngle(node1: Node, node2: Node) {
  const dx = node2.x - node1.x;
  const dy = node2.y - node1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

type LongestLineResult = {
  from: Node;
  to: Node;
  length: number;
};

export function getLongestLine(nodes: Map<string, Node> | undefined): LongestLineResult | null {
  if (!nodes) return null;

  let maxLength = -Infinity;
  let fromNode: Node | null = null;
  let toNode: Node | null = null;

  const visitedEdges = new Set<string>();

  for (const node of nodes.values()) {
    const tryEdge = (otherId?: string) => {
      if (!otherId) return;

      const other = nodes.get(otherId);
      if (!other) return;

      // canonical edge key to avoid double counting
      const key =
        node.node_id < other.node_id
          ? `${node.node_id}-${other.node_id}`
          : `${other.node_id}-${node.node_id}`;

      if (visitedEdges.has(key)) return;
      visitedEdges.add(key);

      const dx = node.x - other.x;
      const dy = node.y - other.y;
      const length = Math.hypot(dx, dy);

      if (length > maxLength) {
        maxLength = length;

        fromNode = node;
        toNode = other;
      }
    };

    tryEdge(node.next_node_id);
    tryEdge(node.prev_node_id);
  }

  if (!fromNode || !toNode) return null;

  return {
    from: fromNode,
    to: toNode,
    length: maxLength,
  };
}

export function getChangeLengthDiff(
  node1: Node,
  node2: Node,
  newLength: number,
): { dx: number; dy: number } {
  const currentLength = calculateLength(node1, node2);
  const f = newLength / currentLength;
  return {
    dx: (node1.x - node2.x) * (f - 1),
    dy: (node1.y - node2.y) * (f - 1),
  };
}

export const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

export function createCrushFoldCoords(
  M: Node,
  CRUSH_FOLD_OFFSET: number,
  angle: number,
  crushFoldDirValue: 1 | -1,
): { A1: Point; A2: Point; A3: Point; A4: Point } {
  if (
    !Number.isFinite(M.x) ||
    !Number.isFinite(M.y) ||
    !Number.isFinite(CRUSH_FOLD_OFFSET) ||
    !Number.isFinite(angle)
  ) {
    console.error('Invalid input', { M, CRUSH_FOLD_OFFSET, angle, crushFoldDirValue });
  }

  const A1 = {
    x: M.x - CRUSH_FOLD_OFFSET * Math.cos((angle * Math.PI) / 180),
    y: M.y - CRUSH_FOLD_OFFSET * Math.sin((angle * Math.PI) / 180),
  };

  const A2 = {
    x: A1.x + CRUSH_FOLD_OFFSET * Math.cos(((angle + 90 * crushFoldDirValue) * Math.PI) / 180),
    y: A1.y + CRUSH_FOLD_OFFSET * Math.sin(((angle + 90 * crushFoldDirValue) * Math.PI) / 180),
  };

  const A3 = {
    x: M.x + CRUSH_FOLD_OFFSET * Math.cos(((angle + 90 * crushFoldDirValue) * Math.PI) / 180),
    y: M.y + CRUSH_FOLD_OFFSET * Math.sin(((angle + 90 * crushFoldDirValue) * Math.PI) / 180),
  };

  const A4 = {
    x: A3.x + CRUSH_FOLD_OFFSET * Math.cos((angle * Math.PI) / 180),
    y: A3.y + CRUSH_FOLD_OFFSET * Math.sin((angle * Math.PI) / 180),
  };

  return { A1, A2, A3, A4 };
}

export function snapToGrid(value: number, gap: number): number {
  return Math.round(value / gap) * gap;
}

export function vec(a: Point, b: Point) {
  return { x: b.x - a.x, y: b.y - a.y };
}

export function len(v: Point) {
  return Math.hypot(v.x, v.y);
}

export function norm(v: Point) {
  const l = len(v) || 1;
  return { x: v.x / l, y: v.y / l };
}

export function dot(a: Point, b: Point) {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Point, b: Point) {
  return a.x * b.y - a.y * b.x;
}

export function angleBetween(u: Point, v: Point) {
  const d = dot(u, v) / (len(u) * len(v));
  return Math.acos(Math.max(-1, Math.min(1, d))); // radians, safe
}

export function angleOf(v: Point) {
  return Math.atan2(v.y, v.x); // -PI..PI
}

export function computeAngle(A: Point, B: Point, C: Point) {
  const v1 = norm(vec(B, A)); // BA
  const v2 = norm(vec(B, C)); // BC

  const angle = angleBetween(v1, v2); // [0..PI]

  // Direction via cross product
  const dir = cross(v1, v2) > 0 ? 1 : -1; // CCW or CW

  // Start/end angles for arc
  const start = angleOf(v1);
  let end = angleOf(v2);

  // Normalize to ensure we draw the smaller arc
  let delta = end - start;
  if (dir > 0 && delta < 0) delta += Math.PI * 2;
  if (dir < 0 && delta > 0) delta -= Math.PI * 2;

  if (Math.abs(delta) > Math.PI) {
    // flip direction to keep smaller angle
    delta = delta > 0 ? delta - 2 * Math.PI : delta + 2 * Math.PI;
  }

  end = start + delta;

  return {
    angle, // radians (always <= PI)
    startAngle: start,
    endAngle: end,
    direction: delta > 0 ? 1 : -1,
  };
}
