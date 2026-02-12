import { motion } from 'framer-motion';
import CanvasHeader from './canvas-header';
import { ReactNode, RefObject } from 'react';
import { Engine } from '@/lib/flashing/engine/engine';
import CanvasSide from './canvas-side';
import CanvasNav from './canvas-nav';
import { graphStore } from '@/lib/flashing/store/store';

export default function BaseModeUI({ engine }: { engine: RefObject<Engine> }): ReactNode {
  const onUndo = () => {
    graphStore.getState().undo();
    engine.current?.renderer.centerRenderedContentAnimated();
  };

  const onRedo = () => {
    graphStore.getState().redo();
    engine.current?.renderer.centerRenderedContentAnimated();
  };

  return (
    <>
      <motion.header
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          initial: { y: -12, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: -12, opacity: 0 },
        }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
      >
        <CanvasHeader onUndo={onUndo} onRedo={onRedo} onNext={() => {}} />
      </motion.header>

      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          initial: { x: 12, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: 12, opacity: 0 },
        }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        className="fixed z-5 right-4 bottom-22 flex flex-col gap-3 items-center"
      >
        <CanvasSide engine={engine} />
      </motion.div>

      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          initial: { y: 12, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 12, opacity: 0 },
        }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        className="z-5 fixed bottom-4 w-full"
      >
        <CanvasNav engine={engine} />
      </motion.div>
    </>
  );
}
