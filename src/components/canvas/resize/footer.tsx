import { Button } from '@/components/ui/button';
import { Check, X, RulerDimensionLine, DraftingCompass } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Dispatch, SetStateAction, useEffect } from 'react';
import VirtualKeyboard from '../base/keyboard';
import { ResizeModeComponentProps } from '.';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { graphStore } from '@/lib/flashing/store/store';
import { cn } from '@/lib/utils';
import { CancelAlertDialog } from './alert';

export default function ResizeModeFooter({
  componentProps,
  setComponentProps,
  onSave,
  onCancel,
}: {
  componentProps: ResizeModeComponentProps;
  setComponentProps: Dispatch<SetStateAction<ResizeModeComponentProps>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const val = Number(componentProps.value ?? 0);
    if (!val || val < 20) return;
    if (!componentProps.onApplyValue) return;

    setTimeout(() => {
      componentProps.onApplyValue(val);
    }, 300);
  }, [componentProps]);

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
              value={componentProps.value ?? 0}
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

          {componentProps.canApply ? (
            <CancelAlertDialog onAction={onSave} onCancel={onCancel}>
              <Button variant="outline" size="icon-lg" className="border-primary text-primary">
                <X />
              </Button>
            </CancelAlertDialog>
          ) : (
            <Button
              variant="outline"
              size="icon-lg"
              className="border-primary text-primary"
              onClick={onCancel}
            >
              <X />
            </Button>
          )}
          <Button size="icon-lg" disabled={!componentProps.canApply} onClick={onSave}>
            <Check />
          </Button>
        </div>
      </Field>

      <VirtualKeyboard setInputValue={setComponentProps} />
    </div>
  );
}
