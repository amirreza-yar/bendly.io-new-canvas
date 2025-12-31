// SvgCanvas.tsx
"use client";

import { useEffect, useRef } from "react";
import { initSvgEngine } from "./engine/engine";
import { graphStore } from "./store/store";
import type { GraphData } from "./types/types";

export default function SvgCanvas({ initialData }: { initialData: GraphData }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const engine = initSvgEngine(ref.current);

    // set initial data on client after engine mounted
    graphStore.getState().setData(initialData);

    return () => {
      engine.destroy?.();
    };
  }, [initialData]);

  return (
    <svg
      ref={ref}
      width="100%"
      height="100%"
      style={{
        background: "#fafafa",
        touchAction: "none",
      }}
    />
  );
}
