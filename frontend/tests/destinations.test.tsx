import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AtlasMap } from "@/presentation/components/game/atlas-map";
import type { City } from "@/shared/types";
import { gameApi } from "@/data/api";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const cities: City[] = [
  {
    id: "madrid",
    name: "Madrid",
    country: "España",
    region: "europe",
    coordinates: [-3.69, 40.41],
    tagline: "",
    description: "",
    landmark: "",
    stamp: "",
  },
];

describe("Selección accesible del mapa", () => {
  it("empieza sin selección y permite elegir con un control nativo", () => {
    const choose = vi.fn();
    render(<AtlasMap cities={cities} selectedId={null} onSelect={choose} />);
    const control = screen.getByRole("combobox", {
      name: "Elegir ciudad en el mapa",
    });
    expect(control).toHaveValue("");
    fireEvent.change(control, { target: { value: "madrid" } });
    expect(choose).toHaveBeenCalledWith("madrid");
  });
  it("no permite elegir ciudades bloqueadas", () => {
    const choose = vi.fn();
    render(
      <AtlasMap
        cities={cities.map((city) => ({ ...city, mapStatus: "locked" }))}
        selectedId={null}
        onSelect={choose}
      />,
    );
    const control = screen.getByRole("combobox", {
      name: "Elegir ciudad en el mapa",
    });
    expect(screen.getByRole("option", { name: "Madrid" })).toBeDisabled();
    fireEvent.change(control, { target: { value: "madrid" } });
    expect(choose).not.toHaveBeenCalled();
  });
});

describe("Errores de sincronización", () => {
  it("interpreta 404 como ausencia de partida, sin esconder otros fallos", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Sin partida" }), {
          status: 404,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Servidor no disponible" }), {
          status: 503,
        }),
      );
    await expect(gameApi.current()).resolves.toBeNull();
    await expect(gameApi.current()).rejects.toThrow("Servidor no disponible");
  });
});
