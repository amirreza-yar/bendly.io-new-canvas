// engine/viewport.ts
import type { Svg } from "@svgdotjs/svg.js";
import { graphStore } from "../store/store";

export function attachPanZoom(
  draw: Svg,
  onWorldPoint: (p: { x: number; y: number }) => void
) {
  let isPanning = false;
  let last = { x: 0, y: 0 };

  function clientToWorld(clientX: number, clientY: number) {
    const rect = draw.node.getBoundingClientRect();
    const { panX, panY, zoom } = graphStore.getState();

    return {
      x: (clientX - rect.left - panX) / zoom,
      y: (clientY - rect.top - panY) / zoom,
    };
  }

  // ---------- pointer ----------
  draw.on("pointerdown", (e: PointerEvent) => {
    if (e.button !== 1 && e.pointerType === "mouse") return;

    isPanning = true;
    last = { x: e.clientX, y: e.clientY };
  });

  draw.on("pointermove", (e: PointerEvent) => {
    const world = clientToWorld(e.clientX, e.clientY);
    onWorldPoint(world);

    if (!isPanning) return;

    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    last = { x: e.clientX, y: e.clientY };

    const { panX, panY, zoom } = graphStore.getState();
    graphStore.getState().setTransform(zoom, panX + dx, panY + dy);
  });

  draw.on("pointerup pointerleave", () => {
    isPanning = false;
  });

  // ---------- wheel zoom (cursor-centered) ----------
  draw.on("wheel", (e: WheelEvent) => {
    e.preventDefault();

    const state = graphStore.getState();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newZoom = Math.max(0.2, Math.min(4, state.zoom * factor));

    const world = clientToWorld(e.clientX, e.clientY);

    const rect = draw.node.getBoundingClientRect();
    const panX = e.clientX - rect.left - world.x * newZoom;
    const panY = e.clientY - rect.top - world.y * newZoom;

    state.setTransform(newZoom, panX, panY);
  });
}
