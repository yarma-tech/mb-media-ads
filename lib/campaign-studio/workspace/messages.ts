import type { DetailedError } from "tus-js-client";

type MessageContext =
  "signin" | "refresh" | "command" | "transfer" | "verification" | "preview";

const networkMessages: Record<MessageContext, string> = {
  signin:
    "Connexion impossible. Vérifiez votre connexion internet, puis réessayez.",
  refresh:
    "Impossible d’actualiser le studio. Vérifiez votre connexion internet, puis actualisez la page.",
  command:
    "Impossible de confirmer l’opération. Vérifiez son résultat dans le studio avant de réessayer.",
  transfer:
    "Transfert interrompu. Vérifiez votre connexion internet, puis déposez à nouveau le même fichier pour reprendre.",
  verification:
    "Vérification indisponible. Vérifiez votre connexion internet, puis cliquez sur « Vérifier le transfert ».",
  preview:
    "Aperçu indisponible. Vérifiez votre connexion internet, puis cliquez sur « Recharger l’aperçu ».",
};

// Presentation only: callers retain the original error and existing retry policy.
export function workspaceErrorMessage(
  error: unknown,
  context: MessageContext,
): string {
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Une erreur est survenue.";
  const isNetworkMessage = (value: string) =>
    /^(Failed to fetch|fetch failed|Load failed|NetworkError when attempting to fetch resource\.?)$/i.test(
      value.trim(),
    );
  if (/^tus: /i.test(message)) {
    const details =
      error && typeof error === "object"
        ? (error as Partial<DetailedError>)
        : null;
    const status =
      typeof details?.originalResponse?.getStatus === "function"
        ? details.originalResponse.getStatus()
        : undefined;
    // An actual HTTP refusal takes precedence over any nested network cause.
    if (status === 401 || status === 403)
      return "Transfert refusé. Vérifiez vos droits d’accès et reconnectez-vous si nécessaire.";
    if (status === 409)
      return "Conflit de transfert. Actualisez la page pour vérifier l’état du fichier avant de reprendre.";
    if (status !== undefined && status >= 500)
      return "Le serveur n’a pas pu terminer le transfert. Vérifiez l’état du fichier dans la bibliothèque avant de reprendre.";
    if (
      status === 0 ||
      (status === undefined &&
        isNetworkMessage(details?.causingError?.message ?? ""))
    )
      return networkMessages[context];
    // Do not surface TUS request URLs, response bodies, signatures or tokens.
    return "Le transfert n’a pas pu être confirmé. Vérifiez le fichier sélectionné et son état dans la bibliothèque.";
  }
  if (isNetworkMessage(message)) return networkMessages[context];
  return message;
}

export function loginErrorMessage(message: string): string {
  return message === "Connectez-vous pour accéder au studio."
    ? ""
    : workspaceErrorMessage(message, "signin");
}
