import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, gameApi } from "@/data/api";
import type { Game, GameAction } from "@/shared/types";

type DecisionRequest = Parameters<typeof gameApi.action>[0];

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
    mutationFn: async ({
      request,
      reconcile,
    }: {
      request: DecisionRequest;
      reconcile?: boolean;
    }) => {
      if (reconcile) {
        const latest = await gameApi.current();
        if (latest?.id !== request.gameId) {
          throw new ApiError(
            "La partida cambió. Se recuperará el estado más reciente.",
            409,
          );
        }
      }
      // El servidor comprueba el recibo antes de validar la versión.
      return gameApi.action(request);
    },
    retry: (count, error) =>
      error instanceof ApiError && error.status === 0 && count < 1,
    onSuccess: (game) => client.setQueryData(["game"], game),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409)
        void client.invalidateQueries({ queryKey: ["game"] });
    },
  });
  function decide(decision: GameAction, onSuccess?: (game: Game) => void) {
    const game = current.data;
    if (!game || action.isPending) return;
    action.mutate(
      {
        request: {
          gameId: game.id,
          expectedVersion: game.version,
          requestId: crypto.randomUUID(),
          action: decision,
        },
      },
      { onSuccess },
    );
  }
  function retryAnswer(onSuccess: (game: Game) => void) {
    const request = action.variables?.request;
    if (!action.isError || request?.action.type !== "answerQuestion") return;
    action.mutate({ request, reconcile: true }, { onSuccess });
  }

  return {
    retryAnswer,
    actionConflict:
      action.error instanceof ApiError && action.error.status === 409,
    catalog,
    current,
    create,
    action,
    decide,
    pending: action.isPending || create.isPending,
  };
}
