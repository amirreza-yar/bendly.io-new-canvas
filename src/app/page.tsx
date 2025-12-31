"use client";

// const initialData: GraphData = {
//   nodes: [
//     { node_id: "3pik7o", left: 550, top: 250, next_node_id: "xk6ibn" },
//     {
//       node_id: "xk6ibn",
//       left: 900,
//       top: 200,
//       prev_node_id: "3pik7o",
//       next_node_id: "zsnkuo",
//     },
//     {
//       node_id: "zsnkuo",
//       left: 900,
//       top: 400,
//       prev_node_id: "xk6ibn",
//       next_node_id: "9dntq7",
//     },
//     {
//       node_id: "9dntq7",
//       left: 700,
//       top: 500,
//       prev_node_id: "zsnkuo",
//       next_node_id: "lm247w",
//     },
//     { node_id: "lm247w", left: 850, top: 550, prev_node_id: "9dntq7" },
//   ],
//   startCrushFold: false,
//   endCrushFold: false,
//   crushFoldDir: false,
// };

import { useEffect, useRef } from "react";
import { Engine } from "@/lib/graph/engine/engine";
import { DrawMode } from "@/lib/graph/engine/modes/draw";
import { MoveMode } from "@/lib/graph/engine/modes/move";
import { graphStore } from "@/lib/graph/store/store";
import { useGraphStore } from "@/lib/graph/store/useStore";

export default function GraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);

  const activeMode = useGraphStore((s) => s.activeMode);
  const canUndo = useGraphStore((s) => s.history.length > 0);
  const canRedo = useGraphStore((s) => s.future.length > 0);

  useEffect(() => {
    if (!containerRef.current) return;

    const eng = new Engine(containerRef.current);
    const drawMode = new DrawMode();
    eng.setMode(drawMode);

    engine.current = eng;

    // initialize some data
    graphStore.setState({ data: { nodes: [] } });

    return () => {
      eng.destroy();
    };
  }, []);

  const switchMode = (mode: "draw" | "move") => {
    if (!engine.current || !containerRef.current) return;
    if (mode === "draw") engine.current.setMode(new DrawMode());
    if (mode === "move") engine.current.setMode(new MoveMode());
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div
        style={{ position: "absolute", top: 10, left: 10, zIndex: 50 }}
        className="absolute top-3 left-3 p-2 space-x-1"
      >
        <button
          className={`${
            activeMode === "draw" ? "bg-blue-500" : "bg-red-500"
          } p-2`}
          onClick={() => switchMode("draw")}
        >
          Draw
        </button>
        <button
          className={`${
            activeMode === "move" ? "bg-blue-500" : "bg-red-500"
          } p-2`}
          onClick={() => switchMode("move")}
        >
          Move
        </button>
      </div>

      <div className="absolute top-3 right-3 p-2 space-x-1">
        <button
          className="bg-black p-2 disabled:bg-gray-400"
          disabled={!canUndo}
          onClick={() => graphStore.getState().undo()}
        >
          Undo
        </button>

        <button
          className="bg-black p-2 disabled:bg-gray-400"
          disabled={!canRedo}
          onClick={() => graphStore.getState().redo()}
        >
          Redo
        </button>
      </div>

      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", background: "#fafafa" }}
      />
    </div>
  );
}
