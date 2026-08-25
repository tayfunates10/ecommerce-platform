import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  buildAnalyticsPayload,
  type AnalyticsConsent,
  type AnalyticsEvent,
  type FirstPartyAnalyticsPayload,
} from "@/lib/analytics";

export async function persistAnalyticsEvent(
  consent: AnalyticsConsent,
  event: AnalyticsEvent,
): Promise<FirstPartyAnalyticsPayload | null> {
  const payload = buildAnalyticsPayload(consent, event);
  if (!payload) return null;

  await db.$executeRaw`
    INSERT INTO "AnalyticsEventDelivery"
      ("id", "eventName", "path", "currency", "valueMinor", "properties", "createdAt")
    VALUES (
      ${randomUUID()},
      ${payload.name},
      ${payload.path},
      ${payload.currency ?? null},
      ${payload.valueMinor ?? null},
      ${JSON.stringify(payload.properties)}::jsonb,
      NOW()
    )
  `;

  return payload;
}
