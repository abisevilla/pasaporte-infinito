import type { City, Game } from "@/shared/types";
import { Button } from "../ui/button";
import { LandmarkArt } from "./landmark-art";

type Destination = City & { mapStatus?: Game["cities"][number]["mapStatus"] };
const labels = {
  current: "Estás aquí",
  available: "Disponible",
  visited: "Visitada",
  locked: "Bloqueada",
  discarded: "Descartada",
};

export function DestinationPicker({
  cities,
  selectedId,
  onSelect,
  pending,
  onChoose,
  onMap,
  onBack,
  travel = false,
}: {
  cities: Destination[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  pending: boolean;
  onChoose: (id: string) => void;
  onMap: () => void;
  onBack: () => void;
  travel?: boolean;
}) {
  const selected = cities.find(
    (city) =>
      city.id === selectedId &&
      (!city.mapStatus || city.mapStatus === "available"),
  );
  return (
    <section className="screen destination-screen">
      <div className="screen-heading">
        <p className="eyebrow">
          {travel
            ? "Sello conseguido · Próximo tramo"
            : "Tu viaje, tus coordenadas"}
        </p>
        <h1 data-screen-title tabIndex={-1}>
          {travel ? "Traza el siguiente tramo" : "Elige dónde comienza todo"}
        </h1>
        <p className="screen-description">
          ↑ ↓ ← → eligen ciudad · Enter confirma tu viaje.
        </p>
      </div>
      <div className="destination-layout">
        <div
          className="city-choices"
          role="group"
          aria-label="Lista de destinos"
        >
          {cities.map((city) => (
            <Button
              key={city.id}
              variant="outline"
              data-choice
              disabled={
                pending || (!!city.mapStatus && city.mapStatus !== "available")
              }
              aria-label={`Seleccionar ${city.name}`}
              aria-pressed={selectedId === city.id}
              onClick={() => onSelect(city.id)}
            >
              <span>{city.name}</span>
              <small>
                {city.mapStatus ? labels[city.mapStatus] : city.country}
              </small>
            </Button>
          ))}
        </div>
        <article className="destination-preview">
          {selected ? (
            <>
              <LandmarkArt cityId={selected.id} />
              <div>
                <p className="eyebrow">{selected.country}</p>
                <h2>{selected.name}</h2>
                <p>{selected.landmark}</p>
                <p className="destination-tagline">{selected.tagline}</p>
              </div>
            </>
          ) : (
            <>
              <LandmarkArt cityId="paris" />
              <div>
                <h2>Un mundo por descubrir</h2>
                <p>
                  Elige una ciudad con las flechas o con un clic. Ningún origen
                  está preseleccionado.
                </p>
              </div>
            </>
          )}
        </article>
      </div>
      <div className="screen-actions">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button variant="outline" onClick={onMap}>
          Ver mapa
        </Button>
        <Button
          data-primary
          disabled={!selected || pending}
          onClick={() => selected && onChoose(selected.id)}
        >
          {pending
            ? "Guardando…"
            : travel
              ? "Viajar a esta ciudad"
              : "Comenzar mi viaje"}
        </Button>
      </div>
    </section>
  );
}
