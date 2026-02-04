import { Engine } from '@/lib/graph/engine/engine';
import { RefObject, useCallback, useEffect, useState } from 'react';
import ResizeModeHeader from './header';
import ResizeModeFooter from './footer';

export type ResizeModeComponentProps = {
  selected: boolean;
  value: string | null;
  type: 'line' | 'node';
  drawerOpen: boolean;
};

export function ResizeModeUI({ engine }: { engine: RefObject<Engine> }) {
  const [modeProps, setModeProps] = useState<ResizeModeComponentProps>({
    selected: false,
    type: 'line',
    value: null,
    drawerOpen: false,
  });

  useEffect(() => {
    engine.current?.activeMode?.onUIReady?.(setModeProps);
  }, [engine]);

  useEffect(() => {
    if (modeProps.drawerOpen) {
      engine.current.renderer.centerRenderedContentAnimated(40, 330);
    }
  }, [modeProps, engine]);

  return (
    <>
      <div
        className={`
          transition-all duration-100 ease-out
          ${
            modeProps.drawerOpen
              ? 'max-h-0 opacity-0 -translate-y-6 pointer-events-none'
              : 'max-h-80 opacity-100 translate-y-0'
          }
          `}
      >
        <ResizeModeHeader />
      </div>

      <ResizeModeFooter componentProps={modeProps} setComponentProps={setModeProps} />
    </>
  );
}
