import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { ArrowRight, Redo, Settings, Undo, X } from 'lucide-react';
import SettingsDrawer from './settings/drawer';
import { ReactNode } from 'react';
import { useGraphStore } from '@/lib/flashing/store/useStore';

export default function CanvasHeader({
  title = 'Canvas',
  onUndo,
  onRedo,
  onNext,
}: {
  title?: string | ReactNode;
  onUndo: () => void;
  onRedo: () => void;
  onNext: () => void;
}) {
  const canUndo = useGraphStore((s) => s.history.length > 0);
  const canRedo = useGraphStore((s) => s.future.length > 0);

  return (
    <>
      <div className="z-5 fixed top-0 w-full">
        <div className="flex items-center justify-between w-full bg-background text-foreground border-b-2 px-2 py-2 ">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-lg">
              <X />
            </Button>
            <p className="text-md font-semibold">{title}</p>
          </div>
          <Button variant="ghost" size="icon-lg" onClick={onNext}>
            <ArrowRight />
          </Button>
        </div>
      </div>

      <ButtonGroup className="fixed top-16.5 left-4 bg-background shadow-md rounded-lg">
        <Button variant="ghost" size="icon-lg" disabled={!canUndo} onClick={onUndo}>
          <Undo />
        </Button>
        <ButtonGroupSeparator />
        <Button variant="ghost" size="icon-lg" disabled={!canRedo} onClick={onRedo}>
          <Redo />
        </Button>
      </ButtonGroup>
      <SettingsDrawer>
        <Button
          variant="ghost"
          size="icon-lg"
          className="fixed top-16.5 right-4 bg-background shadow-md"
        >
          <Settings />
        </Button>
      </SettingsDrawer>
    </>
  );
}
