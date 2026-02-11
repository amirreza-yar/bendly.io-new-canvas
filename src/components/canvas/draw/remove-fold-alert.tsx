import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dispatch, SetStateAction } from 'react';
import { DrawModeComponentProps } from '.';

export function RemoveFoldAlertDialog({
  openAlert,
  onAction,
  setOpenAlert,
}: {
  openAlert: boolean;
  onAction: () => void;
  setOpenAlert: Dispatch<SetStateAction<DrawModeComponentProps>>;
}) {
  return (
    <AlertDialog open={openAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>This end is locked with Crush Fold</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ve added a Crush Fold here. To move the Extender Node to this point, remove the
            Crush Fold first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            variant="ghost"
            onClick={() => {
              onAction();
              setOpenAlert((prev) => ({ ...prev, showRemoveFoldAlert: false }));
            }}
          >
            Remove Crush Fold
          </AlertDialogAction>
          <AlertDialogCancel
            variant="default"
            onClick={() => setOpenAlert((prev) => ({ ...prev, showRemoveFoldAlert: false }))}
          >
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
