import { SvgRenderer } from './renderer';
import { graphStore, StoreState } from '../store/store';
import { Mode } from '../types/types';
import { IdleMode } from './modes/idle';
import { DrawMode } from './modes/draw';
import { MoveMode } from './modes/move';
import { RemoveMode } from './modes/remove';
import { ResizeMode } from './modes/resize';
import { FoldMode } from './modes/fold';
import { TaperMode } from './modes/taper';
import ColorSideMode from './modes/color-side';

export class Engine {
  container: HTMLElement;
  renderer: SvgRenderer;
  activeMode: Mode | null = null;

  // pointer / gesture state
  private isPanning = false;
  private panStart = { clientX: 0, clientY: 0, vbX: 0, vbY: 0 };
  private spaceDown = false;
  private pointers = new Map<number, PointerEvent>();
  private pinchMeta: null | {
    startDist: number;
    startVb: { x: number; y: number; width: number; height: number };
    centerClient: { x: number; y: number };
  } = null;

  private lastRect: DOMRect | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimer: NodeJS.Timeout | null = null;

  // subscriptions / handlers so we can remove them
  private unsubStore: () => void;
  private boundPointerDown = this.handlePointerDownEvent.bind(this);
  private boundPointerMove = this.handlePointerMoveEvent.bind(this);
  private boundPointerUp = this.handlePointerUpEvent.bind(this);
  private boundWheel = this.handleWheelEvent.bind(this);
  private boundKeyDown = this.handleKeyDown.bind(this);
  private boundKeyUp = this.handleKeyUp.bind(this);

  constructor(container: HTMLElement) {
    this.container = container;

    this.container.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // disables the browser's right-click menu
    });

    // ensure the container doesn't let the browser steal gestures
    this.container.style.touchAction = this.container.style.touchAction || 'none';

    this.renderer = new SvgRenderer(container);

    this.lastRect = this.container.getBoundingClientRect();
    this.resizeObserver = new ResizeObserver(() => {
      // small debounce
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.handleResize(), 60);
    });
    this.resizeObserver.observe(this.container);

    const rect = container.getBoundingClientRect();

    graphStore.getState().setViewBox({
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height,
    });

    // subscribe to store: render + apply viewBox from store
    this.unsubStore = graphStore.subscribe((state) => {
      if (state.data && state.viewBox) {
        this.renderer.render(state.data, this.activeMode!);
      }

      if (state.data && state.triggerRender) {
        this.renderer.render(state.data, this.activeMode!);
        state.setTriggerRender(false);
      }

      const vb = (state as StoreState).viewBox;
      if (vb !== null) {
        this.renderer.setViewBox(vb.x, vb.y, vb.width, vb.height);
      }
    });

    // global pointer listeners on container
    container.addEventListener('pointerdown', this.boundPointerDown);
    container.addEventListener('pointermove', this.boundPointerMove);
    container.addEventListener('pointerup', this.boundPointerUp);
    container.addEventListener('pointercancel', this.boundPointerUp);

    // wheel for zoom
    container.addEventListener('wheel', this.boundWheel, {
      passive: false,
    } as AddEventListenerOptions);

    // keyboard (space-to-pan)
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  // inside your Engine class — replace existing handleResize()
  private handleResize() {
    const rect = this.container.getBoundingClientRect();
    if (!this.lastRect) {
      this.lastRect = rect;
      return;
    }

    // no-op if same size
    if (rect.width === this.lastRect.width && rect.height === this.lastRect.height) {
      return;
    }

    const vb = this.getViewBox(); // { x, y, width, height }

    // scale factors from old -> new container size
    const scaleX = rect.width / this.lastRect.width;
    const scaleY = rect.height / this.lastRect.height;

    // If you prefer to preserve aspect ratio, set this true.
    // For top-left anchoring WITHOUT preserving aspect, keep false.
    const preserveAspect = false;

    let newWidth: number, newHeight: number, newX: number, newY: number;

    if (preserveAspect) {
      // uniform scale, anchored top-left
      const scale = Math.min(scaleX, scaleY);
      newWidth = vb.width * scale;
      newHeight = vb.height * scale;
      newX = vb.x; // top-left anchor keeps x,y unchanged
      newY = vb.y;
    } else {
      // independent scaling, anchored top-left
      newWidth = vb.width * scaleX;
      newHeight = vb.height * scaleY;
      newX = vb.x; // anchor top-left: keep origin identical
      newY = vb.y;
    }

    // commit new viewBox to the store
    graphStore.getState().setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });

    // update stored rect for next resize
    this.lastRect = rect;
  }

  setMode(mode: Mode | string, props?: { sLine?: string }) {
    const sLine = props?.sLine;

    if (typeof mode === 'string') {
      let modeInstance: Mode;

      switch (mode) {
        case 'idle':
          modeInstance = new IdleMode();
          break;
        case 'draw':
          modeInstance = new DrawMode();
          break;
        case 'move':
          modeInstance = new MoveMode();
          break;
        case 'remove':
          modeInstance = new RemoveMode();
          break;
        case 'resize':
          modeInstance = new ResizeMode({ sLine: sLine });
          break;
        case 'fold':
          modeInstance = new FoldMode();
          break;
        case 'taper':
          modeInstance = new TaperMode();
          break;
        case 'color-side':
          modeInstance = new ColorSideMode();
          break;
        default:
          throw new Error(`Unknown mode: ${mode}`);
      }

      this.activeMode = modeInstance;
      graphStore.getState().setMode(modeInstance.name);
      return;
    }

    this.activeMode = mode;
    graphStore.getState().setMode(mode.name);
  }

  private getViewBox() {
    return (graphStore.getState() as StoreState).viewBox as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }

  // Convert screen clientX/clientY -> world coords according to current viewBox
  screenToWorld(clientX: number, clientY: number) {
    const rect = this.container.getBoundingClientRect();
    const vb = this.getViewBox();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return {
      x: vb.x + (sx / rect.width) * vb.width,
      y: vb.y + (sy / rect.height) * vb.height,
    };
  }

  // Convert world -> screen (useful for overlays)
  worldToScreen(wx: number, wy: number) {
    const rect = this.container.getBoundingClientRect();
    const vb = this.getViewBox();
    return {
      x: rect.left + ((wx - vb.x) / vb.width) * rect.width,
      y: rect.top + ((wy - vb.y) / vb.height) * rect.height,
    };
  }

  // -------------------------
  // event handlers
  // -------------------------
  private handlePointerDownEvent(e: PointerEvent) {
    console.log('pointer down');
    // track pointers (for pinch)
    this.pointers.set(e.pointerId, e);

    // If two fingers -> start pinch (handled in move)
    if (this.pointers.size === 2) {
      const [a, b] = Array.from(this.pointers.values());
      const dx = b.clientX - a.clientX;
      const dy = b.clientY - a.clientY;
      const dist = Math.hypot(dx, dy);
      this.pinchMeta = {
        startDist: dist,
        startVb: { ...this.getViewBox() },
        centerClient: {
          x: (a.clientX + b.clientX) / 2,
          y: (a.clientY + b.clientY) / 2,
        },
      };

      const vb = this.getViewBox();
      this.isPanning = true;
      this.panStart = {
        clientX: e.clientX,
        clientY: e.clientY,
        vbX: vb.x,
        vbY: vb.y,
      };
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch {}

      return;
    }

    // otherwise forward to active mode with world coords
    const world = this.screenToWorld(e.clientX, e.clientY);

    this.activeMode?.onPointerDown?.(e, world);

    if (!this.activeMode?.isPanAllowed) return;

    // start pan if middle mouse OR Space key held
    if (e.pointerType === 'touch' || e.button === 1) {
      const vb = this.getViewBox();
      this.isPanning = true;
      this.panStart = {
        clientX: e.clientX,
        clientY: e.clientY,
        vbX: vb.x,
        vbY: vb.y,
      };
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch {}
      return;
    }
  }

  private handlePointerMoveEvent(e: PointerEvent) {
    // update pointer map for pinch
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, e);

    // pinch-to-zoom
    if (this.pinchMeta && this.pointers.size === 2) {
      const [a, b] = Array.from(this.pointers.values());
      const dx = b.clientX - a.clientX;
      const dy = b.clientY - a.clientY;
      const dist = Math.hypot(dx, dy);
      if (this.pinchMeta.startDist === 0) return;
      // scale = dist / startDist; larger dist => zoom in (viewbox width decreases)
      const scale = dist / this.pinchMeta.startDist;
      const vb0 = this.pinchMeta.startVb;
      const newWidth = vb0.width / scale;
      const newHeight = vb0.height / scale;

      const rect = this.container.getBoundingClientRect();
      const mx = this.pinchMeta.centerClient.x - rect.left;
      const my = this.pinchMeta.centerClient.y - rect.top;
      const svgX = vb0.x + (mx / rect.width) * vb0.width;
      const svgY = vb0.y + (my / rect.height) * vb0.height;

      const newX = svgX - ((svgX - vb0.x) * newWidth) / vb0.width;
      const newY = svgY - ((svgY - vb0.y) * newHeight) / vb0.height;

      const vb = this.getViewBox();

      graphStore.getState().setScale(rect.width / (vb?.width ?? 1));

      graphStore.getState().setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
      return;
    }

    // panning (viewBox shift) when dragging
    if (this.isPanning) {
      const rect = this.container.getBoundingClientRect();
      const vb = this.getViewBox();
      // dx in screen px -> convert to svg units
      const dxSvg = ((this.panStart.clientX - e.clientX) / rect.width) * vb.width;
      const dySvg = ((this.panStart.clientY - e.clientY) / rect.height) * vb.height;
      const newX = this.panStart.vbX + dxSvg;
      const newY = this.panStart.vbY + dySvg;
      graphStore.getState().setViewBox({ x: newX, y: newY, width: vb.width, height: vb.height });
      return;
    }

    // otherwise forward to mode (normal pointer move)
    const world = this.screenToWorld(e.clientX, e.clientY);
    this.activeMode?.onPointerMove?.(e, world);
  }

  private handlePointerUpEvent(e: PointerEvent) {
    // remove from pointer map
    this.pointers.delete(e.pointerId);

    // end pinch if fewer than 2 pointers
    if (this.pinchMeta && this.pointers.size < 2) {
      this.pinchMeta = null;
    }

    // finish pan
    if (this.isPanning) {
      this.isPanning = false;
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {}
      return;
    }

    // forward to mode
    const world = this.screenToWorld(e.clientX, e.clientY);
    this.activeMode?.onPointerUp?.(e, world);
  }

  // wheel zoom (cursor-centered)
  private handleWheelEvent(evt: Event) {
    const e = evt as WheelEvent;
    e.preventDefault();

    const rect = this.container.getBoundingClientRect();
    const vb = this.getViewBox();

    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const svgX = vb.x + (mx / rect.width) * vb.width;
    const svgY = vb.y + (my / rect.height) * vb.height;

    const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1; // <1 zoom in, tweak to taste
    const newW = vb.width * zoomFactor;
    const newH = vb.height * zoomFactor;

    const newX = svgX - ((svgX - vb.x) * newW) / vb.width;
    const newY = svgY - ((svgY - vb.y) * newH) / vb.height;

    graphStore.getState().setScale(rect.width / (vb?.width ?? 1));

    graphStore.getState().setViewBox({ x: newX, y: newY, width: newW, height: newH });
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space') this.spaceDown = true;
  }
  private handleKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') this.spaceDown = false;
  }

  // -------------------------
  // public destroy
  // -------------------------
  destroy() {
    this.unsubStore();
    this.container.removeEventListener('pointerdown', this.boundPointerDown);
    this.container.removeEventListener('pointermove', this.boundPointerMove);
    this.container.removeEventListener('pointerup', this.boundPointerUp);
    this.container.removeEventListener('pointercancel', this.boundPointerUp);
    this.container.removeEventListener('wheel', this.boundWheel as EventListener);
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
  }
}
