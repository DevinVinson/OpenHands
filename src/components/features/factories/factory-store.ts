import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SEED_FACTORIES, type Factory } from "./factory-data";

/** PROTOTYPE: factories live only in this browser's localStorage. */
const STORAGE_KEY = "openhands-factories-prototype";
/** Bumped when the Factory shape changes, so old saved data is replaced. */
const STORAGE_VERSION = 2;

export type NewFactoryInput = Omit<Factory, "id" | "tag">;

interface FactoryStore {
  factories: Factory[];
  /** Factory whose section list is open in the sidebar. */
  expandedId: string | null;
  createFactory: (input: NewFactoryInput) => Factory;
  deleteFactory: (id: string) => void;
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
      createFactory: (input) => {
        const id = slugify(
          input.name,
          get().factories.map((f) => f.id),
        );
        const factory: Factory = { ...input, id, tag: `factory:${id}` };
        set((s) => ({
          factories: [...s.factories, factory],
          expandedId: factory.id,
        }));
        return factory;
      },
      deleteFactory: (id) =>
        set((s) => ({
          factories: s.factories.filter((f) => f.id !== id),
          expandedId: s.expandedId === id ? null : s.expandedId,
        })),
      setExpanded: (id) => set({ expandedId: id }),
      reset: () =>
        set({ factories: SEED_FACTORIES, expandedId: SEED_FACTORIES[0].id }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      // Older saved shapes lack goal/KPIs/repo: start over from the seed.
      migrate: () => ({
        factories: SEED_FACTORIES,
        expandedId: SEED_FACTORIES[0].id,
      }),
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ factories: s.factories, expandedId: s.expandedId }),
    },
  ),
);

export function useFactory(id: string | undefined) {
  return useFactoryStore((s) => s.factories.find((f) => f.id === id));
}
