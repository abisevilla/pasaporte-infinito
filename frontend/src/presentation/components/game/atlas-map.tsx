import { useEffect, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import type { GeoPermissibleObjects } from "d3-geo";
import { Minus, Plus, RotateCcw } from "lucide-react";
import landData from "@/assets/land.geojson?raw";
import type { City, Game } from "@/shared/types";
import { Button } from "../ui/button";

type MapCity = City & { mapStatus?: Game["cities"][number]["mapStatus"] };
const land = JSON.parse(landData) as GeoPermissibleObjects;
const views = {
  atlantic: { label: "Atlántico", center: [-30, 40], scale: 285 },
  europe: { label: "Europa", center: [4, 45], scale: 1250 },
  usa: { label: "EE. UU.", center: [-76, 40], scale: 1800 },
};

export function AtlasMap({
  cities,
  selectedId,
  onSelect,
  disabled = false,
}: {
  cities: MapCity[];
  selectedId: string | null;
  onSelect: (cityId: string) => void;
  disabled?: boolean;
}) {
  const [view, setView] = useState<keyof typeof views>("atlantic");
  const svgRef = useRef<SVGSVGElement>(null);
  const layerRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const projection = geoMercator()
    .center(views[view].center as [number, number])
    .scale(views[view].scale)
    .translate([450, 215]);
  const path = geoPath(projection);
  useEffect(() => {
    if (!svgRef.current) return;
    const behavior = zoom<SVGSVGElement, unknown>()
      .extent([
        [0, 0],
        [900, 430],
      ])
      .scaleExtent([1, 5])
      .translateExtent([
        [-450, -215],
        [1350, 645],
      ])
      .on("zoom", (event) =>
        select(layerRef.current).attr("transform", event.transform.toString()),
      );
    zoomRef.current = behavior;
    const svg = select(svgRef.current);
    svg.call(behavior).call(behavior.transform, zoomIdentity);
    svg.on("dblclick.zoom", null);
    return () => {
      svg.on(".zoom", null);
    };
  }, [view]);
  function scaleMap(factor: number) {
    if (svgRef.current && zoomRef.current)
      select(svgRef.current).call(zoomRef.current.scaleBy, factor);
  }
  return (
    <section className="atlas" aria-label="Mapa de destinos">
      <div className="atlas-toolbar">
        <div className="map-tabs" role="group" aria-label="Vista del mapa">
          {Object.entries(views).map(([id, item]) => (
            <button
              key={id}
              aria-pressed={view === id}
              onClick={() => setView(id as keyof typeof views)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="map-hint">Desplaza y amplía para explorar</span>
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 900 430"
        className="world-map"
        aria-label="Atlas interactivo. También puedes elegir destino en la lista inferior."
      >
        <defs>
          <pattern
            id="map-grid"
            width="45"
            height="43"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M45 0H0V43"
              fill="none"
              stroke="currentColor"
              strokeWidth=".6"
              opacity=".12"
            />
          </pattern>
        </defs>
        <rect width="900" height="430" fill="var(--ocean)" />
        <g ref={layerRef}>
          <rect
            x="-1000"
            y="-500"
            width="3000"
            height="1500"
            fill="url(#map-grid)"
          />
          <path
            d={path(land) ?? ""}
            fill="var(--land)"
            stroke="var(--coast)"
            strokeWidth=".8"
          />
          {view === "atlantic" && (
            <text
              x="340"
              y="280"
              className="ocean-label"
              transform="rotate(-15 340 280)"
            >
              OCÉANO ATLÁNTICO
            </text>
          )}
          {cities.map((city) => {
            const point = projection(city.coordinates as [number, number]);
            if (!point) return null;
            const [x, y] = point;
            const enabled =
              !disabled && (!city.mapStatus || city.mapStatus === "available");
            const selected = city.id === selectedId;
            const left = ["madrid", "barcelona", "washington"].includes(
              city.id,
            );
            const labelY =
              city.id === "barcelona" ? 22 : city.id === "rome" ? 23 : -14;
            return (
              <g
                key={city.id}
                transform={`translate(${x},${y})`}
                className={`map-pin ${selected ? "selected" : ""} ${city.mapStatus ?? "available"}`}
                role="button"
                tabIndex={enabled ? 0 : -1}
                aria-disabled={!enabled}
                aria-label={`Elegir ${city.name}`}
                aria-pressed={selected}
                onClick={() => {
                  if (enabled) onSelect(city.id);
                }}
                onKeyDown={(event) => {
                  if (enabled && ["Enter", " "].includes(event.key)) {
                    event.preventDefault();
                    onSelect(city.id);
                  }
                }}
              >
                <circle r="17" className="pin-hit" />
                <circle r={selected ? 8 : 6} className="pin-dot" />
                <text
                  x={left ? -12 : 12}
                  y={labelY}
                  textAnchor={left ? "end" : "start"}
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </g>
        <g transform="translate(844 355)" className="compass">
          <path d="M0 35V-15M-12 0L0-15L12 0M-16 17H16" />
          <text x="0" y="-23" textAnchor="middle">
            N
          </text>
        </g>
      </svg>
      <div className="map-footer">
        <span>
          <i /> Destinos culturales · 6 ciudades
        </span>
        <div className="zoom-buttons">
          <Button
            variant="outline"
            size="icon"
            aria-label="Ampliar mapa"
            onClick={() => scaleMap(1.4)}
          >
            <Plus size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Reducir mapa"
            onClick={() => scaleMap(1 / 1.4)}
          >
            <Minus size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Restablecer mapa"
            onClick={() => {
              if (svgRef.current && zoomRef.current)
                select(svgRef.current).call(
                  zoomRef.current.transform,
                  zoomIdentity,
                );
            }}
          >
            <RotateCcw size={15} />
          </Button>
        </div>
      </div>
    </section>
  );
}
