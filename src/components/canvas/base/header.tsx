import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { graphStore } from '@/lib/flashing/store/store';
import { ArrowRight, Redo, Settings, Undo, X } from 'lucide-react';
import SettingsDrawer from './settings/drawer';

export default function CanvasHeader({
  props,
}: {
  props:
    | {
        activeMode: string;
        canUndo: boolean;
        canRedo: boolean;
        nodesSize: number;
      }
    // eslint-disable-next-line
    | any;
}) {
  return (
    <>
      <div className="z-5 fixed top-0 w-full">
        <div className="flex items-center justify-between w-full bg-background text-foreground border-b-2 px-2 py-2 ">
          <Button variant="ghost" size="icon-lg">
            <X />
          </Button>
          <p className="text-lg font-semibold flex gap-2 items-center">Canvas</p>
          <Button variant="ghost" size="icon-lg">
            <ArrowRight />
          </Button>
        </div>
      </div>

      <ButtonGroup className="fixed top-16.5 left-4 bg-background shadow-md rounded-lg">
        <Button
          variant="ghost"
          size="icon-lg"
          disabled={!props.canUndo}
          onClick={graphStore.getState().undo}
        >
          <Undo />
        </Button>
        <ButtonGroupSeparator />
        <Button
          variant="ghost"
          size="icon-lg"
          disabled={!props.canRedo}
          onClick={graphStore.getState().redo}
        >
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
