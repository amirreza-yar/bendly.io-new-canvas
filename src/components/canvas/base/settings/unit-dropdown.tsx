'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { graphStore } from '@/lib/flashing/store/store';
import { useGraphStore } from '@/lib/flashing/store/useStore';

export function UnitToggle() {
  const unit = useGraphStore((s) => s.unit);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="capitalize text-xs">
          {unit === 'mm' ? 'Metric' : 'Imperial'}
          <span className="sr-only">Toggle unit</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => graphStore.getState().setUnit('mm')}>
          Metric
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => graphStore.getState().setUnit('in')}>
          Imperial
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
