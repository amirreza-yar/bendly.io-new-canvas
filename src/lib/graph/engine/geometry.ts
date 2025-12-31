import { Point } from "../types/types";

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
