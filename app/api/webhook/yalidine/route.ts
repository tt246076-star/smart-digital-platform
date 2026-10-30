import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createDeliveryDb } from "@/lib/delivery-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function asText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;

  const suppliedHex = signature.trim().replace(/^sha256=/i, "");
  if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const supplied = Buffer.from(suppliedHex, "hex");

  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}

function eventTime(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return new Date().toISOString();

  const raw = value.trim();
  const isoLike = raw.includes("T") ? raw : raw.replace(" ", "T") + "Z";
  const parsed = new Date(isoLike);

  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function canonicalStatus(rawStatus: string | null): string {
  if (!rawStatus) return "unknown";

  const value = rawStatus
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ");

  if (value.includes("livr") || value.includes("deliver")) return "delivered";
  if (value.includes("retour") || value.includes("return")) return "returned";
  if (value.includes("annul") || value.includes("cancel")) return "cancelled";
  if (
    value.includes("tentative echouee") ||
    value.includes("echec livraison") ||
    value.includes("client absent") ||
    value.includes("injoignable") ||
    value.includes("ne repond pas")
  ) return "delivery_attempted";
  if (value.includes("sorti en livraison") || value.includes("out for delivery")) return "out_for_delivery";
  if (
    value.includes("vers wilaya") ||
    value.includes("transfert") ||
    value.includes("transfer") ||
    value.includes("expedie") ||
    value.includes("shipped")
  ) return "in_transit";
  if (
    value.includes("centre") ||
    value.includes("recu a wilaya") ||
    value.includes("received at wilaya") ||
    value.includes("hub")
  ) return "at_hub";
  if (value.includes("ramasse") || value.includes("picked up")) return "picked_up";
  if (value.includes("attente") || value.includes("hold")) return "on_hold";

  return "unknown";
}

function optionalTextFields(data: JsonRecord): JsonRecord {
  const fields: JsonRecord = {};
  const mapping: Record<string, string> = {
    center_id: "center_id",
    center_name: "center_name",
    wilaya_id: "wilaya_id",
    wilaya_name: "wilaya",
    commune_id: "commune_id",
    commune_name: "commune",
    office_name: "office_name",
    office_address: "office_address",
    office_phone: "office_phone",
    office_map_url: "office_map_url",
    driver_name: "driver_name",
    driver_phone: "driver_phone",
  };

  for (const [source, target] of Object.entries(mapping)) {
    const value = asText(data[source]);
    if (value !== null) fields[target] = value;
  }

  return fields;
}

async function ensureShipment(db: ReturnType<typeof createDeliveryDb>, tracking: string) {
  const { error } = await db
    .from("delivery_shipments")
    .upsert(
      { carrier: "yalidine", carrier_label: "Yalidine", tracking },
      { onConflict: "carrier,tracking", ignoreDuplicates: true }
    );

  if (error) throw error;
}

async function processEvent(db: ReturnType<typeof createDeliveryDb>, type: string, event: JsonRecord) {
  const data = asRecord(event.data);
  const tracking = asText(data.tracking);
  const eventId = asText(event.event_id);

  if (!tracking || !eventId) {
    throw new Error("Each Yalidine event must include event_id and data.tracking");
  }

  const occurredAt = eventTime(event.occurred_at ?? data.date_status);
  const rawStatus = asText(data.status);
  const reason = asText(data.reason);

  await ensureShipment(db, tracking);

  const { error: eventError } = await db.from("delivery_shipment_events").insert({
    carrier: "yalidine",
    event_id: eventId,
    tracking,
    event_type: type,
    status: rawStatus,
    reason,
    occurred_at: occurredAt,
    payload: event,
  });

  const duplicate = eventError?.code === "23505";
  if (eventError && !duplicate) throw eventError;

  // Re-apply duplicate events as well. This makes a retry repair the shipment
  // row if the first request inserted the event but failed during the update.
  if (type === "parcel_status_updated") {
    if (!rawStatus) throw new Error("A parcel_status_updated event is missing data.status");

    const currentStatus = canonicalStatus(rawStatus);
    const finalStatus = ["delivered", "returned", "cancelled"].includes(currentStatus);

    const patch: JsonRecord = {
      current_status: currentStatus,
      status_label: rawStatus,
      reason,
      last_event_at: occurredAt,
      is_final: finalStatus,
      latest_payload: data,
      updated_at: new Date().toISOString(),
      ...optionalTextFields(data),
    };

    const { error } = await db
      .from("delivery_shipments")
      .update(patch)
      .eq("carrier", "yalidine")
      .eq("tracking", tracking)
      .or("last_event_at.is.null,last_event_at.lte." + occurredAt);

    if (error) throw error;
  } else if (type === "parcel_payment_updated") {
    const paymentStatus = asText(data.status);
    if (paymentStatus) {
      const { error } = await db
        .from("delivery_shipments")
        .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
        .eq("carrier", "yalidine")
        .eq("tracking", tracking);
      if (error) throw error;
    }
  } else if (type === "parcel_deleted") {
    const { error } = await db
      .from("delivery_shipments")
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("carrier", "yalidine")
      .eq("tracking", tracking);
    if (error) throw error;
  } else if (type === "parcel_edited") {
    const label = asText(data.label);
    if (label) {
      const { error } = await db
        .from("delivery_shipments")
        .update({ carrier_label: label, updated_at: new Date().toISOString() })
        .eq("carrier", "yalidine")
        .eq("tracking", tracking);
      if (error) throw error;
    }
  }

  return { duplicate };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const crcToken = url.searchParams.get("crc_token");

  if (crcToken) {
    return new Response(crcToken, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json({ ok: true, service: "yalidine-webhook" }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const secret = process.env.YALIDINE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 503 });
  }

  try {
    const rawBody = await request.text();
    if (!rawBody || rawBody.length > 512_000) {
      return NextResponse.json({ error: "Invalid webhook body" }, { status: 413 });
    }

    if (!verifySignature(rawBody, request.headers.get("x-yalidine-signature"), secret)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Webhook body must be valid JSON" }, { status: 400 });
    }

    const root = asRecord(payload);
    const type = asText(root.type);
    const events = Array.isArray(root.events) ? root.events : [];

    if (!type || events.length === 0 || events.length > 100) {
      return NextResponse.json({ error: "Invalid Yalidine event batch" }, { status: 400 });
    }

    const db = createDeliveryDb();
    let processed = 0;
    let duplicates = 0;

    for (const rawEvent of events) {
      const event = asRecord(rawEvent);
      const result = await processEvent(db, type, event);
      if (result.duplicate) duplicates += 1;
      else processed += 1;
    }

    return NextResponse.json({
      ok: true,
      received: events.length,
      processed,
      duplicates,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // Do not log request bodies, signatures, phone numbers, or API credentials.
    console.error("Yalidine webhook processing failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not process Yalidine webhook" }, { status: 500 });
  }
}
