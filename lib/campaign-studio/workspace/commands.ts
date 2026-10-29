import { MEDIA_LIMIT_BYTES } from "./upload-limits";
import { z } from "zod";
export const ChannelSchema = z.enum([
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "display",
  "google",
]);
const text = z.string().max(10000);
const uuid = z.uuid();
export const FieldsSchema = z
  .object({
    theme: z.string().trim().max(200),
    format: z.string().min(1).max(50),
    name: z.string().max(200),
    copy: text,
    headline: z.string().max(500),
    headlines: z.array(z.string().max(500)).max(15),
    descriptions: z.array(z.string().max(1000)).max(4),
    cta: z.string().max(80),
    url: z.string().max(2048),
    mediaId: uuid.nullable(),
    path1: z.string().max(100),
    path2: z.string().max(100),
  })
  .partial()
  .strict();
const target = { campaignId: uuid, revision: z.number().int().nonnegative() };
export const CommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("create_share_link"), ...target }).strict(),
  z.object({ type: z.literal("revoke_share_link"), ...target }).strict(),
  z
    .object({
      type: z.literal("delete_campaign"),
      ...target,
      confirmationName: z.string().min(1).max(200),
    })
    .strict(),
  z.object({
    type: z.literal("create_campaign"),
    name: z.string().trim().min(1).max(200),
    fields: z
      .object({
        brandId: uuid.nullable(),
        defaultUrl: z.string().max(2048),
        startDate: z.iso.date().nullable(),
        endDate: z.iso.date().nullable(),
      })
      .partial()
      .strict()
      .optional(),
  }),
  z.object({
    type: z.literal("campaign"),
    ...target,
    fields: z
      .object({
        name: z.string().trim().min(1).max(200),
        brandId: uuid.nullable(),
        defaultUrl: z.string().max(2048),
        startDate: z.iso.date().nullable(),
        endDate: z.iso.date().nullable(),
        channels: z.array(ChannelSchema).max(6),
      })
      .partial()
      .strict(),
  }),
  z.object({
    type: z.literal("create_brand"),
    name: z.string().trim().min(1).max(200),
    website: z.string().max(2048),
    logo: z.string().max(2048),
  }),
  z.object({
    type: z.literal("add"),
    ...target,
    channel: ChannelSchema,
    formats: z.array(z.string().max(50)).min(1).max(20),
    mediaId: uuid.optional(),
  }),
  z.object({
    type: z.literal("add_media_batch"),
    ...target,
    mediaIds: z.array(uuid).min(1).max(200),
    channels: z
      .array(ChannelSchema.exclude(["google"]))
      .min(1)
      .max(5),
  }),
  z.object({
    type: z.literal("edit"),
    ...target,
    adId: uuid,
    fields: FieldsSchema,
    source: z.enum(["configuration", "validation"]),
    unlocked: z.boolean().default(false),
    lockToken: uuid,
  }),
  z.object({
    type: z.literal("batch"),
    ...target,
    adIds: z.array(uuid).min(1).max(200),
    fields: FieldsSchema,
    replace: z.boolean().default(false),
  }),
  z.object({
    type: z.literal("submit"),
    ...target,
    adIds: z.array(uuid).min(1).max(200),
  }),
  z.object({
    type: z.literal("decide"),
    ...target,
    adId: uuid,
    status: z.enum(["approved", "changes_requested"]),
    comment: z.string().max(4000).default(""),
  }),
  z.object({ type: z.literal("undo"), ...target, adId: uuid }),
  z.object({ type: z.literal("publish"), ...target, adId: uuid }),
  z.object({ type: z.literal("version"), ...target, adId: uuid }),
  z.object({ type: z.literal("duplicate"), ...target, adId: uuid }),
  z.object({
    type: z.literal("move_ad"),
    ...target,
    adId: uuid,
    beforeId: uuid.nullable(),
  }),
  z.object({
    type: z.literal("handle_comment"),
    ...target,
    adId: uuid,
    commentIndex: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal("stop"), ...target, adId: uuid }),
  z.object({ type: z.literal("reopen"), ...target, endDate: z.iso.date() }),
  z.object({
    type: z.literal("lock"),
    campaignId: uuid,
    adId: uuid,
    token: uuid,
  }),
  z.object({
    type: z.literal("release"),
    campaignId: uuid,
    adId: uuid,
    token: uuid,
  }),
  z.object({
    type: z.literal("upload"),
    ...target,
    channel: ChannelSchema,
    channels: z
      .array(ChannelSchema.exclude(["google"]))
      .min(1)
      .max(5)
      .optional(),
    name: z.string().min(1).max(255),
    mime: z.enum([
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ]),
    bytes: z.number().int().min(1).max(MEDIA_LIMIT_BYTES),
  }),
  z.object({ type: z.literal("resume_upload"), ...target, mediaId: uuid }),
  z.object({ type: z.literal("verify_media"), ...target, mediaId: uuid }),
  z.object({
    type: z.literal("agent"),
    name: z.string().trim().min(1).max(100),
  }),
  z.object({
    type: z.literal("member"),
    memberId: uuid,
    role: z.enum(["preparer", "validator"]),
    access: z.enum(["active", "revoked"]),
  }),
  z.object({ type: z.literal("revoke_agent"), agentId: uuid }),
  z.object({
    type: z.literal("invite"),
    email: z.email(),
    name: z.string().trim().min(1).max(100),
    role: z.enum(["preparer", "validator"]),
  }),
]);
export type Command = z.infer<typeof CommandSchema>;
