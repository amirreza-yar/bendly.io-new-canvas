'use client';
import { useEffect, useRef } from 'react';
import { Engine } from '@/lib/flashing/engine/engine';
import { DrawMode } from '@/lib/flashing/engine/modes/draw';
import { graphStore } from '@/lib/flashing/store/store';
import { useGraphStore } from '@/lib/flashing/store/useStore';
import { Node } from '@/lib/flashing/types/types';
import ModeComponent from '@/lib/flashing/components/mode';
import { PolygonAlertDialog } from '@/components/canvas/base/polygon-alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  CanvasDropdownGroup,
  CanvasDropdownItem,
  CanvasDropdownRoot,
} from '@/components/canvas/base/line-dropdown';
import { Drawing } from '@/components/icons';

// eslint-disable-next-line
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
  const openPolygonAlert = useGraphStore((s) => s.openPolygonAlert);

  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();

    document.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('gesturestart', prevent);
    document.addEventListener('gesturechange', prevent);
    document.addEventListener('gestureend', prevent);

    return () => {
      document.removeEventListener('gesturestart', prevent);
      document.removeEventListener('gesturechange', prevent);
      document.removeEventListener('gestureend', prevent);
    };
  }, []);

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

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {!engineReady ? (
        <div className="fixed text-2xl w-screen h-screen flex items-center justify-center">
          Rendering...
        </div>
      ) : (
        <>
          <ModeComponent engine={engine} />
        </>
      )}

      <PolygonAlertDialog openPolygonAlert={openPolygonAlert} />

      <div
        ref={containerRef}
        className="canvas-root bg-secondary/30"
        style={{ width: '100%', height: '100%', zIndex: 'auto' }}
      />
    </div>
  );
}
