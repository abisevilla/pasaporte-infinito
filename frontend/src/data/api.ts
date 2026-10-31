import type { Catalog, Game, GameAction } from "@/shared/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1/${path}`, {
      ...init,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(
      "No hay conexión con el servidor. Puedes reintentar cuando se restablezca.",
      0,
    );
  }
  const data = await response.json();
  if (!response.ok)
    throw new ApiError(
      data.detail ?? "No se pudo guardar la decisión.",
      response.status,
    );
  return data as T;
}

export const gameApi = {
  catalog: () => request<Catalog>("catalog"),
  current: async () => {
    try {
      return await request<Game>("games/current");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  create: (payload: {
    initialCityId: string;
    expectedGameId: string | null;
    requestId: string;
  }) =>
    request<Game>("games", { method: "POST", body: JSON.stringify(payload) }),
  action: (payload: {
    gameId: string;
    requestId: string;
    expectedVersion: number;
    action: GameAction;
  }) =>
    request<Game>("games/current/actions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
