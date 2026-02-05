import { G, SVG, type Svg, Pattern, Rect, Line } from '@svgdotjs/svg.js';
import { graphStore } from '@/lib/flashing/store/store';

export class BaseSvgRenderer {
  container: HTMLElement;
  draw: Svg;
  viewport: G;
  gridLayer: G;
  private gridPattern?: Pattern;
  private gridRect?: Rect;
  private currentGap = 0;

  private gridVLine?: Line;
  private gridHLine?: Line;

  private gridBaseStrokePx = 1;
  private gridStrokeCoeff = 1.0;
  private gridStrokeMinPx = 0.5;
  private gridStrokeMaxPx = 3.0;

  selectedNodeId: string | null = null;
  selectedEdgeId: string | null = null;

  constructor(el: HTMLElement) {
    this.container = el;
    this.draw = SVG().addTo(el).size('100%', '100%');
    this.gridLayer = this.draw.group();
    this.viewport = this.draw.group();

    this.ensureGridPattern(200);
  }

  private ensureGridPattern(worldGap: number) {
    if (worldGap <= 0) {
      if (this.gridRect) {
        this.gridRect.hide();
      }
      return;
    }

    if (this.currentGap === worldGap && this.gridPattern && this.gridRect) {
      this.gridRect.show();
      return;
    }

    if (this.gridPattern) {
      try {
        this.gridPattern.remove();
      } catch {}
    }
    if (this.gridRect) {
      try {
        this.gridRect.remove();
      } catch {}
    }

    // create new pattern in userSpace (patternUnits = userSpaceOnUse)
    const gap = Math.max(1, worldGap); // clamp
    this.currentGap = gap;

    // ... inside ensureGridPattern (where you create the pattern) replace the add lines with references:
    const pattern = this.draw.pattern(gap, gap, (add: Pattern) => {
      // vertical line at x = 0
      this.gridVLine = add.line(0, 0, 0, gap).stroke({
        width: 1 /* placeholder; we'll update later */,
        color: 'var(--ring)',
        linecap: 'butt',
      });
      // .attr({ "pointer-events": "none" });

      // horizontal line at y = 0
      this.gridHLine = add
        .line(0, 0, gap, 0)
        .stroke({ width: 1 /* placeholder */, color: 'var(--ring)', linecap: 'butt' });
      // .attr({ "pointer-events": "none" });
    });

    // ensure world coordinates used
    pattern.attr({ patternUnits: 'userSpaceOnUse' });

    // rect that covers the visible viewBox (we'll size & move it per-viewBox)
    const rect = this.draw.rect(1, 1).fill(pattern).move(0, 0).back(); // keep grid behind nodes/edges
    // Move rect into the dedicated gridLayer so it won't be cleared by annotation clears:
    this.gridLayer.add(rect);
    this.gridLayer.back();

    this.gridPattern = pattern;
    this.gridRect = rect;
  }

  // Align the pattern origin to the grid so panning gives integer steps
  private alignedOrigin(value: number, gap: number) {
    return Math.floor(value / gap) * gap;
  }

  // Call every render (cheap). supply viewBox to avoid re-querying global store.
  private updateGridStrokeForViewBox(vb: { x: number; y: number; width: number; height: number }) {
    if (!this.gridPattern || !this.gridVLine || !this.gridHLine) return;

    // read config from store if you keep these in zustand (optional)
    const state = graphStore.getState();
    const coeff = state.gridStrokeCoeff ?? this.gridStrokeCoeff;
    const basePx = state.gridBaseStrokePx ?? this.gridBaseStrokePx;
    const minPx = state.gridStrokeMinPx ?? this.gridStrokeMinPx;
    const maxPx = state.gridStrokeMaxPx ?? this.gridStrokeMaxPx;

    // screen pixels per world unit
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0) return;
    const scale = rect.width / vb.width; // px per world unit

    // optionally account for devicePixelRatio if you want "device pixels" steadiness
    // const DPR = window.devicePixelRatio || 1;

    // desired visual width in CSS pixels (you can change to DPR pixels by multiplying)
    let desiredPx = basePx * coeff;
    desiredPx = Math.max(minPx, Math.min(maxPx, desiredPx));

    // If you want to account for DPR (so on HiDPI the line still looks same physical thickness),
    // multiply desiredPx by DPR here. Uncomment if needed:
    // desiredPx *= DPR;

    // convert to world units so when viewBox transforms, stroke maps to desiredPx on screen
    const worldStroke = desiredPx / scale;

    // apply to pattern lines (stroke width is in world units)
    try {
      this.gridVLine.stroke({ width: worldStroke });
      this.gridHLine.stroke({ width: worldStroke });
      //   eslint-disable-next-line
    } catch (err) {
      // defensive: if pattern elements are recreated, ignore until next update
    }
  }

  // Call every render (cheap). supply viewBox to avoid re-querying global store.
  updateGridForViewBox(vb: { x: number; y: number; width: number; height: number }) {
    // read gap config from zustand. Example keys: gridGap and gridGapIsPixels.
    const state = graphStore.getState();
    const configuredGap = state.gridGap ?? 50; // fallback
    const gapIsPixels = !!state.gridGapIsPixels;

    // compute worldGap from configuredGap depending on mode
    let worldGap = configuredGap;
    if (gapIsPixels) {
      // convert screen px -> world units
      const rect = this.container.getBoundingClientRect();
      if (rect.width === 0) return; // defensive
      const pxToWorldX = vb.width / rect.width;
      // note: treat gap as square so use width scale
      worldGap = Math.max(1, configuredGap * pxToWorldX);
    }

    // create or update pattern (recreate only when worldGap changed noticeably)
    if (!this.gridPattern || Math.abs(this.currentGap - worldGap) > 1e-6) {
      this.ensureGridPattern(worldGap);
    }

    if (!this.gridPattern || !this.gridRect) return;

    // Align pattern origin to avoid visual jitter while panning
    const ox = this.alignedOrigin(vb.x, this.currentGap);
    const oy = this.alignedOrigin(vb.y, this.currentGap);

    // pattern.x / pattern.y anchor the tiling. pattern.attr works with svg.js Pattern
    this.gridPattern.attr({ x: ox, y: oy });

    // update the rect to cover the exact viewBox (only change attributes — cheap)
    this.gridRect.move(vb.x, vb.y).size(vb.width, vb.height);

    this.updateGridStrokeForViewBox(vb);
  }

  setViewBox(x: number, y: number, width: number, height: number) {
    this.draw.viewbox(x, y, width, height);
    // Also update grid immediately (cheap)
    this.updateGridForViewBox({ x, y, width, height });
  }
}
