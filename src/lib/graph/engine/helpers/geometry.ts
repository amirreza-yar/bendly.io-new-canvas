import { Node, Point } from "../../types/types";

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

export function segmentsIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): boolean {
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

export function isAngleInverted(
  pNode: Node,
  baseNode: Node,
  nNode: Node
): boolean | null {
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

export function calculateAngle(
  ax: number,
  ay: number,
  px: number,
  py: number,
  bx: number,
  by: number
): number {
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
  newAngle: number
): number {
  const currentAngle = calculateAngle(
    pNode.x,
    pNode.y,
    baseNode.x,
    baseNode.y,
    nNode.x,
    nNode.y
  );

  return degree2Rad(
    isAngleInverted(pNode, baseNode, nNode)
      ? newAngle - currentAngle
      : currentAngle - newAngle
  );
}

export function getChangeAngleDiff(
  baseNode: Node,
  nNode: Node,
  finRadAngle: number
): { rotatedDX: number; rotatedDY: number } {
  const dx = nNode.x - baseNode.x,
    dy = nNode.y - baseNode.y,
    rotatedDX = dx * Math.cos(finRadAngle) - dy * Math.sin(finRadAngle),
    rotatedDY = dx * Math.sin(finRadAngle) + dy * Math.cos(finRadAngle);

  return { rotatedDX, rotatedDY };
}

export function calculateLength(node1: Node, node2: Node): number {
  return Math.round(Math.hypot(node1.x - node2.x, node1.y - node2.y));
}

export function calculateLineAngle(node1: Node, node2: Node) {
  const dx = node2.x - node1.x;
  const dy = node2.y - node1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

export function getChangeLengthDiff(
  node1: Node,
  node2: Node,
  newLength: number
): { dx: number; dy: number } {
  const currentLength = calculateLength(node1, node2);
  const f = newLength / currentLength;
  return {
    dx: (node1.x - node2.x) * (f - 1),
    dy: (node1.y - node2.y) * (f - 1),
  };
}

export function createCrushFoldCoords(
  baseM: Node,
  M: Node,
  CRUSH_FOLD_OFFSET: number,
  angle: number,
  crushFoldDirValue: 1 | -1
): { A1: Point; A2: Point; A3: Point; A4: Point } {
  const A1 = {
    y: M.y - CRUSH_FOLD_OFFSET * Math.sin((angle * Math.PI) / 180),
    x: M.x - CRUSH_FOLD_OFFSET * Math.cos((angle * Math.PI) / 180),
  };

  const A2 = {
    y:
      A1.y +
      CRUSH_FOLD_OFFSET *
        Math.sin(((angle + 90 * crushFoldDirValue) * Math.PI) / 180),
    x:
      A1.x +
      CRUSH_FOLD_OFFSET *
        Math.cos(((angle + 90 * crushFoldDirValue) * Math.PI) / 180),
  };

  const A3 = {
    y:
      M.y +
      CRUSH_FOLD_OFFSET *
        Math.sin(((angle + 90 * crushFoldDirValue) * Math.PI) / 180),
    x:
      M.x +
      CRUSH_FOLD_OFFSET *
        Math.cos(((angle + 90 * crushFoldDirValue) * Math.PI) / 180),
  };

  const A4 = {
    y: A3.y + CRUSH_FOLD_OFFSET * Math.sin((angle * Math.PI) / 180),
    x: A3.x + CRUSH_FOLD_OFFSET * Math.cos((angle * Math.PI) / 180),
  };

  return { A1, A2, A3, A4 };
}

export function snapToGrid(
  value: number,
  gap: number
): number {
  return Math.round(value / gap) * gap;
}