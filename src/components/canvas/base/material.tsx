import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { materials } from '@/lib/demo-data';
import { cn } from '@/lib/utils';
import { graphStore } from '@/lib/flashing/store/store';
import { useGraphStore } from '@/lib/flashing/store/useStore';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';

export default function SelectMaterialDialog({
  children,
  openDialog,
  setOpenDialog,
}: {
  children?: ReactNode;
  openDialog: boolean;
  setOpenDialog: Dispatch<SetStateAction<boolean>>;
}) {
  const selectedMat = useGraphStore((s) => s.material);

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog} modal={true}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="h-[calc(100vh-50px)] max-h-200 sm:max-w-200 flex flex-col gap-2 pb-4"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="h-fit">
          <DialogTitle>Select Material & Colour</DialogTitle>
          <DialogDescription>Select your material.</DialogDescription>
        </DialogHeader>
        <div className="no-scrollbar -mx-4 max-h-[100vh] h-full overflow-y-auto px-4">
          <Tabs defaultValue={String(selectedMat?.mat_id)}>
            <TabsPrimitive.List className="sticky top-0 bg-background z-20 pb-4">
              <h6>Materials</h6>
              <div className="flex flex-wrap gap-2 pt-2">
                {materials?.map((mat) => (
                  <TabsPrimitive.Trigger
                    className={cn(
                      "gap-1.5 rounded-md border px-2 py-2 text-sm font-medium [&_svg:not([class*='size-'])]:size-4 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
                      'data-active:bg-success/10 dark:data-active:text-success dark:data-active:border-input dark:data-active:bg-input/30 data-active:text-success',
                      'after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5',
                    )}
                    key={mat.id}
                    value={String(mat.id)}
                  >
                    {mat.name}
                  </TabsPrimitive.Trigger>
                ))}
              </div>
            </TabsPrimitive.List>
            {materials?.map((mat, index: number) => (
              <TabsContent key={index} value={String(mat.id)}>
                {mat.variant_type === 'color' ? (
                  <>
                    <h6 className="pb-4">Color</h6>

                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 pb-2">
                      {mat.variants.map((variant) => (
                        <button
                          type="button"
                          key={variant.id}
                          onClick={() => {
                            graphStore.getState().setMaterial({
                              id: variant.id,
                              mat_id: mat.id,
                              mat_name: mat.name,
                              type: mat.variant_type,
                              label: variant.label,
                              value: variant.value,
                            });
                            // const timer = setTimeout(() => setOpenDialog(false), 200);
                            // clearTimeout(timer);
                          }}
                          className={cn(
                            'rounded-md w-full flex items-center justify-between gap-3 p-1 pl-2 transition border relative',
                            variant.id === selectedMat?.id &&
                              'ring-2 ring-success dark:bg-success/10',
                          )}
                        >
                          <p className="w-full text-start text-xs">{variant.label}</p>
                          <div
                            className="min-w-8 h-8 rounded-md border"
                            style={{
                              background: `${variant.value}`,
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h6 className="pb-4">Thickness</h6>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {mat.variants.map((variant) => (
                        <button
                          type="button"
                          key={variant.id}
                          onClick={() => {
                            graphStore.getState().setMaterial({
                              id: variant.id,
                              mat_id: mat.id,
                              mat_name: mat.name,
                              type: mat.variant_type,
                              label: variant.label,
                              value: variant.value,
                            });
                            // const timer = setTimeout(() => setOpenDialog(false), 200);
                            // clearTimeout(timer);
                          }}
                          className={cn(
                            'rounded-md w-full px-4 py-2 border border-border-default text-xs transition text-center',
                            variant.id === selectedMat?.id && 'bg-success/15',
                          )}
                        >
                          {variant.label} - {variant.value}mm
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
        <div className="bg-background w-full">
          <Button
            className="w-full"
            onClick={() => {
              if (!selectedMat) return;

              setOpenDialog(false);
            }}
            disabled={!!!selectedMat}
          >
            Select Material
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
