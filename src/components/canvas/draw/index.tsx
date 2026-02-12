import { motion } from 'framer-motion';
import { ReactNode, RefObject, useEffect, useState } from 'react';
import { Engine } from '@/lib/flashing/engine/engine';
import CanvasHeader from '../base/canvas-header';
import CanvasSide from '../base/canvas-side';
import CanvasNav from '../base/canvas-nav';
import { BothEndsBlockedAlertDialog } from './both-ends-bloacked-alert';
import { RemoveFoldAlertDialog } from './remove-fold-alert';
import { Remove, Resize } from '@/components/icons';
import { graphStore } from '@/lib/flashing/store/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export type DrawModeComponentProps = {
  showCantDrawAlert: boolean;
  showRemoveFoldAlert: boolean;
  onRemoveFold: () => void;
  openLineDropdown: boolean;
  dropdownPosition: { x: number; y: number };
  onLineDeselect: () => void;
  onRemoveLine: () => void;
  lineID: string | null;
};

export default function DrawModeUI({ engine }: { engine: RefObject<Engine> }): ReactNode {
  const [modeProps, setModeProps] = useState<DrawModeComponentProps>({
    showCantDrawAlert: false,
    showRemoveFoldAlert: false,
    onRemoveFold: () => {},
    openLineDropdown: false,
    dropdownPosition: { x: 100, y: 100 },
    onLineDeselect: () => {},
    onRemoveLine: () => {},
    lineID: null,
  });

  useEffect(() => {
    engine.current?.activeMode?.onUIReady?.(setModeProps);
    // engine.current.renderer.centerRenderedContentAnimated(120, 80, );
  }, [engine]);

  const onUndo = () => {
    graphStore.getState().undo();
    engine.current?.renderer.centerRenderedContentAnimated();
  };

  const onRedo = () => {
    graphStore.getState().redo();
    engine.current?.renderer.centerRenderedContentAnimated();
  };

  const onCanvasComplete = () => {
    if (!engine.current) return;
    engine.current.setMode('color-side');
    engine.current.renderer.centerRenderedContentAnimated();
  };

  return (
    <>
      <DropdownMenu
        open={modeProps.openLineDropdown}
        onOpenChange={(open) => {
          if (!open) {
            modeProps.onLineDeselect?.();
            setTimeout(() => {
              setModeProps((prev) => ({
                ...prev,
                dropdownPosition: { x: 0, y: 0 },
                lineID: null,
              }));
            }, 150);
          }
          // dropdown is opening
          setModeProps((prev) => ({ ...prev, openLineDropdown: open }));
        }}
      >
        <DropdownMenuTrigger className="transition-none" asChild>
          <Button
            variant="outline"
            className="fixed opacity-0 h-0 w-0"
            style={{
              top: `${modeProps.dropdownPosition.y}px`,
              left: `${modeProps.dropdownPosition.x}px`,
            }}
          ></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Modify Line</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                if (!modeProps.lineID) return;
                engine.current.setMode('resize', { sLine: modeProps.lineID });
              }}
            >
              <Resize />
              Resize
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                modeProps.onRemoveLine();
                engine.current.renderer.centerRenderedContentAnimated();
              }}
            >
              <Remove />
              Remove
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <BothEndsBlockedAlertDialog
        openAlert={modeProps.showCantDrawAlert}
        setOpenAlert={setModeProps}
      />

      <RemoveFoldAlertDialog
        openAlert={modeProps.showRemoveFoldAlert}
        setOpenAlert={setModeProps}
        onAction={modeProps.onRemoveFold}
      />

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
        <CanvasHeader onUndo={onUndo} onRedo={onRedo} title={<>Draw</>} onNext={onCanvasComplete} />
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
