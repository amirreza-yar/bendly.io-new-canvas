import { graphStore } from '@/lib/flashing/store/store';
import { Node } from '@/lib/flashing/types/types';
import { calculateLineAngle, createCrushFoldCoords } from './geometry';

type LineCommand =
  | ['M' | 'm' | 'L' | 'l', number, number]
  | ['H' | 'h' | 'V' | 'v', number]
  | ['Z' | 'z'];

type CurveCommand =
  // Bezier Curves
  | ['C' | 'c', number, number, number, number, number, number]
  | ['S' | 's' | 'Q' | 'q', number, number, number, number]
  | ['T' | 't', number, number]
  // Arcs
  | ['A' | 'a', number, number, number, number, number, number, number];

type PathCommand = LineCommand | CurveCommand;

export function generateCrushFoldState(
  node: Node,
  to: Node,
):
  | {
      crushFoldDirValue: 1 | -1;
      baseM: Node;
      M: Node;
      angle: number;
    }
  | undefined {
  const state = graphStore.getState();
  const shouldAddStartCrush = node.prev_node_id === undefined && state.data?.startCrushFold;
  const shouldAddEndCrush = to.next_node_id === undefined && state.data?.endCrushFold;

  const crushFoldDirValue = shouldAddStartCrush
    ? state.data?.crushFoldDir
      ? -1
      : 1
    : shouldAddEndCrush
      ? state.data?.crushFoldDir
        ? 1
        : -1
      : undefined;

  const node1 = node;
  const node2 = state.data?.nodes?.get(node.next_node_id ?? '');

  if (!node2) return undefined;
  const angle = shouldAddStartCrush
    ? calculateLineAngle(node1, node2)
    : shouldAddEndCrush
      ? calculateLineAngle(node2, node1)
      : undefined;

  const baseM = shouldAddStartCrush ? to : shouldAddEndCrush ? node : undefined;
  const M = shouldAddStartCrush ? node : shouldAddEndCrush ? to : undefined;

  if (!M || !baseM || !angle || !crushFoldDirValue || !(shouldAddStartCrush || shouldAddEndCrush))
    return undefined;

  return {
    crushFoldDirValue,
    baseM,
    M,
    angle,
  };
}

export function createCurshFoldD(
  node: Node,
  to: Node,
  CRUSH_FOLD_OFFSET: number,
): PathCommand[] | undefined {
  const crushFoldState = generateCrushFoldState(node, to);

  if (crushFoldState === undefined) return undefined;
  const { crushFoldDirValue, baseM, M, angle } = crushFoldState;

  const { A1, A2, A3, A4 } = createCrushFoldCoords(M, CRUSH_FOLD_OFFSET, angle, crushFoldDirValue);

  return [
    ['M', baseM.x, baseM.y],
    ['L', M.x, M.y],
    ['C', A1.x, A1.y, A2.x, A2.y, A3.x, A3.y],
    ['L', A4.x, A4.y],
  ];
}
