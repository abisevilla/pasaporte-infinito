import type { components } from "./api-schema";

export type City = components["schemas"]["City"];
export type Game = components["schemas"]["GameSnapshot"];
export type Catalog = components["schemas"]["CatalogResponse"];
export type GameAction = components["schemas"]["ActionRequest"]["action"];
export type Scene = components["schemas"]["Scene"];
