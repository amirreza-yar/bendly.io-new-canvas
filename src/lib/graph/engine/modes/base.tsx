import { G, PathCommand, StrokeData } from '@svgdotjs/svg.js';
import { graphStore } from '@/lib/graph/store/store';
import { Mode, Node } from '@/lib/graph/types/types';
import {
  createAngleAnnotations,
  createLengthAnnotations,
} from '@/lib/graph/engine/helpers/annotation';
import { createCurshFoldD } from '@/lib/graph/engine/helpers/fold';
import { ReactNode, RefObject } from 'react';
import { Engine } from '../engine';
import { Button } from '@/components/ui/button';
import { ArrowRight, Redo2, Settings, Undo2, X } from 'lucide-react';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import {
  Crosshair,
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

export class BaseMode implements Mode {
  name: string = 'draw';
  isPanAllowed: boolean = true;
  drawAnnotations: boolean = true;
  NODE_RADIUS: number = 10;
  NODE_HIT_WIDTH: number = 40;
  NODE_OVERLAY_RADIUS: number = 25;
  LINE_STROKE_WIDTH: number = 4;
  LINE_HIT_WIDTH: number = 30;
  ANNO_TEXT_SIZE: number = 14;
  ANNO_CHANGE_SCALE_OFFSET: number = 0.7;
  CRUSH_FOLD_OFFSET: number = 10;
  scale: number = 1;

  constructor() {
    const state = graphStore.getState();
    this.LINE_STROKE_WIDTH = state.LINE_STROKE_WIDTH;
    this.NODE_RADIUS = state.NODE_RADIUS;
    this.NODE_HIT_WIDTH = state.NODE_HIT_WIDTH;
    this.NODE_OVERLAY_RADIUS = state.NODE_OVERLAY_RADIUS;
    this.LINE_HIT_WIDTH = state.LINE_HIT_WIDTH;
    this.ANNO_TEXT_SIZE = state.ANNO_TEXT_SIZE;
    this.scale = state.scale;
    this.ANNO_CHANGE_SCALE_OFFSET = graphStore.getState().ANNO_CHANGE_SCALE_OFFSET;
    this.CRUSH_FOLD_OFFSET = state.CRUSH_FOLD_OFFSET;
  }

  ComponentUI({
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
  }): ReactNode {
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
      <>
        <header className="z-100 fixed top-0 w-full">
          <div className="flex items-center justify-between w-full bg-white border-b-2 px-2 py-2 ">
            <Button variant="ghost" size="icon-lg">
              <X />
            </Button>
            <p className="text-lg">Canvas</p>
            <Button variant="ghost" size="icon-lg">
              <ArrowRight />
            </Button>
          </div>
        </header>

        <ButtonGroup className="fixed top-16.5 left-4 bg-white shadow-md rounded-lg">
          <Button
            variant="ghost"
            size="icon-lg"
            disabled={!props.canUndo}
            onClick={graphStore.getState().undo}
          >
            <Undo2 />
          </Button>
          <ButtonGroupSeparator />
          <Button
            variant="ghost"
            size="icon-lg"
            disabled={!props.canRedo}
            onClick={graphStore.getState().redo}
          >
            <Redo2 />
          </Button>
        </ButtonGroup>
        <Button
          variant="ghost"
          size="icon-lg"
          className="fixed top-16.5 right-4 bg-white shadow-md"
        >
          <Settings />
        </Button>

        <Button
          className="fixed right-4 bottom-35 shadow-md bg-white"
          variant="ghost"
          size="icon-lg"
          onClick={() => engine.current.renderer.centerRenderedContentAnimated()}
        >
          <Crosshair />
        </Button>

        <Button
          className="fixed right-4 bottom-22 shadow-md bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground/80"
          variant="ghost"
          size="icon-lg"
        >
          mm
        </Button>

        <footer className="z-100 fixed bottom-4 w-full">
          <ButtonGroup className="w-fit mx-auto bg-white shadow-lg rounded-lg">
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
                  {isModeActive ? (
                    <mode.iconBold className="size-6" />
                  ) : (
                    <mode.icon className="size-6" />
                  )}
                  {mode.title}
                </Button>
              );
            })}

            {/* <Button
              size="lg"
              variant="ghost"
              className="flex-col h-15 text-xs min-w-15 max-w-15 gap-1"
            >
              <Resize className="size-6" />
              Resize
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="flex-col h-15 text-xs min-w-15 max-w-15 gap-1"
            >
              <Modify className="size-6" />
              Modify
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="flex-col h-15 text-xs min-w-15 max-w-15 gap-1"
            >
              <Drawing className="size-6" />
              Draw
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="flex-col h-15 text-xs min-w-15 max-w-15 gap-1"
            >
              <Taper className="size-6" />
              Taper
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="flex-col h-15 text-xs min-w-15 max-w-15 gap-1"
            >
              <CrushFold className="size-6" />
              Fold
            </Button> */}
          </ButtonGroup>
        </footer>
      </>
    );
  }

  annotaionObjects(nodes: Map<string, Node>, g: G) {
    if (!this.drawAnnotations) return;
    const scale = graphStore.getState().scale;
    createLengthAnnotations(nodes, g, scale, this.ANNO_TEXT_SIZE, this.ANNO_CHANGE_SCALE_OFFSET);
    createAngleAnnotations(nodes, g, scale, this.ANNO_TEXT_SIZE, this.ANNO_CHANGE_SCALE_OFFSET);
  }

  nodeObject(g: G, node: Node) {
    const isFirstNode = node.prev_node_id === undefined;
    const isLastNode = node.next_node_id === undefined;
    const state = graphStore.getState();
    if (!(isFirstNode && state.data?.startCrushFold) && !(isLastNode && state.data?.endCrushFold)) {
      this.createNode(g, node);
    }
  }

  edgeObject(g: G, node: Node, to: Node) {
    const state = graphStore.getState();
    const D = createCurshFoldD(node, to, state, state.CRUSH_FOLD_OFFSET);

    if (D !== undefined) {
      this.createPath(g, D);
    } else {
      this.createLine(g, node, to);
    }
  }

  createNode(g: G, node: Node, nodeStyle?: { radius?: number; fill?: string }) {
    const radius =
        nodeStyle?.radius ??
        Math.max(
          this.NODE_RADIUS * 0.3,
          Math.min(this.NODE_RADIUS / graphStore.getState().scale, this.NODE_RADIUS * 1.5),
        ),
      fill = nodeStyle?.fill ?? '#000';

    return g.circle(radius).center(0, 0).fill(fill);
  }

  getFlexStrokeWidth() {
    return Math.max(
      this.LINE_STROKE_WIDTH * 0.3,
      Math.min(this.LINE_STROKE_WIDTH / graphStore.getState().scale, this.LINE_STROKE_WIDTH * 1.5),
    );
  }

  createLine(g: G, node: Node, to: Node, strokeStyle?: StrokeData) {
    const width = strokeStyle?.width ?? this.getFlexStrokeWidth(),
      color = strokeStyle?.color ?? '#000',
      linecap = strokeStyle?.linecap ?? 'round';

    return g
      .path([
        ['M', node.x, node.y],
        ['L', to.x, to.y],
      ])
      .stroke({
        width: width,
        color: color,
        linecap: linecap,
      });
  }

  createPath(g: G, D: PathCommand[], strokeStyle?: StrokeData) {
    const width = strokeStyle?.width ?? this.getFlexStrokeWidth(),
      color = strokeStyle?.color ?? '#000',
      linecap = strokeStyle?.linecap ?? 'round';

    return g
      .path(D)
      .stroke({
        width: width,
        color: color,
        linecap: linecap,
      })
      .fill('#00000000');
  }
}
