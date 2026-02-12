import { CircleQuestion } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent } from '@/components/ui/item';
import { Check, X } from 'lucide-react';

export default function ColorSideModeHeader({
  onSave,
  onCancel,
}: {
  onSave?: () => void;
  onCancel?: () => void;
}) {
  return (
    <header className="z-5 fixed top-0 w-full flex flex-col">
      <div className="relative flex items-center justify-between w-full bg-background border-b-2 py-2 px-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-lg"
            // onClick={onCancel}
          >
            <X />
          </Button>
          <p className="text-md font-semibold">Colour Side</p>
        </div>
      </div>
      <div className="px-4 pt-2 max-w-100 mx-auto">
        <Item className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-md">
          <ItemContent>
            <p>
              <span className="font-semibold">Select the colour side.</span> Use the toggle to
              choose which side will be coloured.
            </p>
          </ItemContent>
          <ItemActions>
            <Button variant="ghost" size="icon-lg" className="bg-background rounded-lg shadow-md">
              <CircleQuestion className="size-5" />
            </Button>
          </ItemActions>
        </Item>
      </div>
    </header>
  );
}
