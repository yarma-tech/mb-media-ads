"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import Icon from "../Icon";
import s from "./confirmation.module.css";

type Confirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  intent?: "default" | "danger";
};
const context = createContext<
  ((options: Confirmation) => Promise<boolean>) | null
>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <ConfirmationScope key={pathname}>{children}</ConfirmationScope>;
}
function ConfirmationScope({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<Confirmation | null>(null);
  const pending = useRef<((accepted: boolean) => void) | null>(null);
  const settle = useCallback((accepted: boolean) => {
    const resolve = pending.current;
    pending.current = null;
    setOptions(null);
    resolve?.(accepted);
  }, []);
  const ask = useCallback((next: Confirmation) => {
    // A second request must never replace the decision already on screen.
    if (pending.current) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
      setOptions(next);
    });
  }, []);
  useEffect(
    () => () => {
      pending.current?.(false);
      pending.current = null;
    },
    [],
  );
  return (
    <context.Provider value={ask}>
      {children}
      {options && <ConfirmationDialog options={options} settle={settle} />}
    </context.Provider>
  );
}
function ConfirmationDialog({
  options,
  settle,
}: {
  options: Confirmation;
  settle: (accepted: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId(),
    descriptionId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLButtonElement>("[data-cancel]")?.focus();
    return () => {
      dialog?.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(e) => {
        e.preventDefault();
        settle(false);
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const b = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < b.left ||
          e.clientX > b.right ||
          e.clientY < b.top ||
          e.clientY > b.bottom
        )
          settle(false);
      }}
    >
      <span className={s.symbol} data-intent={options.intent ?? "default"}>
        <Icon name={options.intent === "danger" ? "trash" : "info"} size={21} />
      </span>
      <h2 id={titleId}>{options.title}</h2>
      <p id={descriptionId}>{options.description}</p>
      <div className={s.actions}>
        <button type="button" data-cancel onClick={() => settle(false)}>
          {options.cancelLabel ?? "Annuler"}
        </button>
        <button
          type="button"
          className={s.confirm}
          data-intent={options.intent ?? "default"}
          onClick={() => settle(true)}
        >
          {options.confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
export function useConfirmation() {
  const ask = useContext(context);
  if (!ask) throw new Error("ConfirmationProvider manquant");
  return ask;
}
