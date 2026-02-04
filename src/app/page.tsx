'use client';

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

import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { Engine } from '@/lib/graph/engine/engine';
import { DrawMode } from '@/lib/graph/engine/modes/draw';
import { MoveMode } from '@/lib/graph/engine/modes/move';
import { graphStore } from '@/lib/graph/store/store';
import { useGraphStore } from '@/lib/graph/store/useStore';
import { IdleMode } from '@/lib/graph/engine/modes/idle';
import { RemoveMode } from '@/lib/graph/engine/modes/remove';
import { ResizeMode } from '@/lib/graph/engine/modes/resize';
import { FoldMode } from '@/lib/graph/engine/modes/fold';
import { Node } from '@/lib/graph/types/types';
import { TaperMode } from '@/lib/graph/engine/modes/taper';
import CanvasHeader from '@/lib/graph/components/header';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Redo2,
  RulerDimensionLine,
  Settings,
  Undo2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { Crosshair, CrushFold, Drawing, Modify, Resize, Taper } from '@/components/icons';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const demoData: Node[] = [
  {
    node_id: 'gwomd9',
    x: 100,
    y: 350,
    next_node_id: '9rnao4',
  },
  {
    node_id: '9rnao4',
    x: 50,
    y: 500,
    prev_node_id: 'gwomd9',
    next_node_id: 'jeq3bi',
    next_line_bside_length: 300,
  },
  {
    node_id: 'jeq3bi',
    x: 150,
    y: 500,
    prev_node_id: '9rnao4',
    next_node_id: '6jagob',
  },
  {
    node_id: '6jagob',
    x: 200,
    y: 400,
    prev_node_id: 'jeq3bi',
    next_node_id: 'b7lk16',
  },
  {
    node_id: 'b7lk16',
    x: 150,
    y: 350,
    prev_node_id: '6jagob',
  },
];

export default function GraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine>(null);

  const engineReady = useGraphStore((s) => s.engineReady);
  const activeMode = useGraphStore((s) => s.activeMode);
  const canUndo = useGraphStore((s) => s.history.length > 0);
  const canRedo = useGraphStore((s) => s.future.length > 0);
  const canDoModeAction = useGraphStore((s) => s.canDoModeAction);
  const modeMeta = useGraphStore((s) => s.modeMeta);
  const startCrushFold = useGraphStore((s) => s.data?.startCrushFold);
  const endCrushFold = useGraphStore((s) => s.data?.endCrushFold);
  const crushFoldDir = useGraphStore((s) => s.data?.crushFoldDir);

  useEffect(() => {
    if (!containerRef.current) return;

    const eng = new Engine(containerRef.current);
    const drawMode = new DrawMode();

    eng.setMode(drawMode);

    engine.current = eng;

    // initialize some data
    graphStore.setState({
      data: {
        // nodes: new Map<string, Node>(demoData.map((n: Node) => [n.node_id, n])),
        nodes: new Map(),
        startCrushFold: false,
        endCrushFold: false,
        crushFoldDir: false,
      },
    });

    return () => {
      eng.destroy();
    };
  }, []);

  const centerizeDrawing = () => {
    if (!engine.current) return;

    engine.current.renderer.centerRenderedContentAnimated();
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {!engineReady ? (
        <div className="fixed text-2xl w-screen h-screen flex items-center justify-center">
          Rendering...
        </div>
      ) : (
        <>
          <CanvasHeader engine={engine} />

          {/* <div className="absolute top-3 right-4 p-2 space-x-1">
            <button
              className="bg-gray-700 text-white p-2 disabled:bg-gray-400"
              disabled={!canUndo}
              onClick={() => graphStore.getState().undo()}
            >
              Undo
            </button>

            <button
              className="bg-gray-700 text-white p-2 disabled:bg-gray-400"
              disabled={!canRedo}
              onClick={() => graphStore.getState().redo()}
            >
              Redo
            </button>
          </div>

          <div className="absolute bottom-3 left-4 p-2 space-x-1">
            <button className="bg-primary text-white p-2" onClick={() => centerizeDrawing()}>
              Centerize
            </button>
          </div>

          {activeMode === 'remove' && (
            <div className="absolute bottom-3 right-3 p-2 space-x-1">
              <button
                className="bg-red-500 p-2 disabled:bg-red-200"
                disabled={!canDoModeAction}
                onClick={() => {
                  // @ts-expect-error active mode will have onAction for remove
                  engine.current?.activeMode?.onAction();
                }}
              >
                Remove Selected Lines
              </button>
            </div>
          )}

          {activeMode === 'resize' && (
            <div className="absolute bottom-3 right-3 p-2 space-x-1 bg-gray-300 space-x-4">
              <input
                defaultValue={modeMeta ?? 0}
                id="resize-input"
                type="number"
                placeholder="Type desired value"
                className=" bg-white text-black"
              />
              <button
                className="bg-red-500 p-2 disabled:bg-red-200"
                disabled={!canDoModeAction}
                onClick={() => {
                  const resizeInput = document.getElementById('resize-input');
                  // @ts-expect-error active mode will have onAction for resize
                  engine.current?.activeMode?.onAction(resizeInput?.value);
                }}
              >
                Resize
              </button>
            </div>
          )}

          {activeMode === 'fold' && (
            <div className="absolute bottom-3 right-3 p-2 space-x-1 bg-gray-300 space-x-4">
              <button
                className={`p-2 text-black ${startCrushFold ? 'bg-blue-600' : 'bg-gray-200'}`}
                onClick={() => {
                  // @ts-expect-error active mode will have onAction for resize
                  engine.current?.activeMode?.onAction({
                    startCrushFold: !startCrushFold,
                  });
                }}
              >
                Start Fold
              </button>
              <button
                className={`p-2 text-black ${endCrushFold ? 'bg-blue-600' : 'bg-gray-200'}`}
                onClick={() => {
                  // @ts-expect-error active mode will have onAction for resize
                  engine.current?.activeMode?.onAction({
                    endCrushFold: !endCrushFold,
                  });
                }}
              >
                End Fold
              </button>
              <button
                className={`p-2 text-black ${crushFoldDir ? 'bg-blue-600' : 'bg-gray-200'}`}
                onClick={() => {
                  // @ts-expect-error active mode will have onAction for resize
                  engine.current?.activeMode?.onAction({
                    crushFoldDir: !crushFoldDir,
                  });
                }}
              >
                Fold Dir : {String(crushFoldDir)}
              </button>
            </div>
          )} */}
        </>
      )}

      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', zIndex: 'auto', background: '#fafafa' }}
      />
    </div>
  );
}
