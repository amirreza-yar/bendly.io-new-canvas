import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Delete } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { ResizeModeComponentProps } from '../resize';

export default function VirtualKeyboard({
  setInputValue,
}: {
  setInputValue: Dispatch<SetStateAction<ResizeModeComponentProps>>;
}) {
  const append = (char: string) => {
    setInputValue((prev) => {
      const current = prev.value ?? '';

      if (char === '.' && current.includes('.')) return prev;

      return {
        ...prev,
        value: current + char,
      };
    });
  };

  const backspace = () => {
    setInputValue((prev) => {
      const current = prev.value ?? '';

      return {
        ...prev,
        value: current.length > 0 ? current.slice(0, -1) : null,
      };
    });
  };

  return (
    <div className="bg-muted p-2 flex items-center justify-center">
      <div className="grid grid-cols-4 gap-1 w-full max-w-100">
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl"
          onClick={() => append('1')}
        >
          1
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl"
          onClick={() => append('2')}
        >
          2
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl"
          onClick={() => append('3')}
        >
          3
        </Button>
        <Button variant="ghost" size="lg" className="bg-white shadow-sm text-xl" disabled>
          <ArrowLeft className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl"
          onClick={() => append('4')}
        >
          4
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl"
          onClick={() => append('5')}
        >
          5
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl"
          onClick={() => append('6')}
        >
          6
        </Button>
        <Button variant="ghost" size="lg" className="bg-white shadow-sm text-xl" disabled>
          <ArrowRight className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl"
          onClick={() => append('7')}
        >
          7
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl"
          onClick={() => append('8')}
        >
          8
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl"
          onClick={() => append('9')}
        >
          9
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl"
          onClick={backspace}
        >
          <Delete className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl"
          onClick={() => append('.')}
        >
          .
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="bg-white shadow-sm text-xl col-span-2"
          onClick={() => append('0')}
        >
          0
        </Button>
        <Button size="lg" className="shadow-sm text-md" disabled>
          mm
        </Button>
      </div>
    </div>
  );
}
