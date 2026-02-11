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
}: {
  title?: string | ReactNode;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const canUndo = useGraphStore((s) => s.history.length > 0);
  const canRedo = useGraphStore((s) => s.future.length > 0);

  return (
    <>
      <div className="z-5 fixed top-0 w-full">
        <div className="flex items-center justify-between w-full bg-background text-foreground border-b-2 px-2 py-2 ">
          <Button variant="ghost" size="icon-lg">
            <X />
          </Button>
          <p className="absolute left-1/2 -translate-x-1/2 text-md font-semibold gap-2 flex items-center rounded-md">
            {title}
          </p>
          <Button variant="ghost" size="icon-lg">
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
