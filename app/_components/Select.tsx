"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import * as Primitive from "@radix-ui/react-select";
import s from "./select.module.css";

type OptionProps = {
  value?: string | number;
  disabled?: boolean;
  children?: ReactNode;
};
type Props = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "value" | "defaultValue" | "onChange" | "name"
> & {
  children: ReactNode;
  value?: string | number;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  indicator?: boolean;
};
function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (isValidElement<OptionProps>(node)) return text(node.props.children);
  return Children.toArray(node).map(text).join("");
}
function optionsFrom(
  children: ReactNode,
): { value: string; label: string; disabled: boolean }[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionProps>(child)) return [];
    if (child.type === Fragment) return optionsFrom(child.props.children);
    if (child.type !== "option") return [];
    const label = text(child.props.children).trim();
    return [
      {
        value: String(child.props.value ?? label),
        label,
        disabled: !!child.props.disabled,
      },
    ];
  });
}

/** One themed, keyboard-accessible menu everywhere, including native dialogs. */
export default function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  name,
  required,
  disabled,
  className,
  indicator = true,
  ...props
}: Props) {
  const options = optionsFrom(children);
  const [localValue, setLocalValue] = useState(() =>
    String(defaultValue ?? options[0]?.value ?? ""),
  );
  const chosen = value === undefined ? localValue : String(value);
  const emptyKey = "empty:" + useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const placeholder =
    options.find((option) => option.value === "")?.label ?? "Choisir…";
  return (
    <Primitive.Root
      value={chosen}
      onValueChange={(next) => {
        const decoded = next === emptyKey ? "" : next;
        setLocalValue(decoded);
        onValueChange?.(decoded);
      }}
      onOpenChange={(open) => {
        if (open)
          setContainer(trigger.current?.closest("dialog") ?? document.body);
      }}
      name={name}
      required={required}
      disabled={disabled}
    >
      <Primitive.Trigger
        {...props}
        ref={trigger}
        className={`${s.trigger} ${className ?? ""}`}
        data-studio-select=""
        data-value={chosen}
        onKeyDownCapture={(event) => {
          props.onKeyDownCapture?.(event);
          if (
            event.currentTarget.hasAttribute("data-cell") &&
            event.altKey &&
            ["ArrowUp", "ArrowDown"].includes(event.key)
          )
            event.preventDefault();
        }}
      >
        <span className={s.value}>
          <Primitive.Value placeholder={placeholder} />
        </span>
        {indicator && (
          <Primitive.Icon className={s.arrow}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Primitive.Icon>
        )}
      </Primitive.Trigger>
      <Primitive.Portal container={container}>
        <Primitive.Content
          className={s.menu}
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          <Primitive.ScrollUpButton className={s.scroll}>
            ⌃
          </Primitive.ScrollUpButton>
          <Primitive.Viewport className={s.viewport}>
            {options.map((option) => (
              <Primitive.Item
                key={option.value}
                value={option.value || emptyKey}
                data-value={option.value}
                data-current={option.value === chosen || undefined}
                className={s.option}
                disabled={option.disabled}
                textValue={option.label}
              >
                <Primitive.ItemText>{option.label}</Primitive.ItemText>
                {option.value === chosen && (
                  <span className={s.check} aria-hidden="true">
                    ✓
                  </span>
                )}
              </Primitive.Item>
            ))}
          </Primitive.Viewport>
          <Primitive.ScrollDownButton className={s.scroll}>
            ⌄
          </Primitive.ScrollDownButton>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
