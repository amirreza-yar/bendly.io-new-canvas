import { Engine } from '@/lib/flashing/engine/engine';
import { RefObject, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MoveModeHeader from './header';

export type MoveModeComponentProps = {
  triggerCenterCon: boolean;
  onSave: () => boolean;
  onCancel: () => boolean;
  canApply: boolean;
};

export function MoveModeUI({ engine }: { engine: RefObject<Engine> }) {
  const [modeProps, setModeProps] = useState<MoveModeComponentProps>({
    triggerCenterCon: false,
    onSave: () => false,
    onCancel: () => false,
    canApply: false,
  });

  useEffect(() => {
    engine.current?.activeMode?.onUIReady?.(setModeProps);
    engine.current.renderer.centerRenderedContentAnimated(160, 20);
  }, [engine]);

  useEffect(() => {
    if (modeProps.triggerCenterCon) {
      engine.current.renderer.centerRenderedContentAnimated(160, 20, 60);

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
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -10 },
        }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
      >
        <MoveModeHeader componentProps={modeProps} onSave={onSave} onCancel={onCancel} />
      </motion.header>
    </>
  );
}
