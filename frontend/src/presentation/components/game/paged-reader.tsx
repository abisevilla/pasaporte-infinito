import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

// El texto se divide según el espacio real disponible, también al ampliar el navegador.
export function PagedReader({
  text,
  label = "Texto",
}: {
  text: string;
  label?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[]>([text]);
  const [pageIndex, setPageIndex] = useState(0);
  const current = Math.min(pageIndex, pages.length - 1);
  useEffect(() => {
    const area = viewport.current;
    const measure = probe.current;
    if (!area || !measure) return;
    function paginate() {
      if (!area || !measure || area.clientHeight < 1) return;
      const characters = Array.from(text);
      const nextPages: string[] = [];
      let start = 0;
      while (start < characters.length) {
        let low = start + 1;
        let high = characters.length;
        let end = low;
        while (low <= high) {
          const middle = Math.floor((low + high) / 2);
          measure.textContent = characters.slice(start, middle).join("");
          if (measure.scrollHeight <= area.clientHeight - 2) {
            end = middle;
            low = middle + 1;
          } else high = middle - 1;
        }
        // Conserva palabras completas cuando hay un espacio cercano al corte.
        const candidate = characters.slice(start, end).join("");
        const boundary = candidate.search(/\s+\S*$/);
        if (end < characters.length && boundary > candidate.length * 0.65)
          end = start + Array.from(candidate.slice(0, boundary + 1)).length;
        nextPages.push(characters.slice(start, end).join(""));
        start = end;
      }
      measure.textContent = "";
      setPages(nextPages.length ? nextPages : [""]);
    }
    const observer = new ResizeObserver(paginate);
    observer.observe(area);
    void document.fonts?.ready.then(paginate);
    return () => observer.disconnect();
  }, [text]);
  return (
    <section className="paged-reader" aria-label={label}>
      <div ref={viewport} className="reader-viewport">
        <div className="reader-copy" aria-live="polite">
          {pages[current]}
        </div>
        <div
          ref={probe}
          className="reader-copy reader-probe"
          aria-hidden="true"
        />
      </div>
      <nav className="reader-pagination" aria-label={`Páginas de ${label}`}>
        <Button
          variant="ghost"
          size="small"
          data-page-prev
          disabled={current === 0}
          onClick={() => setPageIndex(current - 1)}
          aria-label="Página de texto anterior"
        >
          ←
        </Button>
        <span aria-live="polite">
          {current + 1} / {pages.length}
        </span>
        <Button
          variant="ghost"
          size="small"
          data-page-next
          disabled={current === pages.length - 1}
          onClick={() => setPageIndex(current + 1)}
          aria-label="Página de texto siguiente"
        >
          →
        </Button>
      </nav>
    </section>
  );
}
