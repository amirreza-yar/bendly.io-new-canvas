import {
  CrushFold,
  CrushFoldBold,
  Drawing,
  DrawingBold,
  Earaser,
  EaraserBold,
  Modify,
  ModifyBold,
  Move,
  MoveBold,
  Resize,
  ResizeBold,
  Taper,
  TaperBold,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ButtonGroup } from '@/components/ui/button-group';
import { RefObject } from 'react';
import { Engine } from '@/lib/flashing/engine/engine';
import { Button } from '@/components/ui/button';

export default function CanvasNav({
  engine,
  props,
}: {
  engine: RefObject<Engine>;
  props:
    | {
        activeMode: string;
        canUndo: boolean;
        canRedo: boolean;
        nodesSize: number;
      }
    // eslint-disable-next-line
    | any;
}) {
  const modes = [
    {
      name: 'resize',
      title: 'Adjust',
      icon: Resize,
      iconBold: ResizeBold,
      activeCondition: (props.nodesSize ?? 0) > 1,
    },
    {
      name: 'modiy',
      title: 'Modify',
      icon: Modify,
      iconBold: ModifyBold,
      activeCondition: (props.nodesSize ?? 0) > 1,
      subModes: [
        {
          name: 'move',
          title: 'Move',
          icon: Move,
          iconBold: MoveBold,
          activeCondition: (props.nodesSize ?? 0) > 1,
        },
        {
          name: 'remove',
          title: 'Remove',
          icon: Earaser,
          iconBold: EaraserBold,
          activeCondition: (props.nodesSize ?? 0) > 1,
        },
      ],
    },
    {
      name: 'draw',
      title: 'Draw',
      icon: Drawing,
      iconBold: DrawingBold,
      activeCondition: true,
    },
    {
      name: 'taper',
      title: 'Taper',
      icon: Taper,
      iconBold: TaperBold,
      activeCondition: (props.nodesSize ?? 0) > 1,
    },
    {
      name: 'fold',
      title: 'Fold',
      icon: CrushFold,
      iconBold: CrushFoldBold,
      activeCondition: (props.nodesSize ?? 0) > 1,
    },
  ];

  return (
    <ButtonGroup className="w-fit mx-auto bg-background shadow-lg rounded-lg">
      {modes.map((mode, index) => {
        if (mode.subModes) {
          const isMenuActive =
            engine.current?.activeMode?.name === 'remove' ||
            engine.current?.activeMode?.name === 'move';

          return (
            <DropdownMenu key={index}>
              <DropdownMenuTrigger asChild>
                <Button
                  key={index}
                  size="lg"
                  variant="ghost"
                  className={cn(
                    'flex-col h-15 text-xs min-w-15 max-w-15 gap-1',
                    isMenuActive && 'text-primary hover:text-primary/90 font-semibold',
                  )}
                  disabled={!mode.activeCondition}
                >
                  {isMenuActive ? (
                    <mode.iconBold className="size-6" />
                  ) : (
                    <mode.icon className="size-6" />
                  )}
                  {mode.title}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-fit p-0 ring-0 shadow-md">
                <DropdownMenuGroup className="p-0 ">
                  {mode.subModes.map((subMode, index) => (
                    <DropdownMenuItem key={index} className="" asChild>
                      <Button
                        size="lg"
                        variant="ghost"
                        className={cn(
                          'flex-col h-15 text-xs min-w-15 max-w-15 gap-1',
                          props.activeMode === subMode.name &&
                            'text-primary hover:text-primary/90 font-semibold',
                        )}
                        onClick={() => {
                          if (props.activeMode === subMode.name) {
                            engine.current?.setMode('idle');
                            return;
                          }
                          engine.current?.setMode(subMode.name);
                        }}
                        disabled={!subMode.activeCondition}
                      >
                        {props.activeMode === subMode.name ? (
                          <subMode.iconBold className="size-6" />
                        ) : (
                          <subMode.icon className="size-6" />
                        )}
                        {subMode.title}
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        const isModeActive = engine.current?.activeMode?.name === mode.name;
        return (
          <Button
            key={index}
            size="lg"
            variant="ghost"
            className={cn(
              'flex-col h-15 text-xs min-w-15 max-w-15 gap-1',
              isModeActive && 'text-primary hover:text-primary/90 font-semibold',
            )}
            onClick={() => {
              if (props.activeMode === mode.name) {
                engine.current?.setMode('idle');
                return;
              }
              engine.current?.setMode(mode.name);
            }}
            disabled={!mode.activeCondition}
          >
            {isModeActive ? <mode.iconBold className="size-6" /> : <mode.icon className="size-6" />}
            {mode.title}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
