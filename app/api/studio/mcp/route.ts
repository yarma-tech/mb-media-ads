import {
  authenticate,
  execute,
  state,
  StudioError,
} from "@/lib/campaign-studio/workspace/server";
import { CommandSchema } from "@/lib/campaign-studio/workspace/commands";
import { z } from "zod";
export const maxDuration = 60;
const hidden = new Set([
  "decide",
  "publish",
  "stop",
  "reopen",
  "invite",
  "agent",
  "member",
  "revoke_agent",
  "undo",
]);
const agentCommands = z.union(
  CommandSchema.options.filter(
    (o) => !hidden.has(o.shape.type.value),
  ) as unknown as [
    (typeof CommandSchema.options)[0],
    (typeof CommandSchema.options)[1],
  ],
);
export async function POST(request: Request) {
  let id: unknown = null;
  try {
    const origin = request.headers.get("origin");
    if (
      origin &&
      origin !== new URL(process.env.STUDIO_URL ?? request.url).origin
    )
      throw new StudioError("Origine interdite.", 403);
    const identity = await authenticate(request);
    const actor = {
      ...identity,
      kind: "agent" as const,
      role: "preparer" as const,
    };
    const msg = await request.json();
    id = msg.id ?? null;
    if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string")
      return Response.json(
        {
          jsonrpc: "2.0",
          id,
          error: { code: -32600, message: "Requête JSON-RPC invalide." },
        },
        { status: 400 },
      );
    const respond = (result: unknown) =>
      Response.json({ jsonrpc: "2.0", id, result });
    switch (msg.method) {
      case "initialize":
        return respond({
          protocolVersion: "2025-03-26",
          serverInfo: { name: "mb-media-studio", version: "1.0.0" },
          capabilities: { tools: {} },
        });
      case "notifications/initialized":
        return new Response(null, { status: 202 });
      case "ping":
        return respond({});
      case "tools/list":
        return respond({
          tools: [
            {
              name: "studio_read",
              description:
                "Lire campagnes, médias, catalogue et statuts du studio.",
              inputSchema: {
                type: "object",
                properties: {},
                additionalProperties: false,
              },
            },
            {
              name: "studio_prepare",
              description:
                "Créer et préparer les annonces. Pour une modification : acquérir un verrou, lire la révision, éditer, puis libérer le verrou. Approbation et On air interdits.",
              inputSchema: {
                type: "object",
                properties: { command: z.toJSONSchema(agentCommands) },
                required: ["command"],
                additionalProperties: false,
              },
            },
          ],
        });
      case "tools/call": {
        try {
          if (!["studio_read", "studio_prepare"].includes(msg.params?.name))
            throw new Error("Outil inconnu.");
          const command = msg.params?.arguments?.command;
          if (
            msg.params.name === "studio_prepare" &&
            (hidden.has(command?.type) ||
              (command?.type === "edit" && command.source !== "configuration"))
          )
            throw new Error("Opération réservée à un humain.");
          const result =
            msg.params.name === "studio_read"
              ? await state(actor)
              : await execute(command, actor);
          return respond({
            content: [{ type: "text", text: JSON.stringify(result) }],
            isError: false,
          });
        } catch (e) {
          return respond({
            content: [{ type: "text", text: (e as Error).message }],
            isError: true,
          });
        }
      }
      default:
        return Response.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: "Méthode inconnue." },
        });
    }
  } catch (e) {
    return Response.json(
      {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32000,
          message: e instanceof Error ? e.message : "Erreur serveur",
        },
      },
      { status: e instanceof StudioError ? e.status : 400 },
    );
  }
}
