import { ModeToggle } from '@/components/theme/dropdown';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from '@/components/ui/item';
import { ReactNode } from 'react';
import { UnitToggle } from './unit-dropdown';

export default function SettingsDrawer({ children }: { children: ReactNode }) {
  return (
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
        </div>
      </DrawerContent>
    </Drawer>
  );
}
