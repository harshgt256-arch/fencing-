/**
 * Inquiry submission route — the form's single integration point.
 *
 * ⚙️ CONFIGURATION (the only part requiring setup):
 *   INQUIRY_WEBHOOK_URL      — HTTPS endpoint that receives the inquiry as a
 *                              JSON POST (company CRM lead API, email service
 *                              webhook, Zapier/Make hook, or their own
 *                              backend). Required for the form to succeed.
 *   INQUIRY_WEBHOOK_SECRET   — optional; sent as `Authorization: Bearer …`
 *                              for endpoints that authenticate delivery.
 *
 * Behavior rules (deliberate):
 *   - No configured endpoint → HTTP 503. The form NEVER shows a success
 *     message that the server did not confirm, so an unconfigured site
 *     simply tells the customer submission failed.
 *   - Delivery failures (non-2xx webhook or network error) → HTTP 502 with
 *     the entry values already retained client-side by the form.
 *   - All validation is mirrored server-side; the client never decides alone.
 *   - Spam protection: same-origin check, hidden honeypot field, minimum
 *     "time-to-fill" check, and a small per-IP rate limit window. These are
 *     proportionate to a static marketing site with no user accounts.
 */

const FENCE_TYPES = [
  "wood",
  "vinyl",
  "chain-link",
  "aluminum",
  "steel",
  "composite",
  "split-rail",
  "farm",
  "not-sure",
] as const;

const PROPERTY_TYPES = ["residential", "multi-property", "commercial", "agricultural", "other"] as const;

const TIMELINES = ["asap", "1-2-months", "2-4-months", "flexible"] as const;

const FENCE_HEIGHTS = ["", "3-4", "5", "6", "7-8", "other"] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const PHONE_RE = /^[+\d]?[\d\s().-]{6,18}$/;

/* ---------------------------- rate limiting ---------------------------- */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 1000) hits.clear(); // bound memory; crude but by design
  return false;
}

/* ------------------------------ validation ----------------------------- */

type FieldErrors = Record<string, string>;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validate(body: Record<string, unknown>): {
  errors: FieldErrors;
  data: Record<string, unknown> | null;
} {
  const errors: FieldErrors = {};

  const fullName = str(body.fullName);
  if (!fullName) errors.fullName = "Please enter your full name.";
  else if (fullName.length > 120) errors.fullName = "Name is too long (120 characters max).";

  const email = str(body.email);
  if (!email) errors.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(email) || email.length > 200)
    errors.email = "Enter a valid email address, e.g. name@example.com.";

  const phone = str(body.phone);
  if (!phone) errors.phone = "Please enter a phone number so we can reach you.";
  else if (!PHONE_RE.test(phone) || (phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15))
    errors.phone = "Enter a valid phone number, e.g. (555) 555-5555.";

  const zip = str(body.zip);
  if (!zip) errors.zip = "Please enter your property's ZIP code.";
  else if (!ZIP_RE.test(zip))
    errors.zip = "Enter a valid ZIP code — five digits, optionally four more (e.g. 73102 or 73102-1234).";

  const propertyType = str(body.propertyType);
  if (!PROPERTY_TYPES.includes(propertyType as (typeof PROPERTY_TYPES)[number]))
    errors.propertyType = "Choose the type of property.";

  const fenceType = str(body.fenceType);
  if (!fenceType) errors.fenceType = "Choose a fencing type, or pick \u201cNot sure yet\u201d.";
  else if (!FENCE_TYPES.includes(fenceType as (typeof FENCE_TYPES)[number]))
    errors.fenceType = "Please choose one of the listed options.";

  const fenceHeight = str(body.fenceHeight);
  if (fenceHeight && !FENCE_HEIGHTS.includes(fenceHeight as (typeof FENCE_HEIGHTS)[number]))
    errors.fenceHeight = "Please choose one of the listed options.";

  const parseCount = (raw: unknown, min: number, max: number): number | null => {
    if (raw === "" || raw == null) return null;
    const n = Math.floor(Number(raw));
    if (!Number.isFinite(n) || n < min || n > max) return -1;
    return n;
  };

  const fenceLengthFeet = parseCount(body.fenceLengthFeet, 1, 100_000);
  if (fenceLengthFeet === -1) errors.fenceLengthFeet = "Enter an approximate length in feet, or leave it blank.";

  const gateCount = parseCount(body.gateCount, 0, 50);
  if (gateCount === -1) errors.gateCount = "Enter a number of gates, or leave it blank.";

  const timeline = str(body.timeline);
  if (!TIMELINES.includes(timeline as (typeof TIMELINES)[number]))
    errors.timeline = "Choose a project timeline.";

  const description = str(body.description);
  if (description.length > 2000) errors.description = "Description is too long (2000 characters max).";

  // Honeypot + time-to-fill are handled below, before delivery.
  if (Object.keys(errors).length > 0) return { errors, data: null };

  return {
    errors,
    data: {
      fullName,
      email,
      phone,
      zip,
      propertyType,
      fenceType,
      fenceHeight: fenceHeight || null,
      fenceLengthFeet,
      gateCount,
      timeline,
      description: description || null,
    },
  };
}

/* -------------------------------- POST --------------------------------- */

export async function POST(request: Request) {
  // Same-origin guard: reject cross-site browser POSTs.
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("host");
    if (host && new URL(origin).host !== host) {
      return Response.json({ code: "FORBIDDEN", message: "Cross-origin submissions are not accepted." }, { status: 403 });
    }
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json(
      { code: "RATE_LIMITED", message: "Too many requests. Please try again in a minute." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ code: "BAD_REQUEST", message: "Malformed request." }, { status: 400 });
  }

  // Honeypot: humans never see this field, so any value means spam.
  if (str(body.hp) !== "") {
    return Response.json({ code: "OK" }, { status: 200 });
  }

  // Time trap: reject near-instant automated fills.
  const elapsed = Number(body.startedAt);
  if (Number.isFinite(elapsed) && elapsed >= 0 && Date.now() - elapsed < 2_500) {
    return Response.json({ code: "OK" }, { status: 200 });
  }

  const { errors, data } = validate(body);
  if (!data) {
    return Response.json({ code: "INVALID", errors }, { status: 422 });
  }

  const webhookUrl = process.env.INQUIRY_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json(
      {
        code: "NOT_CONFIGURED",
        message:
          "The inquiry service is not configured yet. The site owner needs to set INQUIRY_WEBHOOK_URL.",
      },
      { status: 503 }
    );
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const secret = process.env.INQUIRY_WEBHOOK_SECRET;
    if (secret) headers.Authorization = `Bearer ${secret}`;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...data,
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return Response.json(
        { code: "FORWARD_FAILED", message: "Delivery to the lead system failed." },
        { status: 502 }
      );
    }
  } catch {
    return Response.json(
      { code: "FORWARD_FAILED", message: "Delivery to the lead system failed." },
      { status: 502 }
    );
  }

  return Response.json({ code: "OK" }, { status: 200 });
}
