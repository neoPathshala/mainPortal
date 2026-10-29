"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "size"> & { compactMenu?: boolean };
type Option = { value: string; label: string; disabled: boolean };
function labelText(node: React.ReactNode): string {
  return React.Children.toArray(node).map((child) => typeof child === "string" || typeof child === "number" ? String(child) : React.isValidElement<{ children?: React.ReactNode }>(child) ? labelText(child.props.children) : "").join("");
}
function collect(node: React.ReactNode): Option[] {
  return React.Children.toArray(node).flatMap((child): Option[] => {
    if (!React.isValidElement<{ value?: string | number; children?: React.ReactNode; disabled?: boolean }>(child)) return [];
    if (child.type === "option") { const label = labelText(child.props.children); return [{ value: String(child.props.value ?? label), label, disabled: !!child.props.disabled }]; }
    return collect(child.props.children);
  });
}

/** Single-select combobox. Options stay in React; no native select menu is rendered. */
export function Select({ compactMenu = false, children, value, defaultValue, onChange, className, disabled, required, name, id, ...props }: Props) {
  const options = collect(children);
  const [internal, setInternal] = React.useState(String(defaultValue ?? options[0]?.value ?? ""));
  const current = String(value ?? internal);
  const selected = options.findIndex((option) => option.value === current);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0, maxHeight: 288 });
  const trigger = React.useRef<HTMLButtonElement>(null);
  const menu = React.useRef<HTMLDivElement>(null);
  const typeahead = React.useRef({ text: "", time: 0 });
  const listId = React.useId();
  const selectedOption = options[selected];
  function show() { if (!disabled) { setActive(selected >= 0 && !options[selected].disabled ? selected : Math.max(0, options.findIndex((option) => !option.disabled))); setOpen(true); } }
  function choose(index: number) {
    const option = options[index]; if (!option || option.disabled) return;
    setInternal(option.value);
    // Keep the standard value-based event contract used by existing form handlers.
    const target = { value: option.value, name: name || "", id: id || "" } as HTMLSelectElement;
    onChange?.({ target, currentTarget: target } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false); trigger.current?.focus();
  }
  function move(direction: number) {
    for (let step = 1; step <= options.length; step++) { const next = (active + direction * step + options.length) % options.length; if (!options[next]?.disabled) { setActive(next); break; } }
  }
  React.useEffect(() => {
    if (!open) return;
    function reposition() {
      const rect = trigger.current?.getBoundingClientRect(); if (!rect) return;
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      const height = Math.min(288, Math.max(80, below > 160 || below > above ? below : above));
      const width = Math.min(Math.max(rect.width, compactMenu ? 104 : 180), window.innerWidth - 24);
      setPosition({ top: below > 160 || below > above ? rect.bottom + 6 : rect.top - height - 6, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), width, maxHeight: height });
    }
    function outside(event: PointerEvent) { if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false); }
    function focusOutside(event: FocusEvent) { if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false); }
    reposition(); document.addEventListener("pointerdown", outside); document.addEventListener("focusin", focusOutside); window.addEventListener("resize", reposition); window.addEventListener("scroll", reposition, true);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", focusOutside); window.removeEventListener("resize", reposition); window.removeEventListener("scroll", reposition, true); };
  }, [open, compactMenu]);
  React.useEffect(() => { if (open) menu.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" }); }, [active, open]);
  function keyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Tab") { setOpen(false); return; }
    if (event.key === "Escape") { if (open) event.stopPropagation(); event.preventDefault(); setOpen(false); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!open) { show(); return; }
      if (event.key === "ArrowDown") move(1);
      else if (event.key === "ArrowUp") move(-1);
      else if (event.key === "Home") setActive(Math.max(0, options.findIndex((option) => !option.disabled)));
      else if (event.key === "End") { for (let i = options.length - 1; i >= 0; i--) if (!options[i].disabled) { setActive(i); break; } }
      else choose(active);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now(); typeahead.current = { text: (now - typeahead.current.time > 700 ? "" : typeahead.current.text) + event.key.toLowerCase(), time: now };
      const index = options.findIndex((option) => !option.disabled && option.label.toLowerCase().startsWith(typeahead.current.text));
      if (index >= 0) { if (open) setActive(index); else choose(index); }
    }
  }
  return <div className="relative w-full"><button ref={trigger} id={id} type="button" role="combobox" aria-expanded={open} aria-controls={listId} aria-haspopup="listbox" aria-activedescendant={open ? `${listId}-${active}` : undefined} aria-required={required} aria-label={props["aria-label"] || (!id && !props["aria-labelledby"] ? "Select an option" : undefined)} aria-labelledby={props["aria-labelledby"]} aria-describedby={props["aria-describedby"]} aria-invalid={props["aria-invalid"]} disabled={disabled} onClick={() => open ? setOpen(false) : show()} onKeyDown={keyDown} className={cn("flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm text-foreground shadow-xs transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50", className)}><span className="truncate">{selectedOption?.label || "Select…"}</span><ChevronDown size={15} className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} /></button>{name && <input type="hidden" name={name} value={current} disabled={disabled} />}{required && <input tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute inset-0 h-px w-px opacity-0" required disabled={disabled} value={current} onChange={() => {}} onInvalid={(event) => { event.preventDefault(); trigger.current?.focus(); show(); }} />}{open && createPortal(<div ref={menu} id={listId} role="listbox" aria-label={props["aria-label"] || "Options"} className="fixed z-[100] overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_12px_40px_#0002]" style={position}>{options.map((option, index) => <div key={`${option.value}-${index}`} id={`${listId}-${index}`} data-index={index} role="option" aria-selected={current === option.value} aria-disabled={option.disabled} onPointerMove={() => !option.disabled && setActive(index)} onPointerDown={(event) => event.preventDefault()} onClick={() => choose(index)} className={cn("flex cursor-pointer items-center gap-2 rounded-lg", compactMenu ? "px-2 py-1.5 text-xs" : "px-3 py-2.5 text-sm", active === index && "bg-muted", option.disabled && "pointer-events-none opacity-40", current === option.value && "font-medium text-primary")}><span className="flex-1">{option.label}</span>{current === option.value && <Check size={15} />}</div>)}</div>, document.fullscreenElement || trigger.current?.closest("dialog") || document.body)}</div>;
}
