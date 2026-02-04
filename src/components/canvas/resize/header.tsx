import { CircleQuestion } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent } from '@/components/ui/item';
import { Check, X } from 'lucide-react';

export default function ResizeModeHeader() {
  return (
    <header className="z-100 fixed top-0 w-full flex flex-col">
      <div className="relative flex items-center justify-between w-full bg-white border-b-2 py-2 px-2">
        <Button variant="ghost" size="icon-lg">
          <X />
        </Button>
        <p className="text-lg absolute left-1/2 -translate-x-1/2">Canvas</p>
        <Button variant="ghost" size="lg">
          Apply
          <Check />
        </Button>
      </div>
      <div className="px-4 pt-2 max-w-100 mx-auto">
        <Item className="bg-indigo-100 text-primary shadow-md">
          <ItemContent>
            <p>
              <span className="font-bold">Adjust.</span> Select a line or node to adjust
              length/angle
            </p>
          </ItemContent>
          <ItemActions>
            <Button variant="ghost" size="icon-lg" className="bg-white rounded-lg shadow-md">
              <CircleQuestion className="size-5" />
            </Button>
          </ItemActions>
        </Item>
      </div>
    </header>
  );
}
