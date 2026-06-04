export function isTableRowInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('input, select, textarea, button, a, [draggable="true"]'))
}

export const insertAnchorRowClass =
  'bg-amber-500/10 ring-2 ring-inset ring-amber-400/80 shadow-[inset_0_3px_0_0_rgba(251,191,36,0.85)]'
