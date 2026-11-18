import type { ReactElement } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "./button";

export function ConfirmDialog({
  onConfirm,
  disabled,
  trigger,
  confirmOrigin = false,
}: {
  onConfirm: () => void;
  disabled: boolean;
  trigger?: ReactElement;
  confirmOrigin?: boolean;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="small" disabled={disabled}>
            Nuevo itinerario
          </Button>
        )}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content">
          <AlertDialog.Title>¿Empezar un nuevo viaje?</AlertDialog.Title>
          <AlertDialog.Description>
            {confirmOrigin
              ? "Comenzar en este origen sustituirá tu partida actual."
              : "La partida actual se sustituirá al confirmar una nueva ciudad de origen. Podrás elegir cualquiera de los seis destinos."}
          </AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel asChild>
              <Button variant="ghost">Conservar viaje</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={confirmOrigin ? "danger" : "default"}
                onClick={onConfirm}
              >
                {confirmOrigin ? "Sustituir partida" : "Elegir nuevo origen"}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
