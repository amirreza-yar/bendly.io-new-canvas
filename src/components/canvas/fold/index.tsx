import { Engine } from '@/lib/flashing/engine/engine';
import { RefObject, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import FoldModeHeader from './header';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Crosshair } from 'lucide-react';
import { useGraphStore } from '@/lib/flashing/store/useStore';

export type FoldModeComponentProps = {
  triggerCenterCon: boolean;
  onToggleFoldDir?: () => void;
  onSave: () => boolean;
  onCancel: () => boolean;
  canApply: boolean;
};

export function FoldModeUI({ engine }: { engine: RefObject<Engine> }) {
  const canChangeFoldDir = useGraphStore((s) => s.data?.startCrushFold || s.data?.endCrushFold);

  const [modeProps, setModeProps] = useState<FoldModeComponentProps>({
    triggerCenterCon: false,
    onSave: () => false,
    onCancel: () => false,
    onToggleFoldDir: () => {},
    canApply: false,
  });

  useEffect(() => {
    engine.current?.activeMode?.onUIReady?.(setModeProps);
    engine.current.renderer.centerRenderedContentAnimated(150, 20);
  }, [engine]);

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
        <FoldModeHeader componentProps={modeProps} onSave={onSave} onCancel={onCancel} />
      </motion.header>

      <motion.header
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          initial: { opacity: 0, x: 10 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 10 },
        }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        className="fixed bottom-8 right-6"
      >
        <Button
          className="shadow-md bg-background"
          variant="ghost"
          size="icon-lg"
          onClick={() => engine.current.renderer.centerRenderedContentAnimated()}
        >
          <Crosshair />
        </Button>
      </motion.header>

      <motion.header
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          initial: { opacity: 0, x: -10 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -10 },
        }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        className="fixed bottom-8 left-6"
      >
        <Button
          size="icon-xl"
          variant="ghost"
          className="bg-background shadow-md"
          onClick={modeProps.onToggleFoldDir}
          disabled={!canChangeFoldDir}
        >
          <ArrowLeftRight />
        </Button>
      </motion.header>
    </>
  );
}
