import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dispatch, SetStateAction } from 'react';
import { DrawModeComponentProps } from '.';

export function BothEndsBlockedAlertDialog({
  openAlert,
  setOpenAlert,
}: {
  openAlert: boolean;
  setOpenAlert: Dispatch<SetStateAction<DrawModeComponentProps>>;
}) {
  return (
    <AlertDialog open={openAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Both Ends Locked</AlertDialogTitle>
          <AlertDialogDescription>
            Both ends have Crush Folds. To draw, remove one or both Crush Folds. Need adjustments?
            Use the Adjust tool.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => setOpenAlert((prev) => ({ ...prev, showCantDrawAlert: false }))}
          >
            Got it!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
