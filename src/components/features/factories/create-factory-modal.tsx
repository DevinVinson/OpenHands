/* eslint-disable i18next/no-literal-string -- PROTOTYPE: wireframe copy, not yet localized. */
import React from "react";
import { X } from "lucide-react";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { useNavigation } from "#/context/navigation-context";
import { useFactoryStore } from "./factory-store";
import { factoryPath } from "./factory-data";
import { Button } from "./factory-ui";

export function CreateFactoryModal({ onClose }: { onClose: () => void }) {
  const createFactory = useFactoryStore((s) => s.createFactory);
  const { navigate } = useNavigation();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    const factory = createFactory(trimmed, description.trim());
    onClose();
    navigate(factoryPath(factory.id));
  };

  return (
    <ModalBackdrop onClose={onClose} aria-label="Create factory">
      <form
        onSubmit={submit}
        data-testid="create-factory-modal"
        className="w-[min(500px,92vw)] rounded-xl border border-border bg-canvas-base p-6 shadow-2xl"
      >
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-content">Create factory</h2>
          <div className="flex-1" />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-content"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">
          Set up a space for agents and automations to work together.
        </p>
        <label
          htmlFor="factory-name"
          className="mb-1.5 mt-5 block text-xs font-semibold text-muted"
        >
          Factory name
        </label>
        <input
          id="factory-name"
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="My factory"
          className="w-full rounded-md border border-border bg-canvas-base px-3 py-2 text-sm text-content"
        />
        <label
          htmlFor="factory-description"
          className="mb-1.5 mt-4 block text-xs font-semibold text-muted"
        >
          Description <span className="font-normal">(optional)</span>
        </label>
        <textarea
          id="factory-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What will this factory do?"
          className="w-full resize-y rounded-md border border-border bg-canvas-base px-3 py-2 text-sm text-content"
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">
            Create factory
          </Button>
        </div>
      </form>
    </ModalBackdrop>
  );
}
