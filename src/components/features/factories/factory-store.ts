import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SEED_FACTORIES, type Factory } from "./factory-data";

/** PROTOTYPE: factories live only in this browser's localStorage. */
const STORAGE_KEY = "openhands-factories-prototype";

interface FactoryStore {
  factories: Factory[];
  /** Factory whose section list is open in the sidebar. */
  expandedId: string | null;
  createFactory: (name: string, description: string) => Factory;
  setExpanded: (id: string | null) => void;
  reset: () => void;
}

function slugify(name: string, taken: string[]) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "factory";
  let slug = base;
  let n = 2;
  while (taken.includes(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export const useFactoryStore = create<FactoryStore>()(
  persist(
    (set, get) => ({
      factories: SEED_FACTORIES,
      expandedId: SEED_FACTORIES[0].id,
      createFactory: (name, description) => {
        const factory: Factory = {
          id: slugify(
            name,
            get().factories.map((f) => f.id),
          ),
          name,
          description,
          repositories: ["org/web-app", "org/api-service"],
        };
        set((s) => ({
          factories: [...s.factories, factory],
          expandedId: factory.id,
        }));
        return factory;
      },
      setExpanded: (id) => set({ expandedId: id }),
      reset: () =>
        set({ factories: SEED_FACTORIES, expandedId: SEED_FACTORIES[0].id }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ factories: s.factories, expandedId: s.expandedId }),
    },
  ),
);

export function useFactory(id: string | undefined) {
  return useFactoryStore((s) => s.factories.find((f) => f.id === id));
}
