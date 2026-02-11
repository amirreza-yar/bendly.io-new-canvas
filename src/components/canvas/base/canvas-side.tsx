import { Button } from '@/components/ui/button';
import { Engine } from '@/lib/flashing/engine/engine';
import { graphStore } from '@/lib/flashing/store/store';
import { useGraphStore } from '@/lib/flashing/store/useStore';
import { Crosshair } from 'lucide-react';
import { RefObject } from 'react';

export default function CanvasSide({ engine }: { engine: RefObject<Engine> }) {
  const unit = useGraphStore((s) => s.unit);

  return (
    <>
      <Button
        className="shadow-md bg-background"
        variant="ghost"
        size="icon-lg"
        onClick={() => engine.current.renderer.centerRenderedContentAnimated()}
      >
        <Crosshair />
      </Button>

      <Button
        className="shadow-md bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground/80"
        variant="ghost"
        size="icon-lg"
        onClick={() => {
          const state = graphStore.getState();
          state.setUnit(state.unit === 'mm' ? 'in' : 'mm');
        }}
      >
        {unit}
      </Button>
    </>
  );
}
