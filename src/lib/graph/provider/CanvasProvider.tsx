import { createContext, RefObject, useContext, useRef } from 'react';
import { Engine } from '../engine/engine';
import { useGraphStore } from '../store/useStore';

interface CanvasCtxInterface {
  activeMode: string;
  engine: RefObject<Engine | null> | undefined;
}

const CanvasCtx = createContext<CanvasCtxInterface>({
  activeMode: 'idle',
  engine: undefined,
});

export function CanvasProvider() {
  const engine = useRef<Engine>(null);
  const activeMode = useGraphStore((s) => s.activeMode);

  return (
    <CanvasCtx.Provider
      value={{
        engine: engine,
        activeMode: activeMode,
      }}
    ></CanvasCtx.Provider>
  );
}

export const useCanvas = () => useContext(CanvasCtx);
