'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

export function UnitToggle() {
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="capitalize text-xs">
          {unit}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setUnit('metric')}>Metric</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setUnit('imperial')}>Imperial</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
