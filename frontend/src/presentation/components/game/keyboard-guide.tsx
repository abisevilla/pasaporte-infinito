export function KeyboardGuide({
  shortcutsEnabled,
}: {
  shortcutsEnabled: boolean;
}) {
  return (
    <div className="keyboard-guide" aria-label="Controles de teclado">
      <span>
        <kbd>↑</kbd>
        <kbd>↓</kbd> elegir
      </span>
      <span>
        <kbd>←</kbd>
        <kbd>→</kbd> avanzar / volver
      </span>
      <span>
        <kbd>Enter</kbd> confirmar
      </span>
      <span>
        <kbd>Esc</kbd> volver
      </span>
      {shortcutsEnabled && (
        <span>
          <kbd>H</kbd> ayuda · <kbd>J</kbd> cuaderno
        </span>
      )}
    </div>
  );
}
