import { Compass } from "lucide-react";

// Decoración de cierre: se reproduce al montar la pantalla y no modifica la partida.
export function JourneyEndArt() {
  return (
    <div className="journey-end-art" aria-hidden="true">
      <svg className="journey-end-route" viewBox="0 0 420 300" fill="none">
        <path
          className="journey-end-line"
          d="M30 230C85 270 100 95 170 120S295 265 385 70"
          pathLength="1"
        />
        <circle className="journey-end-marker" cx="385" cy="70" r="9" />
        <circle cx="30" cy="230" r="4" fill="currentColor" />
      </svg>
      <div className="journey-end-book">
        <div className="journey-end-pages" />
        <div className="journey-end-cover">
          <div className="journey-end-cover-border">
            <Compass strokeWidth={1.2} />
            <span>
              PASAPORTE
              <br />
              INFINITO
            </span>
            <span className="journey-end-star">✦</span>
          </div>
        </div>
      </div>
    </div>
  );
}
