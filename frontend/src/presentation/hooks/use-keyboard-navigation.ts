import { useEffect, useLayoutEffect, type RefObject } from "react";

type Options = {
  root: RefObject<HTMLElement | null>;
  screenKey: string;
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
  onBack,
  onHelp,
  onJournal,
}: Options) {
  useLayoutEffect(() => {
    root.current
      ?.querySelector<HTMLElement>("[data-screen-title]")
      ?.focus({ preventScroll: true });
  }, [root, screenKey]);

  useEffect(() => {
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
        target.closest(
          'input:not([type="radio"]), textarea, select, [contenteditable="true"]',
        )
      )
        return;
      // Radix conserva el control de foco y Escape dentro de sus diálogos.
      const dialog = document.querySelector<HTMLElement>(
        '[role="alertdialog"], [role="dialog"]',
      );
      const scope = dialog ?? root.current;
      if (!scope) return;
      const controls = Array.from(
        scope.querySelectorAll<HTMLElement>(
          'button, a[href], input[type="radio"], [role="button"][tabindex]',
        ),
      ).filter(available);
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
        const items = choices.length ? choices : controls;
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
        items[next].focus({ preventScroll: true });
        if (choices.length) items[next].click();
      };
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        if (event.key === "ArrowUp" || event.key === "ArrowDown")
          move(event.key === "ArrowDown" ? 1 : -1);
        else {
          const direction = event.key === "ArrowRight" ? 1 : -1;
          if (
            !activate(
              direction > 0 ? "[data-page-next]" : "[data-page-prev]",
            ) &&
            !activate(
              direction > 0 ? "[data-screen-next]" : "[data-screen-prev]",
            )
          )
            move(direction);
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
        !dialog &&
        ["Escape", "Backspace", "h", "H", "?", "j", "J"].includes(event.key)
      ) {
        event.preventDefault();
        if (event.repeat) return;
        if (event.key === "Escape" || event.key === "Backspace") onBack();
        else if (event.key.toLowerCase() === "j") onJournal();
        else onHelp();
      } else if (event.key === "PageDown" || event.key === "PageUp") {
        event.preventDefault();
        activate(
          event.key === "PageDown" ? "[data-page-next]" : "[data-page-prev]",
        );
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        move(1, event.key === "Home" ? "first" : "last");
      } else if (
        event.key === " " &&
        !target.closest("button, input, a[href]")
      ) {
        event.preventDefault();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [root, onBack, onHelp, onJournal]);
}
