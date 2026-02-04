import { RefObject, useState } from 'react';
import { Engine } from '../engine/engine';
import { useGraphStore } from '../store/useStore';

export default function CanvasHeader({ engine }: { engine: RefObject<Engine | null> }) {
  const activeMode = useGraphStore((s) => s.activeMode);
  const canUndo = useGraphStore((s) => s.history.length > 0);
  const canRedo = useGraphStore((s) => s.future.length > 0);
  const rawData = useGraphStore((s) => s.data);
  const canDoModeAction = useGraphStore((s) => s.canDoModeAction);
  const modeMeta = useGraphStore((s) => s.modeMeta);
  const startCrushFold = useGraphStore((s) => s.data?.startCrushFold);
  const endCrushFold = useGraphStore((s) => s.data?.endCrushFold);
  const crushFoldDir = useGraphStore((s) => s.data?.crushFoldDir);

  //   eslint-disable-next-line
  const [modeComponentProps, setModeComponentProps] = useState<any>({});

  if (!engine.current || !engine.current.activeMode) return null;

  const UIComponent = engine.current.activeMode.ComponentUI;
  if (!UIComponent) return <>Not rendered</>;

  const props = {
    activeMode: activeMode,
    canUndo: canUndo,
    canRedo: canRedo,
    canDoModeAction: canDoModeAction,
    nodesSize: rawData?.nodes.size,
    modeMeta: modeMeta,
    startCrushFold: startCrushFold,
    endCrushFold: endCrushFold,
    crushFoldDir: crushFoldDir,
    modeComponentProps: modeComponentProps,
    setModeComponentProps: setModeComponentProps,
  };

  return <UIComponent engine={engine} props={props} />;
}
