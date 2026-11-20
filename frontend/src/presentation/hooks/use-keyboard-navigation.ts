import { useLayoutEffect, type RefObject } from "react";

type Options = {
  root: RefObject<HTMLElement | null>;
  screenKey: string;
  returnFocusRef: RefObject<string | null>;
  shortcutsEnabled: boolean;
  onBack: () => void;
  onHelp: () => void;
  onJournal: () => void;
};

function available(element: HTMLElement) {
  return (
    element.getClientRects().length > 0 &&
    !element.matches(':disabled, [aria-disabled="true"]')
  );
}

export function useKeyboardNavigation({
  root,
  screenKey,
  returnFocusRef,
  shortcutsEnabled,
  onBack,
  onHelp,
  onJournal,
}: Options) {
  useLayoutEffect(() => {
    const heading = root.current?.querySelector<HTMLElement>(
      "[data-screen-title]",
    );
    if (!heading) return;
    const candidate = returnFocusRef.current
      ? document.getElementById(returnFocusRef.current)
      : null;
    returnFocusRef.current = null;
    (candidate && available(candidate) ? candidate : heading).focus();
  }, [root, screenKey, returnFocusRef]);

  useLayoutEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const target = event.target as HTMLElement;
      if (
        event.key !== "Escape" &&
        target.closest(
          'input:not([type="radio"]), textarea, select, [contenteditable="true"]',
        )
      )
        return;
      // Radix conserva el control de foco y Escape dentro de sus diálogos.
      const dialog = document.querySelector<HTMLElement>(
        '[role="alertdialog"], [role="dialog"]',
      );
      if (dialog) return;
      const scope = root.current;
      if (!scope) return;
      const atHeading = target.matches("[data-screen-title]");
      const inChoices = atHeading || !!target.closest("[data-choice]");
      const inPager = !!target.closest(".paged-reader");
      const choices = Array.from(
        scope.querySelectorAll<HTMLElement>("[data-choice]"),
      ).filter(available);
      const activate = (selector: string) => {
        const button = Array.from(
          scope.querySelectorAll<HTMLElement>(selector),
        ).find(available);
        if (!button) return false;
        button.click();
        return true;
      };
      const move = (direction: number, edge?: "first" | "last") => {
        const items = choices;
        if (!items.length) return;
        const index = items.indexOf(document.activeElement as HTMLElement);
        const next =
          edge === "first"
            ? 0
            : edge === "last"
              ? items.length - 1
              : index < 0
                ? direction > 0
                  ? 0
                  : items.length - 1
                : (index + direction + items.length) % items.length;
        items[next].focus();
        items[next].click();
      };
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        if (!inChoices || !choices.length) return;
        event.preventDefault();
        move(event.key === "ArrowDown" ? 1 : -1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const forward = event.key === "ArrowRight";
        const hasScreenNavigation = scope.querySelector(
          "[data-screen-next], [data-screen-prev]",
        );
        if (inPager || (atHeading && !hasScreenNavigation && !choices.length)) {
          if (activate(forward ? "[data-page-next]" : "[data-page-prev]"))
            event.preventDefault();
        } else if (inChoices && choices.length) {
          event.preventDefault();
          move(forward ? 1 : -1);
        } else if (
          atHeading ||
          target.matches("[data-screen-next], [data-screen-prev]")
        ) {
          if (activate(forward ? "[data-screen-next]" : "[data-screen-prev]"))
            event.preventDefault();
        }
      } else if (event.key === "Enter") {
        if (event.repeat) {
          event.preventDefault();
          return;
        }
        if (
          target.closest("[data-choice]") ||
          !target.closest("button, a[href], summary")
        ) {
          event.preventDefault();
          activate("[data-primary]");
        }
      } else if (
        ["Escape", "Backspace"].includes(event.key) ||
        (shortcutsEnabled && ["h", "H", "?", "j", "J"].includes(event.key))
      ) {
        event.preventDefault();
        if (event.repeat) return;
        if (event.key === "Escape" || event.key === "Backspace") onBack();
        else if (event.key.toLowerCase() === "j") onJournal();
        else onHelp();
      } else if (event.key === "PageDown" || event.key === "PageUp") {
        if (
          (atHeading || inPager) &&
          activate(
            event.key === "PageDown" ? "[data-page-next]" : "[data-page-prev]",
          )
        )
          event.preventDefault();
      } else if (
        inChoices &&
        choices.length &&
        (event.key === "Home" || event.key === "End")
      ) {
        event.preventDefault();
        move(1, event.key === "Home" ? "first" : "last");
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [root, onBack, onHelp, onJournal, shortcutsEnabled]);
}
