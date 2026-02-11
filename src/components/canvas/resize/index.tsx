import { Engine } from '@/lib/flashing/engine/engine';
import { RefObject, useEffect, useState } from 'react';

import ResizeModeFooter from './footer';
import { motion } from 'framer-motion';
import ResizeModeHeader from './header';
import { Button } from '@/components/ui/button';
import { Crosshair } from '@/components/icons';

export type ResizeModeComponentProps = {
  selected: boolean;
  value: string | null;
  type: 'line' | 'node';
  drawerOpen: boolean;
  triggerCenterCon: boolean;
  onApplyValue: (value: string | number) => void;
  onSave: () => boolean;
  onCancel: () => boolean;
  onDeselect: () => void;
  onSelectNext: () => void;
  onSelectPrev: () => void;
  canSelectNext: boolean;
  canSelectPrev: boolean;
  canApply: boolean;
};

export function ResizeModeUI({ engine }: { engine: RefObject<Engine> }) {
  const [modeProps, setModeProps] = useState<ResizeModeComponentProps>({
    selected: false,
    type: 'line',
    value: null,
    drawerOpen: false,
    triggerCenterCon: false,
    onApplyValue: () => {},
    onSave: () => false,
    onCancel: () => false,
    onDeselect: () => {},
    onSelectNext: () => {},
    onSelectPrev: () => {},
    canSelectNext: true,
    canSelectPrev: true,
    canApply: false,
  });

  useEffect(() => {
    engine.current?.activeMode?.onUIReady?.(setModeProps);
    engine.current.renderer.centerRenderedContentAnimated(160, 30);
  }, [engine]);

  useEffect(() => {
    if (modeProps.triggerCenterCon) {
      engine.current.renderer.centerRenderedContentAnimated(40, 330);

      // eslint-disable-next-line
      setModeProps((prev) => ({ ...prev, triggerCenterCon: false }));
    }
  }, [modeProps, engine]);

  const onSave = () => {
    if (!engine.current) return;
    const saveRes = modeProps.onSave();

    if (saveRes) {
      engine.current.setMode('draw');
      engine.current.renderer.centerRenderedContentAnimated(120, 80);
    }
  };

  const onCancel = () => {
    if (!engine.current) return;
    modeProps.onCancel();
    engine.current.setMode('draw');
    engine.current.renderer.centerRenderedContentAnimated(120, 80);
  };

  return (
    <>
      <motion.header
        initial="closed"
        animate={modeProps.drawerOpen ? 'closed' : 'open'}
        exit="exit"
        variants={{
          closed: {
            y: -12,
            opacity: 0,
            pointerEvents: 'none',
            visibility: 'hidden',
          },
          open: {
            y: 0,
            opacity: 1,
            pointerEvents: 'auto',
            visibility: 'visible',
          },
        }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
      >
        <ResizeModeHeader componentProps={modeProps} onSave={onSave} onCancel={onCancel} />
      </motion.header>

      <motion.header
        initial="closed"
        animate={modeProps.drawerOpen ? 'closed' : 'open'}
        exit="exit"
        variants={{
          closed: {
            x: 12,
            opacity: 0,
            pointerEvents: 'none',
            visibility: 'hidden',
          },
          open: {
            x: 0,
            opacity: 1,
            pointerEvents: 'auto',
            visibility: 'visible',
          },
        }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
      >
        <Button
          className="fixed bottom-8 right-6 shadow-md bg-background"
          variant="ghost"
          size="icon-lg"
          onClick={() => engine.current.renderer.centerRenderedContentAnimated(160, 30)}
        >
          <Crosshair />
        </Button>
      </motion.header>

      <motion.div
        initial="closed"
        animate={modeProps.drawerOpen ? 'open' : 'closed'}
        exit="exit"
        variants={{
          closed: {
            y: 50,
            opacity: 0,
            pointerEvents: 'none',
            visibility: 'hidden',
          },
          open: {
            y: 0,
            opacity: 1,
            pointerEvents: 'auto',
            visibility: 'visible',
          },
        }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <ResizeModeFooter
          componentProps={modeProps}
          setComponentProps={setModeProps}
          engine={engine}
        />
      </motion.div>
    </>
  );
}
