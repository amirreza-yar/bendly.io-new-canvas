'use client'
import { useSyncExternalStore } from "react";
import { graphStore, State } from "./store";

export function useGraphStore<T>(selector: (state: State) => T) {
  return useSyncExternalStore(
    // subscribe function
    (callback) => graphStore.subscribe(callback),
    // get snapshot
    () => selector(graphStore.getState()),
    // server snapshot: not needed for client-only
    () => selector(graphStore.getState())
  );
}
