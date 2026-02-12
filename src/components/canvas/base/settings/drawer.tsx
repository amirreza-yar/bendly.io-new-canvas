import { ModeToggle } from '@/components/theme/dropdown';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { ReactNode, useState } from 'react';
import { UnitToggle } from './unit-dropdown';
import SelectMaterialDialog from '../material';
import { useGraphStore } from '@/lib/flashing/store/useStore';
import { Button } from '@/components/ui/button';

export default function SettingsDrawer({ children }: { children: ReactNode }) {
  const [openMaterialDialog, setOpenMaterialDialog] = useState<boolean>(false);
  const material = useGraphStore((s) => s.material);

  return (
    <>
      <Drawer>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="">
            <DrawerTitle className="text-sm">Canvas Settings</DrawerTitle>
            <DrawerDescription className="text-xs">
              You can change your canvas preferences here.
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid">
            <Item>
              <ItemContent>
                <ItemTitle className="text-sm">Theme</ItemTitle>
                <ItemDescription className="text-xs">
                  Change the theme. Items are light, dark and system.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <ModeToggle />
              </ItemActions>
            </Item>
            <Item>
              <ItemContent>
                <ItemTitle className="text-sm">Unit</ItemTitle>
                <ItemDescription className="text-xs">
                  Change the unit. Items are metric and imperial.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <UnitToggle />
              </ItemActions>
            </Item>
            <Item>
              <ItemContent>
                <ItemTitle className="text-sm">Material</ItemTitle>
                <div className="text-xs flex items-center text-xs text-muted-foreground">
                  {material?.mat_name} . {material?.label}
                  {material?.type === 'color' ? (
                    <div
                      className="w-6 h-3 rounded-full border ml-2"
                      style={{
                        background: `${material.value}`,
                      }}
                    />
                  ) : (
                    <>{material?.value}</>
                  )}
                </div>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="outline"
                  size="sm"
                  className="capitalize text-xs"
                  onClick={() => setOpenMaterialDialog(true)}
                >
                  Change
                </Button>
              </ItemActions>
            </Item>
          </div>
        </DrawerContent>
      </Drawer>
      <SelectMaterialDialog openDialog={openMaterialDialog} setOpenDialog={setOpenMaterialDialog} />
    </>
  );
}
