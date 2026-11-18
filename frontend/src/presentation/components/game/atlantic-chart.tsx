import { geoGraticule10, geoMercator, geoPath } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import landData from "@/assets/land.geojson?raw";
import type { City } from "@/shared/types";

const projection = geoMercator()
  .center([-33, 45])
  .scale(335)
  .translate([330, 220])
  .clipExtent([
    [0, 0],
    [660, 440],
  ]);
const chartPath = geoPath(projection);
const coastlines = chartPath(JSON.parse(landData) as GeoPermissibleObjects);
const graticule = chartPath(geoGraticule10());

export function AtlanticChart({ cities }: { cities: City[] }) {
  return (
    <svg className="atlantic-chart" viewBox="0 0 660 440" aria-hidden="true">
      <path className="chart-grid" d={graticule ?? ""} />
      <path className="chart-land" d={coastlines ?? ""} />
      <text className="chart-label" x="330" y="248" textAnchor="middle">
        Océano Atlántico
      </text>
      {cities.map((city) => {
        const point = projection(city.coordinates);
        return point ? (
          <circle key={city.id} cx={point[0]} cy={point[1]} r="5" />
        ) : null;
      })}
    </svg>
  );
}
