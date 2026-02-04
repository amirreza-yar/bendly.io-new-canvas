import { Button } from '@/components/ui/button';
import { Check, X, RulerDimensionLine } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Field, FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import VirtualKeyboard from '../base/keyboard';
import { ResizeModeComponentProps } from '.';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

export default function ResizeModeFooter({
  componentProps,
  setComponentProps,
}: {
  componentProps: ResizeModeComponentProps;
  setComponentProps: Dispatch<SetStateAction<ResizeModeComponentProps>>;
}) {
  return (
    <footer
      className={`
                fixed bottom-0 left-0 right-0
                transform transition-all duration-300 ease-out
                ${
                  componentProps.drawerOpen
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-full opacity-0 pointer-events-none'
                }
              `}
    >
      <div className="bg-white border-t-1 shadow-md w-full">
        <Field className="p-4 h-fit">
          <FieldLabel>Length</FieldLabel>
          <div className="flex items-center gap-3">
            <InputGroup>
              <InputGroupInput
                placeholder="Input dimension.."
                readOnly
                inputMode="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={componentProps.value ?? 0}
              />
              <InputGroupAddon>
                <RulerDimensionLine />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <Badge className="px-1 rounded-sm">mm</Badge>
              </InputGroupAddon>
            </InputGroup>

            <Button
              variant="outline"
              size="icon-lg"
              className="border-primary text-primary"
              // onClick={() => setDrawerOpen(false)}
            >
              <X />
            </Button>
            <Button size="icon-lg">
              <Check />
            </Button>
          </div>
        </Field>

        <VirtualKeyboard setInputValue={setComponentProps} />
      </div>
    </footer>
  );
}
