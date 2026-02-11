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
import { useGraphStore } from '@/lib/flashing/store/useStore';
import { inchToMm, mmToInch } from '@/lib/flashing/engine/helpers/geometry';

export default function ResizeModeFooter({
  componentProps,
  setComponentProps,
  engine,
}: {
  componentProps: TaperModeComponentProps;
  setComponentProps: Dispatch<SetStateAction<TaperModeComponentProps>>;
  engine: RefObject<Engine>;
}) {
  const unit = useGraphStore((s) => s.unit);

  const [inputVal, setInputVal] = useState<string | null>(null);

  useEffect(() => {
    if (!componentProps.value) return;

    const unit = graphStore.getState().unit;
    const val = unit === 'mm' ? componentProps.value : mmToInch(componentProps.value).toFixed(2);
    // eslint-disable-next-line
    setInputVal(val);
  }, [componentProps.value, unit]);

  const onSubmitValue = () => {
    const val = Number(inputVal ?? 0);
    if (!val) return;

    const unit = graphStore.getState().unit;

    if (unit === 'mm' && val < 8) return;
    if (unit === 'in' && val < 0.3) return;

    if (!componentProps.onApplyValue) return;

    const finVal = unit === 'mm' ? val : inchToMm(val);

    componentProps.onApplyValue(finVal);
    engine.current?.renderer.centerRenderedContentAnimated(40, 300);
  };

  const onUnitToggle = () => {
    const state = graphStore.getState();
    state.setUnit(state.unit === 'mm' ? 'in' : 'mm');
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
              <Badge className="px-1 rounded-sm pl-2">{unit}</Badge>
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
        unit={unit}
        onUnitToggle={onUnitToggle}
      />
    </div>
  );
}
