import { RefObject } from 'react';
import { Engine } from '../engine/engine';
import { useGraphStore } from '../store/useStore';
import { AnimatePresence, motion } from 'framer-motion';

export default function ModeComponent({ engine }: { engine: RefObject<Engine | null> }) {
  const activeMode = useGraphStore((s) => s.activeMode);

  if (!engine.current || !engine.current.activeMode) return null;

  const UIComponent = engine.current.activeMode.ComponentUI;
  if (!UIComponent) return <>Not rendered</>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeMode} // causes remount + allows exit animation
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="relative"
      >
        <UIComponent engine={engine} />
      </motion.div>
    </AnimatePresence>
  );
}
