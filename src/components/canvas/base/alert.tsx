import { FeaturedStop } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { graphStore } from '@/lib/flashing/store/store';

export function PolygonAlertDialog({ openPolygonAlert }: { openPolygonAlert: boolean }) {
  return (
    <AlertDialog open={openPolygonAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-[#E7642322]">
            <FeaturedStop className="size-11" />
          </AlertDialogMedia>
          <AlertDialogTitle>You Cannot Create A Polygon</AlertDialogTitle>
          <AlertDialogDescription>
            Your action created a polygon. This change will be automatically undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => graphStore.getState().setOpenPolygonAlert(false)}>
            Got it!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
