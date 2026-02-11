import { Button } from '@/components/ui/button';
import { X, RulerDimensionLine, DraftingCompass } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Dispatch, RefObject, SetStateAction, useEffect, useState } from 'react';
import VirtualKeyboard from '../base/keyboard';
import { ResizeModeComponentProps } from '.';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { graphStore } from '@/lib/flashing/store/store';
import { cn } from '@/lib/utils';
import { Engine } from '@/lib/flashing/engine/engine';
import { inchToMm, mmToInch } from '@/lib/flashing/engine/helpers/geometry';
import { useGraphStore } from '@/lib/flashing/store/useStore';

export default function ResizeModeFooter({
  componentProps,
  setComponentProps,
  engine,
}: {
  componentProps: ResizeModeComponentProps;
  setComponentProps: Dispatch<SetStateAction<ResizeModeComponentProps>>;
  engine: RefObject<Engine>;
}) {
  const unit = useGraphStore((s) => s.unit);

  const [inputVal, setInputVal] = useState<string | null>(null);

  useEffect(() => {
    if (!componentProps.value) return;

    if (componentProps.type === 'line') {
      const unit = graphStore.getState().unit;
      const val = unit === 'mm' ? componentProps.value : mmToInch(componentProps.value).toFixed(2);
      // eslint-disable-next-line
      setInputVal(val);
    } else {
      setInputVal(componentProps.value);
    }
  }, [componentProps.value, componentProps.type, unit]);

  const onSubmitValue = () => {
    const val = Number(inputVal ?? 0);
    if (!val) return;

    const unit = graphStore.getState().unit;

    if (componentProps.type === 'line' && unit === 'mm' && val < 8) return;
    if (componentProps.type === 'line' && unit === 'in' && val < 0.3) return;
    if (componentProps.type === 'node' && val < 35) return;

    if (!componentProps.onApplyValue) return;

    let finVal: number = val;
    if (componentProps.type === 'line') {
      finVal = unit === 'mm' ? val : inchToMm(val);
    }

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
              {componentProps.type === 'line' ? <RulerDimensionLine /> : <DraftingCompass />}
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Badge className={cn('px-1 rounded-sm', componentProps.type === 'node' && 'pl-2')}>
                {componentProps.type === 'line' ? graphStore.getState().unit : ` °`}
              </Badge>
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
        onUnitToggle={onUnitToggle}
        unit={unit}
      />
    </div>
  );
}
