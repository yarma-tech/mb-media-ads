import { describe, expect, it } from "vitest";
import { loginErrorMessage, workspaceErrorMessage } from "./messages";

describe("messages du studio", () => {
  it("distingue l’absence normale de session d’une vraie erreur de connexion", () => {
    expect(loginErrorMessage("Connectez-vous pour accéder au studio.")).toBe(
      "",
    );
    expect(loginErrorMessage("Invalid login credentials")).toBe(
      "Invalid login credentials",
    );
    expect(loginErrorMessage("Session expirée.")).toBe("Session expirée.");
  });

  it.each([
    "Failed to fetch",
    "Load failed",
    "NetworkError when attempting to fetch resource.",
  ])("rend une panne réseau compréhensible : %s", (message) => {
    expect(workspaceErrorMessage(new TypeError(message), "signin")).toBe(
      "Connexion impossible. Vérifiez votre connexion internet, puis réessayez.",
    );
  });

  it("ne conseille pas de répéter aveuglément une opération dont le résultat est incertain", () => {
    expect(
      workspaceErrorMessage(new TypeError("Failed to fetch"), "command"),
    ).toBe(
      "Impossible de confirmer l’opération. Vérifiez son résultat dans le studio avant de réessayer.",
    );
  });

  it("remplace les détails techniques TUS par une reprise explicite du même fichier", () => {
    expect(
      workspaceErrorMessage(
        Object.assign(new Error("tus: failed to upload chunk"), {
          causingError: new TypeError("Failed to fetch"),
          originalResponse: null,
        }),
        "transfer",
      ),
    ).toBe(
      "Transfert interrompu. Vérifiez votre connexion internet, puis déposez à nouveau le même fichier pour reprendre.",
    );
  });

  it("conserve les messages métier de conflit et de conformité", () => {
    for (const message of [
      "Annonce modifiée par une autre personne.",
      "Ce média n’est pas conforme au canal.",
      "50 Mo maximum par fichier.",
    ]) {
      expect(workspaceErrorMessage(new Error(message), "transfer")).toBe(
        message,
      );
      expect(workspaceErrorMessage(new Error(message), "command")).toBe(
        message,
      );
    }
  });

  it("permet de revérifier un média ou son aperçu sans recommander un second transfert", () => {
    expect(
      workspaceErrorMessage(new TypeError("Failed to fetch"), "verification"),
    ).toContain("Vérifier le transfert");
    expect(
      workspaceErrorMessage(new TypeError("Failed to fetch"), "preview"),
    ).toContain("Recharger l’aperçu");
  });
});

describe("présentation des erreurs TUS", () => {
  const tusError = (status: number) =>
    Object.assign(
      new Error(
        "tus: unexpected response while creating upload, url: https://secret.test/?token=DO_NOT_SHOW, response text: DO_NOT_SHOW",
      ),
      { originalResponse: { getStatus: () => status } },
    );

  it.each([401, 403])(
    "distingue un refus d’accès HTTP %s d’une panne réseau",
    (status) => {
      expect(workspaceErrorMessage(tusError(status), "transfer")).toBe(
        "Transfert refusé. Vérifiez vos droits d’accès et reconnectez-vous si nécessaire.",
      );
    },
  );

  it("explique un conflit HTTP 409 sans inviter à recréer le transfert", () => {
    expect(workspaceErrorMessage(tusError(409), "transfer")).toBe(
      "Conflit de transfert. Actualisez la page pour vérifier l’état du fichier avant de reprendre.",
    );
  });

  it.each([
    "tus: invalid or missing Location header",
    "tus: no file or stream to upload provided",
  ])("ne suppose pas une panne réseau : %s", (message) => {
    const result = workspaceErrorMessage(new Error(message), "transfer");
    expect(result).toBe(
      "Le transfert n’a pas pu être confirmé. Vérifiez le fichier sélectionné et son état dans la bibliothèque.",
    );
    expect(result).not.toContain("internet");
  });

  it("n’affiche aucun détail technique de réponse HTTP inconnue", () => {
    const result = workspaceErrorMessage(tusError(422), "transfer");
    expect(result).not.toMatch(/DO_NOT_SHOW|secret.test|tus:|internet/);
    expect(result).toContain("Vérifiez le fichier sélectionné");
  });

  it("identifie une absence de réponse HTTP et un refus serveur sans les confondre", () => {
    expect(workspaceErrorMessage(tusError(0), "transfer")).toContain(
      "connexion internet",
    );
    expect(workspaceErrorMessage(tusError(503), "transfer")).toBe(
      "Le serveur n’a pas pu terminer le transfert. Vérifiez l’état du fichier dans la bibliothèque avant de reprendre.",
    );
  });
});
