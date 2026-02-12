import { Dispatch, SetStateAction } from 'react';
import { BaseMode } from './base';
import ColorSideModeUI, { ColorSideModeComponentProps } from '@/components/canvas/color-side';
import { G, PathCommand } from '@svgdotjs/svg.js';
import { Node, Point } from '../../types/types';
import { graphStore } from '../../store/store';
import { sortNodes } from '../helpers/geometry';

export default class ColorSideMode extends BaseMode {
  name = 'color-side';
  setModeProps: Dispatch<SetStateAction<ColorSideModeComponentProps>> | undefined;
  ComponentUI = ColorSideModeUI;

  constructor() {
    super();
  }

  onUIReady(setModeProps: Dispatch<SetStateAction<ColorSideModeComponentProps>>) {
    this.setModeProps = setModeProps;

    setModeProps((prev) => ({
      ...prev,
      onToggleColorDir: this.toggleColorSide.bind(this),
    }));
  }

  toggleColorSide() {
    const state = graphStore.getState();
    state.setData({ ...state.data, crushFoldDir: !state.data?.crushFoldDir });
  }

  annotaionObjects(): void {}

  nodeObject(): void {}

  initMode(nodes: Map<string, Node>, layer: G) {
    const dir = graphStore.getState().data?.crushFoldDir ? 1 : -1;

    const offsetPoints = this.buildOffsetPolyline(
      sortNodes(nodes),
      dir * this.getFlexStrokeWidth() * 2.4,
    );

    const path: PathCommand[] = [];

    offsetPoints.forEach((p, i) => {
      if (i === 0) {
        path.push(['M', p.x, p.y]);
      } else {
        path.push(['L', p.x, p.y]);
      }
    });

    this.createPath(layer, [...path], {
      color: 'var(--anno-length-primary)',
      width: this.getFlexStrokeWidth() * 2,
      dasharray: `${Math.round(this.getFlexStrokeWidth() * 3)}`,
    }).opacity(0.6);
  }

  private offsetSegment(a: Node, b: Node, offset: number) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    const len = Math.hypot(dx, dy);
    if (!len) return null;

    const nx = -dy / len;
    const ny = dx / len;

    return {
      a: { x: a.x + nx * offset, y: a.y + ny * offset },
      b: { x: b.x + nx * offset, y: b.y + ny * offset },
    };
  }

  private intersectLines(p: Point, r: Point, q: Point, s: Point) {
    const cross = r.x * s.y - r.y * s.x;

    if (Math.abs(cross) < 1e-6) return null;

    const qp = { x: q.x - p.x, y: q.y - p.y };

    const t = (qp.x * s.y - qp.y * s.x) / cross;

    return {
      x: p.x + r.x * t,
      y: p.y + r.y * t,
    };
  }

  private buildOffsetPolyline(points: Node[], offset: number) {
    const offsetSegments = [];

    for (let i = 0; i < points.length - 1; i++) {
      const seg = this.offsetSegment(points[i], points[i + 1], offset);
      if (seg) offsetSegments.push(seg);
    }

    const result = [];

    result.push(offsetSegments[0].a);

    for (let i = 0; i < offsetSegments.length - 1; i++) {
      const s1 = offsetSegments[i];
      const s2 = offsetSegments[i + 1];

      const intersection = this.intersectLines(
        s1.a,
        { x: s1.b.x - s1.a.x, y: s1.b.y - s1.a.y },
        s2.a,
        { x: s2.b.x - s2.a.x, y: s2.b.y - s2.a.y },
      );

      result.push(intersection ?? s1.b);
    }

    result.push(offsetSegments[offsetSegments.length - 1].b);

    return result;
  }

  edgeObject(g: G, node: Node, to: Node) {
    const { data: pathD } = this.createLineORFoldPathData(node, to);
    this.createPath(g, pathD);

    // if (!to.next_node_id) {
    //   const x = path[path.length - 1][1];
    //   const y = path[path.length - 1][2];

    //   if (!x || !y) return;

    //   const angleDeg = Math.atan2(to.y - node.y, to.x - node.x) * (180 / Math.PI);

    //   console.log(angleDeg);

    //   let angle = angleDeg;
    //   if (angle > 90 || angle < -90) {
    //     angle += 180;
    //   }

    //   const label = g.group();

    //   const text = label
    //     .text('Color Side')
    //     .font({
    //       size: Math.max(
    //         this.ANNO_TEXT_SIZE * 0.3,
    //         Math.min(this.ANNO_TEXT_SIZE / graphStore.getState().scale, this.ANNO_TEXT_SIZE * 1.5),
    //       ),
    //       family: 'sans-serif',
    //       anchor: 'middle',
    //       leading: '2em',
    //     })
    //     .fill('#fff')
    //     .center(0, 0);

    //   const bbox = text.bbox();

    //   const recX = bbox.width + bbox.width * 0.6;
    //   const recY = bbox.height + bbox.height * 0.2;

    //   label
    //     .rect(recX, recY)
    //     .radius(bbox.height * 0.5)
    //     .center(0, 0)
    //     .fill('var(--anno-length-primary)')
    //     .back();
    //   let angle2 = angleDeg;

    //   if (angle2 > 90 || angle2 < -90) {
    //     angle2 += +180;
    //   } else {
    //     angle2 += -180;
    //   }

    //   const dx = to.x - node.x;
    //   const dy = to.y - node.y;

    //   const len = Math.hypot(dx, dy);
    //   if (!len) return;

    //   const ux = dx / len;
    //   const uy = dy / len;

    //   const nx = -uy;
    //   const ny = ux;

    //   const padPerp = this.getFlexStrokeWidth() * 1.6; // distance away from line
    //   const padAlong = -this.getFlexStrokeWidth() * 3; // forward/back along line

    //   label.translate(
    //     x - (recX / 2) * Math.cos(degree2Rad(angle2)) + uy * padAlong + nx * padPerp,
    //     y - (recX / 2) * Math.sin(degree2Rad(angle2)) + uy * padAlong + ny * padPerp,
    //   );
    //   label.rotate(angle);
    // }
  }
}
