import { Button } from '@/components/ui/button';
import { X, RulerDimensionLine } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Dispatch, RefObject, SetStateAction, useEffect, useState } from 'react';
import VirtualKeyboard from '../base/keyboard';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { graphStore } from '@/lib/flashing/store/store';
import { Engine } from '@/lib/flashing/engine/engine';
import { TaperModeComponentProps } from '.';

export default function ResizeModeFooter({
  componentProps,
  setComponentProps,
  engine,
}: {
  componentProps: TaperModeComponentProps;
  setComponentProps: Dispatch<SetStateAction<TaperModeComponentProps>>;
  engine: RefObject<Engine>;
}) {
  const [inputVal, setInputVal] = useState<string | null>(null);

  useEffect(() => {
    setInputVal(componentProps.value);
  }, [componentProps]);

  const onSubmitValue = () => {
    const val = Number(inputVal ?? 0);

    if (!val) return;

    if (val < 8) return;

    if (!componentProps.onApplyValue) return;

    componentProps.onApplyValue(val);
    engine.current?.renderer.centerRenderedContentAnimated(40, 300);
  };

  return (
    <div className="bg-background border-t-1 shadow-md w-full">
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
              value={inputVal ?? 0}
            />
            <InputGroupAddon>
              <RulerDimensionLine />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Badge className="px-1 rounded-sm pl-2">{graphStore.getState().unit}</Badge>
            </InputGroupAddon>
          </InputGroup>

          <Button
            variant="outline"
            size="icon-lg"
            className="border-primary text-primary"
            onClick={() => {
              componentProps.onDeselect();
              setComponentProps((prev) => ({ ...prev, drawerOpen: false }));
              engine.current?.renderer.centerRenderedContentAnimated(120, 80);
            }}
          >
            <X />
          </Button>
        </div>
      </Field>

      <VirtualKeyboard
        setInputValue={setInputVal}
        onSubmitValue={onSubmitValue}
        onNext={componentProps.onSelectNext}
        onPrev={componentProps.onSelectPrev}
        canNext={componentProps.canSelectNext}
        canPrev={componentProps.canSelectPrev}
      />
    </div>
  );
}
