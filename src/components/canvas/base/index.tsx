import { motion } from 'framer-motion';
import CanvasHeader from './header';
import { ReactNode, RefObject } from 'react';
import { Engine } from '@/lib/flashing/engine/engine';
import CanvasSide from './side';
import CanvasNav from './footer';

export default function BaseModeUI({
  engine,
  props,
}: {
  engine: RefObject<Engine>;
  props:
    | {
        activeMode: string;
        canUndo: boolean;
        canRedo: boolean;
        nodesSize: number;
      }
    // eslint-disable-next-line
    | any;
}): ReactNode {
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
        <CanvasHeader props={props} />
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
        <CanvasNav props={props} engine={engine} />
      </motion.div>
    </>
  );
}
