import { G, SVG, type Svg, Pattern, Rect } from "@svgdotjs/svg.js";
import { graphStore } from "../store/store"; // import your zustand store
import type { GraphData, Mode } from "../types/types";

export class SvgRenderer {
  draw: Svg;
  nodesLayer: G;
  edgesLayer: G;
  annotationLayer: G;
  viewport: G;
  gridLayer: G;                // new: dedicated layer for grid
  private gridPattern?: Pattern; // svg.js Pattern object
  private gridRect?: Rect;       // svg.js Rect
  private currentGap = 0;       // gap used to build current pattern (world units)
  private container: HTMLElement;

  // inside SvgRenderer class (add these fields)
  private gridVLine?: any;
  private gridHLine?: any;

  // default config (can be read from zustand instead)
  private gridBaseStrokePx = 1;    // baseline pixel width
  private gridStrokeCoeff = 1.0;   // multiplier you asked for
  private gridStrokeMinPx = 0.5;   // smallest visible pixel width
  private gridStrokeMaxPx = 3.0;   // largest pixel width

  selectedNodeId: string | null = null;
  selectedEdgeId: string | null = null;

  constructor(el: HTMLElement) {
    this.container = el;
    this.draw = SVG().addTo(el).size("100%", "100%");
    this.gridLayer = this.draw.group();        // grid lives here and will not be cleared by normal render
    this.edgesLayer = this.draw.group();
    this.nodesLayer = this.draw.group();
    this.annotationLayer = this.draw.group();
    this.viewport = this.draw.group();

    // create an initial (empty) grid
    this.ensureGridPattern(200); // start with some default gap
  }

  // call to create (or recreate) the pattern. Only recreates when gap changes.
  private ensureGridPattern(worldGap: number) {
    if (worldGap <= 0) {
      // disable grid if invalid gap
      if (this.gridRect) {
        this.gridRect.hide();
      }
      return;
    }

    if (this.currentGap === worldGap && this.gridPattern && this.gridRect) {
      // nothing to do
      this.gridRect.show();
      return;
    }

    // remove old pattern & rect cleanly
    if (this.gridPattern) {
      try {
        this.gridPattern.remove();
      } catch { }
    }
    if (this.gridRect) {
      try {
        this.gridRect.remove();
      } catch { }
    }

    // create new pattern in userSpace (patternUnits = userSpaceOnUse)
    const gap = Math.max(1, worldGap); // clamp
    this.currentGap = gap;

    // ... inside ensureGridPattern (where you create the pattern) replace the add lines with references:
    const pattern = this.draw.pattern(gap, gap, (add: any) => {
      // vertical line at x = 0
      this.gridVLine = add.line(0, 0, 0, gap)
        .stroke({ width: 1 /* placeholder; we'll update later */, color: "#d0d0d0", linecap: "butt" })
      // .attr({ "pointer-events": "none" });

      // horizontal line at y = 0
      this.gridHLine = add.line(0, 0, gap, 0)
        .stroke({ width: 1 /* placeholder */, color: "#d0d0d0", linecap: "butt" })
      // .attr({ "pointer-events": "none" });
    });

    // ensure world coordinates used
    pattern.attr({ patternUnits: "userSpaceOnUse" });

    // rect that covers the visible viewBox (we'll size & move it per-viewBox)
    const rect = this.draw
      .rect(1, 1)
      .fill(pattern)
      .move(0, 0)
      .back(); // keep grid behind nodes/edges
    // Move rect into the dedicated gridLayer so it won't be cleared by annotation clears:
    this.gridLayer.add(rect);
    this.gridLayer.back()

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
    const DPR = window.devicePixelRatio || 1;

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

  render(data: GraphData, activeMode: Mode) {
    // keep the grid layer untouched by render clearing
    this.edgesLayer.clear();
    this.nodesLayer.clear();
    this.annotationLayer.clear();

    // update grid using live viewBox from store (or optionally pass it in)
    const vb = graphStore.getState().viewBox;
    if (vb) this.updateGridForViewBox(vb);

    // console.log("in renderer: ", rect.width, vb?.width, scale)

    // if (activeMode.annotaionObjects) 
    
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

    activeMode?.annotaionObjects?.(data.nodes, this.annotationLayer.group())
  }
}
