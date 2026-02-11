import { G, Polyline } from '@svgdotjs/svg.js';
import { Node } from '@/lib/flashing/types/types';
import { calculateLength, computeAngle, mmToInch } from './geometry';
import { graphStore } from '../../store/store';

type Point = { x: number; y: number };

export function lengthAnnotationProps(
  n1: Node,
  n2: Node,
  offset: number = 20,
  dir: boolean = true,
) {
  const dx = (n2.x - n1.x) * (dir ? 1 : -1);
  const dy = (n2.y - n1.y) * (dir ? 1 : -1);

  const len = Math.hypot(dx, dy);
  if (len === 0) return { ox: 0, oy: 0 };

  const ox = (-dy / len) * offset;
  const oy = (dx / len) * offset;

  const x1 = n1.x + ox;
  const y1 = n1.y + oy;
  const x2 = n2.x + ox;
  const y2 = n2.y + oy;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return { ox, oy, midX, midY };
}

export function createLengthAnno(
  node: Node,
  to: Node,
  g: G,
  scale: number,
  textSize: number,
  scaleOffset: number,
  bgColor?: string,
  bgColorSec?: string,
  showTapered: boolean = true,
  textPrefix: string = '',
) {
  let cl: string =
    !!node.next_line_bside_length && showTapered
      ? 'var(--anno-length-tapered)'
      : 'var(--anno-length-primary)';

  if (bgColor) {
    cl = bgColor;
  }

  if (scale < scaleOffset) {
    cl = bgColorSec ?? 'var(--anno-length-primary-muted)';
  }

  const { midX, midY } = lengthAnnotationProps(node, to, 0, true);

  const angleDeg = Math.atan2(to.y - node.y, to.x - node.x) * (180 / Math.PI);

  let angle = angleDeg;
  if (angle > 90 || angle < -90) {
    angle += 180;
  }
  const lineLength = calculateLength(node, to);
  const label = g.group();

  const isTapered = !!node.next_line_bside_length ? true : false;

  label.translate(midX!, midY!);
  label.rotate(angle);

  const unit = graphStore.getState().unit;

  const lineLengthToShow = unit === 'mm' ? lineLength.toFixed(0) : mmToInch(lineLength).toFixed(2);

  const text = label
    .text(`${textPrefix}${showTapered && isTapered ? 'N-' : ''}${lineLengthToShow}`)
    .font({
      size: Math.max(textSize * 0.3, Math.min(textSize / scale, textSize * 1.5)),
      family: 'sans-serif',
      anchor: 'middle',
      leading: '2em',
    })
    .fill('#fff')
    .center(0, 0);

  const bbox = text.bbox();

  const paddingX = bbox.width * 0.3;
  const paddingY = bbox.height * 0.1;

  label
    .rect(bbox.width + paddingX * 2, bbox.height + paddingY * 2)
    .radius(bbox.height * 0.5)
    .center(0, 0)
    .fill(cl)
    .back();

  return label;
}

export function createLengthAnnotations(
  nodes: Map<string, Node>,
  g: G,
  scale: number,
  textSize: number,
  scaleOffset: number,
  bgColor?: string,
  bgColorSec?: string,
) {
  let node1 = nodes.get(
    Array.from(nodes.values()).find((n) => n.prev_node_id === undefined)?.node_id ?? '',
  );

  let node2 = nodes.get(node1?.next_node_id ?? '');

  const annoObjects: { object: G; node: Node; to: Node }[] = [];

  while (node2 && node1) {
    const label = createLengthAnno(
      node1,
      node2,
      g,
      scale,
      textSize,
      scaleOffset,
      bgColor,
      bgColorSec,
    );

    annoObjects.push({ object: label, node: node1, to: node2 });

    node1 = node2;

    node2 = nodes.get(node2?.next_node_id ?? '');
  }

  return annoObjects;
}

export function drawAngleArc(
  g: G,
  B: Point,
  startAngle: number,
  endAngle: number,
  rawRadius = 20,
  scale = 1,
) {
  const delta = Math.abs(endAngle - startAngle);
  const RIGHT = Math.PI / 2;
  const EPS = (3 * Math.PI) / 180;

  const radius = Math.max(rawRadius * 0.5, Math.min(rawRadius / scale, rawRadius * 1.2));

  // normalize ordering
  const a1 = startAngle;
  const a2 = endAngle;

  // --- RECTANGULAR ARC FOR ~90° ---
  if (Math.abs(delta - RIGHT) < EPS) {
    const p1 = {
      x: B.x + Math.cos(a1) * radius,
      y: B.y + Math.sin(a1) * radius,
    };

    const p2 = {
      x: B.x + Math.cos(a2) * radius,
      y: B.y + Math.sin(a2) * radius,
    };

    // corner point (intersection of the two offset rays)
    const corner = {
      x: p1.x + (p2.x - B.x),
      y: p1.y + (p2.y - B.y),
    };

    return g
      .polyline([
        [p1.x, p1.y],
        [corner.x, corner.y],
        [p2.x, p2.y],
      ])
      .fill('none')
      .stroke({ width: 1, color: 'blue', linecap: 'round' })
      .back();
  }

  // --- NORMAL CURVED ARC ---
  const steps = 32;
  const points: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const t = a1 + (a2 - a1) * (i / steps);
    points.push([B.x + Math.cos(t) * radius, B.y + Math.sin(t) * radius]);
  }

  return g
    .polyline(points)
    .fill('none')
    .stroke({ width: 1, color: 'blue', linecap: 'round' })
    .back();
}

export function drawAngleText(
  g: G,
  B: Point,
  startAngle: number,
  endAngle: number,
  angleRad: number,
  radius = 26,
  textSize = 12,
  scale: number,
  scaleOffset: number,
  bgColor?: string,
  bgColorSec?: string,
) {
  let cl: string = bgColor ?? 'var(--anno-angle-primary)';

  if (scale < scaleOffset) {
    cl = bgColorSec ?? 'var(--anno-angle-primary-muted)';
  }
  const mid = (startAngle + endAngle) / 2;

  const angle = (angleRad * 180) / Math.PI;

  let radiusOffset: number;

  if (angle > 60) {
    radiusOffset = Math.max(radius * 0.5, Math.min(radius / scale, radius * 1.2));
  } else {
    radiusOffset = Math.max(radius * 0.3, Math.min(radius / scale, radius * 0.6)) * -1;
  }

  // position
  const x = B.x + Math.cos(mid) * radiusOffset;
  const y = B.y + Math.sin(mid) * radiusOffset;

  // rotation: bisector + 90°
  let angleDeg = mid * (180 / Math.PI) + 90;

  // keep text upright
  if (angleDeg > 90 || angleDeg < -90) {
    angleDeg += 180;
  }

  if (Math.round(angle) === 90) return;

  const label = g.group();
  label.translate(x, y);
  label.rotate(angleDeg);

  const text = label
    .text(`${angle.toFixed(0)}°`)
    .font({
      size: Math.max(textSize * 0.3, Math.min(textSize / scale, textSize * 1.5)),
      family: 'sans-serif',
      anchor: 'middle',
      leading: '1em',
    })
    .fill('#fff')
    .center(0, 0);

  const bbox = text.bbox();

  const paddingX = bbox.width * 0.3;
  const paddingY = bbox.height * 0.1;

  label
    .rect(bbox.width + paddingX * 2, bbox.height + paddingY * 2)
    .radius(bbox.height * 0.5)
    .center(0, 0)
    .fill(cl)
    .back();

  return label;
}

export function createAngleAnnotations(
  nodes: Map<string, Node>,
  g: G,
  scale: number,
  textSize: number,
  scaleOffset: number,
) {
  let prevNode = nodes.get(
    Array.from(nodes.values()).find((n) => n.prev_node_id === undefined)?.node_id ?? '',
  );

  let node = nodes.get(prevNode?.next_node_id ?? '');

  let nextNode = nodes.get(node?.next_node_id ?? '');

  while (prevNode && node && nextNode) {
    createAngleAnno(g, prevNode, node, nextNode, scale, textSize, scaleOffset);

    prevNode = node;
    node = nextNode;
    nextNode = nodes.get(nextNode.next_node_id ?? '');
  }
}

export function createAngleAnno(
  g: G,
  prevNode: Node,
  node: Node,
  nextNode: Node,
  scale: number,
  textSize: number,
  scaleOffset: number,
  bgColor?: string,
  bgColorSec?: string,
): {
  arc: Polyline;
  label: G | undefined;
} {
  const { angle, startAngle, endAngle } = computeAngle(prevNode, node, nextNode);

  const arc = drawAngleArc(g, node, startAngle, endAngle, 18, scale);
  const label = drawAngleText(
    g,
    node,
    startAngle,
    endAngle,
    angle,
    40,
    textSize,
    scale,
    scaleOffset,
    bgColor,
    bgColorSec,
  );

  return {
    arc: arc,
    label: label,
  };
}
