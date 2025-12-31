import { SvgRenderer } from "./renderer";
import { graphStore } from "../store/store";
import { Mode } from "../types/types";

export class Engine {
  container: HTMLElement;
  renderer: SvgRenderer;
  activeMode: Mode | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new SvgRenderer(container);

    // subscribe to store
    graphStore.subscribe((state) => {
      if (state.data) this.renderer.render(state.data);
    });

    // attachPanZoom(this.renderer.draw, (world) => {
    //   // modes receive world coords if you want
    // });

    // pointer events
    container.addEventListener("pointerdown", this.handlePointerDown);
    container.addEventListener("pointermove", this.handlePointerMove);
    container.addEventListener("pointerup", this.handlePointerUp);
  }

  setMode(mode: Mode) {
    this.activeMode = mode;
    graphStore.getState().setMode(mode.name);
  }

  handlePointerDown = (e: PointerEvent) => {
    if (!this.activeMode?.onPointerDown) return;
    const world = this.screenToWorld(e.clientX, e.clientY);
    this.activeMode.onPointerDown(e, world);
  };

  handlePointerMove = (e: PointerEvent) => {
    if (!this.activeMode?.onPointerMove) return;
    const world = this.screenToWorld(e.clientX, e.clientY);
    this.activeMode.onPointerMove(e, world);
  };

  handlePointerUp = (e: PointerEvent) => {
    if (!this.activeMode?.onPointerUp) return;
    const world = this.screenToWorld(e.clientX, e.clientY);
    this.activeMode.onPointerUp(e, world);
  };

  screenToWorld(clientX: number, clientY: number) {
    // convert screen coords to graph coords
    const rect = this.container.getBoundingClientRect();

    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return {
      x: (sx - graphStore.getState().panX) / graphStore.getState().zoom,
      y: (sy - graphStore.getState().panY) / graphStore.getState().zoom,
    };
  }

  destroy() {
    this.container.removeEventListener("pointerdown", this.handlePointerDown);
    this.container.removeEventListener("pointermove", this.handlePointerMove);
    this.container.removeEventListener("pointerup", this.handlePointerUp);
  }
}
