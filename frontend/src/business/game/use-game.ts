import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, gameApi } from "@/data/api";
import type { GameAction } from "@/shared/types";

export function useGame() {
  const client = useQueryClient();
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: gameApi.catalog });
  const current = useQuery({
    queryKey: ["game"],
    queryFn: gameApi.current,
    enabled: catalog.isSuccess,
  });
  const create = useMutation({
    mutationFn: gameApi.create,
    retry: (count, error) =>
      error instanceof ApiError && error.status === 0 && count < 1,
    onSuccess: (game) => client.setQueryData(["game"], game),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409)
        void client.invalidateQueries({ queryKey: ["game"] });
    },
  });
  const action = useMutation({
    mutationFn: gameApi.action,
    retry: (count, error) =>
      error instanceof ApiError && error.status === 0 && count < 1,
    onSuccess: (game) => client.setQueryData(["game"], game),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409)
        void client.invalidateQueries({ queryKey: ["game"] });
    },
  });
  function decide(decision: GameAction) {
    const game = current.data;
    if (!game || action.isPending) return;
    action.mutate({
      gameId: game.id,
      expectedVersion: game.version,
      requestId: crypto.randomUUID(),
      action: decision,
    });
  }
  return {
    catalog,
    current,
    create,
    action,
    decide,
    pending: action.isPending || create.isPending,
  };
}
