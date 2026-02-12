'use client';
import { useEffect, useRef, useState } from 'react';
import { Engine } from '@/lib/flashing/engine/engine';
import { DrawMode } from '@/lib/flashing/engine/modes/draw';
import { graphStore } from '@/lib/flashing/store/store';
import { useGraphStore } from '@/lib/flashing/store/useStore';
import { Node } from '@/lib/flashing/types/types';
import ModeComponent from '@/lib/flashing/components/mode';
import { PolygonAlertDialog } from '@/components/canvas/base/polygon-alert';
import CanvasLoader from '@/components/canvas/base/canvas-loader';
import SelectMaterialDialog from '@/components/canvas/base/material';

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

  const [openMaterialDialog, setOpenMaterialDialog] = useState<boolean>(false);
  const material = useGraphStore((s) => s.material);

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
    // eng.setMode('color-side');

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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!material) {
      timer = setTimeout(() => {
        setOpenMaterialDialog(true);
      }, 300);
    }

    return () => clearTimeout(timer);
  }, [material]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {!engineReady ? (
        <CanvasLoader />
      ) : (
        <>
          <ModeComponent engine={engine} />
          <SelectMaterialDialog
            openDialog={openMaterialDialog}
            setOpenDialog={setOpenMaterialDialog}
          />
          <PolygonAlertDialog openPolygonAlert={openPolygonAlert} />
        </>
      )}

      {/* <WelcomeDialog /> */}

      <div
        ref={containerRef}
        className="canvas-root bg-secondary/30"
        style={{ width: '100%', height: '100%', zIndex: 'auto' }}
      />
    </div>
  );
}
