import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Delete, Check } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

export default function VirtualKeyboard({
  setInputValue,
  onSubmitValue,
  onNext,
  onPrev,
  canNext,
  canPrev,
}: {
  setInputValue: Dispatch<SetStateAction<string | null>>;
  onSubmitValue: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  canNext: boolean;
  canPrev: boolean;
}) {
  const append = (char: string) => {
    setInputValue((prev) => {
      const current = prev ?? '';
      if (char === '.' && current.includes('.')) return prev;

      return current + char;
    });
  };

  const backspace = () => {
    setInputValue((prev) => {
      const current = prev ?? '';

      return current.length > 0 ? current.slice(0, -1) : null;
    });
  };

  return (
    <div className="bg-muted p-2 flex items-center justify-center">
      <div className="grid grid-cols-4 gap-1 w-full max-w-100">
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={() => append('1')}
        >
          1
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={() => append('2')}
        >
          2
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={() => append('3')}
        >
          3
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={onPrev}
          disabled={!canPrev}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={() => append('4')}
        >
          4
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={() => append('5')}
        >
          5
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={() => append('6')}
        >
          6
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={onNext}
          disabled={!canNext}
        >
          <ArrowRight className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={() => append('7')}
        >
          7
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={() => append('8')}
        >
          8
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={() => append('9')}
        >
          9
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={backspace}
        >
          <Delete className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={() => append('.')}
        >
          .
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-background shadow-sm text-xl"
          onClick={() => append('0')}
        >
          0
        </Button>
        <Button size="lg" variant="outline" className="shadow-sm text-md" disabled>
          mm
        </Button>
        <Button size="lg" className="shadow-sm text-md" onClick={onSubmitValue}>
          <Check />
        </Button>
      </div>
    </div>
  );
}
