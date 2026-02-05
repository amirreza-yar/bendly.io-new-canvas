'use client';
import { useSyncExternalStore } from 'react';
import { graphStore, StoreState } from './store';

export function useGraphStore<T>(selector: (state: StoreState) => T) {
  return useSyncExternalStore(
    // subscribe function
    (callback) => graphStore.subscribe(callback),
    // get snapshot
    () => selector(graphStore.getState()),
    // server snapshot: not needed for client-only
    () => selector(graphStore.getState()),
  );
}
