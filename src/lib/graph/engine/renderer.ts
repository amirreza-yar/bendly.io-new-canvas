import { G } from '@svgdotjs/svg.js';
import { graphStore } from '../store/store'; // import your zustand store
import type { GraphData, Mode } from '../types/types';
import { BaseSvgRenderer } from './base/renderer';

export class SvgRenderer extends BaseSvgRenderer {
  nodesLayer: G;
  edgesLayer: G;
  annotationLayer: G;
  extraLayer: G;

  constructor(el: HTMLElement) {
    super(el);

    this.extraLayer = this.draw.group();
    this.edgesLayer = this.draw.group();
    this.nodesLayer = this.draw.group();
    this.annotationLayer = this.draw.group();

    graphStore.getState().setEngineReady(true);
  }

  private getCombinedBBox() {
    const layers = [this.edgesLayer, this.nodesLayer, this.annotationLayer, this.extraLayer];

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    let hasContent = false;

    for (const layer of layers) {
      if (!layer || layer.children().length === 0) continue;

      const box = layer.bbox(); // WORLD coordinates
      if (!isFinite(box.x) || !isFinite(box.y)) continue;

      hasContent = true;
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    }

    if (!hasContent) return null;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  public centerRenderedContentAnimated(
    paddingTopPx = 40,
    paddingBottomPx = 160,
    paddingSideFrac = 0.01,
    durationMs = 300,
  ) {
    const bbox = this.getCombinedBBox();
    if (!bbox) return;

    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const currentVB = this.draw.viewbox();

    // current scale: world → pixels
    const scale = rect.width / currentVB.width;

    // convert pixel padding → world units
    const padTopWorld = paddingTopPx / scale;
    const padBottomWorld = paddingBottomPx / scale;
    const padXWorld = bbox.width * paddingSideFrac;

    const paddedWidth = bbox.width + padXWorld * 2;
    const paddedHeight = bbox.height + padTopWorld + padBottomWorld;

    const fitScale = Math.min(rect.width / paddedWidth, rect.height / paddedHeight);

    const targetWidth = rect.width / fitScale;
    const targetHeight = rect.height / fitScale;

    const contentCenterX = bbox.x + bbox.width / 2;

    const contentTop = bbox.y - padTopWorld;
    const contentBottom = bbox.y + bbox.height + padBottomWorld;
    const contentCenterY = (contentTop + contentBottom) / 2;

    const target = {
      x: contentCenterX - targetWidth / 2,
      y: contentCenterY - targetHeight / 2,
      width: targetWidth,
      height: targetHeight,
    };

    const start = { ...currentVB };
    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const k = easeInOutCubic(t);

      graphStore.getState().setViewBox({
        x: start.x + (target.x - start.x) * k,
        y: start.y + (target.y - start.y) * k,
        width: start.width + (target.width - start.width) * k,
        height: start.height + (target.height - start.height) * k,
      });

      if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  render(data: GraphData, activeMode: Mode) {
    // keep the grid layer untouched by render clearing
    this.edgesLayer.clear();
    this.nodesLayer.clear();
    this.annotationLayer.clear();
    this.extraLayer.clear();

    // update grid using live viewBox from store (or optionally pass it in)
    const vb = graphStore.getState().viewBox;
    if (vb) this.updateGridForViewBox(vb);

    activeMode?.initMode?.(data.nodes, this.extraLayer.group());

    data.nodes?.forEach((node) => {
      if (!node.next_node_id) return;
      const g = this.edgesLayer.group();
      const to = data.nodes.get(node.next_node_id);
      if (!to) return;

      activeMode.edgeObject(g, node, to);
    });

    data.nodes?.forEach((node) => {
      const g = this.nodesLayer.group();
      g.translate(node.x, node.y);

      activeMode.nodeObject(g, node);
    });

    activeMode?.annotaionObjects?.(data.nodes, this.annotationLayer.group());
  }
}
