"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import styles from "./InquiryForm.module.css";

/* -------------------------- editable field options -------------------------- */

const FENCE_TYPE_OPTIONS = [
  { value: "wood", label: "Wood" },
  { value: "vinyl", label: "Vinyl (PVC)" },
  { value: "chain-link", label: "Chain-Link" },
  { value: "aluminum", label: "Aluminum" },
  { value: "steel", label: "Steel & Wrought-Iron" },
  { value: "composite", label: "Composite" },
  { value: "split-rail", label: "Split-Rail" },
  { value: "farm", label: "Farm & Ranch" },
  { value: "not-sure", label: "Not sure yet" },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "residential", label: "Home / single-family residential" },
  { value: "multi-property", label: "Multiple or rental properties" },
  { value: "commercial", label: "Commercial" },
  { value: "agricultural", label: "Farm or acreage" },
  { value: "other", label: "Other" },
];

const HEIGHT_OPTIONS = [
  { value: "5", label: "5 ft" },
  { value: "6", label: "6 ft" },
  { value: "3-4", label: "3–4 ft" },
  { value: "7-8", label: "7–8 ft" },
  { value: "other", label: "Other (describe below)" },
];

const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-2-months", label: "Within 1–2 months" },
  { value: "2-4-months", label: "2–4 months out" },
  { value: "flexible", label: "Flexible — just planning" },
];

interface FormValues {
  fullName: string;
  email: string;
  phone: string;
  zip: string;
  propertyType: string;
  fenceType: string;
  fenceLengthFeet: string;
  fenceHeight: string;
  gateCount: string;
  timeline: string;
  description: string;
  hp: string;
}

const EMPTY_VALUES: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  zip: "",
  propertyType: "",
  fenceType: "",
  fenceLengthFeet: "",
  fenceHeight: "",
  gateCount: "",
  timeline: "",
  description: "",
  hp: "",
};

type Status = "idle" | "submitting" | "success" | "error";
type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const PHONE_RE = /^[+\d]?[\d\s().-]{6,18}$/;

function validateValues(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.fullName.trim()) errors.fullName = "Please enter your full name.";
  if (!values.email.trim()) errors.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(values.email.trim()))
    errors.email = "Enter a valid email address, e.g. name@example.com.";
  if (!values.phone.trim()) errors.phone = "Please enter a phone number so we can reach you.";
  else if (!PHONE_RE.test(values.phone.trim()) || [...values.phone.replace(/\D/g, "")].length < 7)
    errors.phone = "Enter a valid phone number, e.g. (555) 555-5555.";
  if (!values.zip.trim()) errors.zip = "Please enter your property's ZIP code.";
  else if (!ZIP_RE.test(values.zip.trim()))
    errors.zip = "Enter a valid ZIP code — five digits, optionally four more (e.g. 73102 or 73102-1234).";
  if (!values.propertyType) errors.propertyType = "Choose the type of property.";
  if (!values.fenceType) errors.fenceType = "Choose a fencing type, or pick \u201cNot sure yet\u201d.";
  if (!values.timeline) errors.timeline = "Choose a project timeline.";

  const countField = (raw: string, min: number, message: string): string | undefined => {
    if (raw.trim() === "") return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < min) return message;
    return undefined;
  };
  const lengthError = countField(values.fenceLengthFeet, 1, "Enter an approximate length in feet, or leave it blank.");
  if (lengthError) errors.fenceLengthFeet = lengthError;
  const gateError = countField(values.gateCount, 0, "Enter a number of gates, or leave it blank.");
  if (gateError) errors.gateCount = gateError;

  return errors;
}

export default function InquiryForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [globalError, setGlobalError] = useState<{ message: string; configuredNeeded?: boolean } | null>(null);
  const submittedRef = useRef(false);
  // Seeded on mount (never during render — Date.now() would break prerender)
  const startedAtRef = useRef<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const failureHeadingRef = useRef<HTMLHeadingElement>(null);

  const setField = (field: keyof FormValues) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const blurField = (field: keyof FormValues) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldErrors = validateValues(values);
    setErrors((prev) => {
      const next = { ...prev };
      if (fieldErrors[field]) next[field] = fieldErrors[field];
      else delete next[field];
      return next;
    });
  };

  // Record when the customer started filling the form (used by the server's
  // time-trap against near-instant automated submissions).
  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  // ---- CTA preselection: fence-type CTAs (data-fence-type) preselect the select ----
  // Also retains any other CTA-provided value via sessionStorage, keyed by
  // field name (e.g. a CTA could set "contact-method"). No CTA does today.
  useEffect(() => {
    let stored: { field: string; value: string } | null = null;
    try {
      stored = JSON.parse(window.sessionStorage.getItem("inquiry-cta") ?? "null");
    } catch {
      stored = null;
    }
    if (stored && stored.field === "fenceType" && FENCE_TYPE_OPTIONS.some((o) => o.value === stored?.value)) {
      setValues((prev) => ({ ...prev, fenceType: stored!.value }));
    }
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.("[data-fence-type]");
      if (anchor) {
        try {
          window.sessionStorage.setItem(
            "inquiry-cta",
            JSON.stringify({ field: "fenceType", value: anchor.getAttribute("data-fence-type") })
          );
        } catch {
          /* storage unavailable — preselection silently unavailable */
        }
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // ---- Submit ----
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittedRef.current) return; // no duplicate submissions

    const fieldErrors = validateValues(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      const firstInvalid = Object.keys(fieldErrors)[0];
      setTouched((prev) => ({ ...prev, [firstInvalid]: true }));
      const form = e.currentTarget;
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus("submitting");
    submittedRef.current = true;
    setGlobalError(null);

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          startedAt: startedAtRef.current ?? Date.now(),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { code?: string; errors?: FieldErrors; message?: string }
        | null;

      if (response.ok && payload?.code === "OK") {
        // Server confirmed success.
        setStatus("success");
        try {
          window.sessionStorage.removeItem("inquiry-cta");
        } catch {
          /* ignore */
        }
        requestAnimationFrame(() => headingRef.current?.focus());
      } else if (payload?.errors) {
        setErrors(payload.errors);
        setTouched(Object.fromEntries(Object.keys(payload.errors).map((k) => [k, true])));
        setGlobalError({ message: "Please correct the highlighted fields and try again." });
        submittedRef.current = false;
        setStatus("error");
        requestAnimationFrame(() => failureHeadingRef.current?.focus());
      } else {
        const notConfigured = payload?.code === "NOT_CONFIGURED";
        setGlobalError({
          message: notConfigured
            ? "The inquiry service isn't connected yet. We're completing setup — please try again soon or complete the form so your values are kept."
            : "Something went wrong sending your inquiry. Your values are still here — please try again.",
          configuredNeeded: notConfigured,
        });
        submittedRef.current = false;
        setStatus("error");
        requestAnimationFrame(() => failureHeadingRef.current?.focus());
      }
    } catch {
      setGlobalError({
        message: "We couldn't reach the inquiry service (network issue). Your values are kept — please try again.",
      });
      submittedRef.current = false;
      setStatus("error");
      requestAnimationFrame(() => failureHeadingRef.current?.focus());
    }
  };

  /* ------------------------------- success ------------------------------- */
  if (status === "success") {
    return (
      <section id="quote" className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.panel}>
            <div className={styles.successCard} role="status">
              <h2 ref={headingRef} tabIndex={-1} className={styles.successHeading}>
                Thank you — your inquiry was received
              </h2>
              <p className={styles.successText}>
                We&apos;ve received your request. Our team will review the details of your project and
                follow up with you directly about your free fencing estimate.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* -------------------------------- form --------------------------------- */
  return (
    <section id="quote" className={styles.section} aria-labelledby="inquiry-heading">
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 id="inquiry-heading" className={styles.heading}>
            Tell Us About Your Fencing Project
          </h2>
          <p className={styles.intro}>
            Share a few details and we&apos;ll review your requirements, then follow up with a written
            estimate. No phone call needed to get started.
          </p>
        </header>

        <form className={styles.panel} onSubmit={onSubmit} noValidate>
          <p className={styles.requiredNote}>
            Fields marked <span aria-hidden="true">*</span>
            <span className={styles.srOnly}>asterisk</span> are required.
          </p>

          {globalError && (
            <div className={styles.errorSummary} role="alert">
              <h3 ref={failureHeadingRef} tabIndex={-1} className={styles.errorHeading}>
                Your inquiry wasn&apos;t sent
              </h3>
              <p>{globalError.message}</p>
            </div>
          )}

          <div className={styles.grid}>
            <Field
              name="fullName"
              label="Full name"
              required
              error={touched.fullName ? errors.fullName : undefined}
            >
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                className={styles.input}
                value={values.fullName}
                onChange={setField("fullName")}
                onBlur={blurField("fullName")}
                aria-invalid={errors.fullName ? true : undefined}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
              />
            </Field>

            <Field
              name="email"
              label="Email address"
              required
              error={touched.email ? errors.email : undefined}
            >
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                className={styles.input}
                value={values.email}
                onChange={setField("email")}
                onBlur={blurField("email")}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </Field>

            <Field
              name="phone"
              label="Phone number"
              required
              error={touched.phone ? errors.phone : undefined}
            >
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                className={styles.input}
                value={values.phone}
                onChange={setField("phone")}
                onBlur={blurField("phone")}
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
            </Field>

            <Field
              name="zip"
              label="Property ZIP code"
              required
              error={touched.zip ? errors.zip : undefined}
              hint="Used for scheduling and material logistics."
            >
              <input
                id="zip"
                name="zip"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                pattern="\d{5}(-\d{4})?"
                className={styles.input}
                value={values.zip}
                onChange={setField("zip")}
                onBlur={blurField("zip")}
                aria-invalid={errors.zip ? true : undefined}
                aria-describedby={
                  ["zip-hint", errors.zip ? "zip-error" : null].filter(Boolean).join(" ") || undefined
                }
              />
            </Field>

            <Field
              name="propertyType"
              label="Property type"
              required
              error={touched.propertyType ? errors.propertyType : undefined}
            >
              <select
                id="propertyType"
                name="propertyType"
                className={styles.input}
                value={values.propertyType}
                onChange={setField("propertyType")}
                onBlur={blurField("propertyType")}
                aria-invalid={errors.propertyType ? true : undefined}
                aria-describedby={errors.propertyType ? "propertyType-error" : undefined}
              >
                <option value="" disabled>
                  Select property type
                </option>
                {PROPERTY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              name="fenceType"
              label="Preferred fencing type"
              required
              error={touched.fenceType ? errors.fenceType : undefined}
            >
              <select
                id="fenceType"
                name="fenceType"
                className={styles.input}
                value={values.fenceType}
                onChange={setField("fenceType")}
                onBlur={blurField("fenceType")}
                aria-invalid={errors.fenceType ? true : undefined}
                aria-describedby={errors.fenceType ? "fenceType-error" : undefined}
              >
                <option value="" disabled>
                  Select fencing type
                </option>
                {FENCE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              name="fenceLengthFeet"
              label="Approximate length, if known"
              hint="In linear feet — a rough estimate is fine."
              error={touched.fenceLengthFeet ? errors.fenceLengthFeet : undefined}
            >
              <input
                id="fenceLengthFeet"
                name="fenceLengthFeet"
                type="number"
                min={0}
                inputMode="numeric"
                className={styles.input}
                value={values.fenceLengthFeet}
                onChange={setField("fenceLengthFeet")}
                onBlur={blurField("fenceLengthFeet")}
                aria-invalid={errors.fenceLengthFeet ? true : undefined}
                aria-describedby={
                  ["fenceLengthFeet-hint", errors.fenceLengthFeet ? "fenceLengthFeet-error" : null]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
              />
            </Field>

            <Field name="fenceHeight" label="Desired height, if known">
              <div className={styles.selectGroup}>
                <select
                  id="fenceHeight"
                  name="fenceHeight"
                  className={styles.input}
                  value={values.fenceHeight}
                  onChange={setField("fenceHeight")}
                  onBlur={blurField("fenceHeight")}
                >
                  <option value="">Not sure / haven&apos;t decided</option>
                  {HEIGHT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            <Field
              name="gateCount"
              label="Number of gates, if relevant"
              error={touched.gateCount ? errors.gateCount : undefined}
            >
              <input
                id="gateCount"
                name="gateCount"
                type="number"
                min={0}
                max={50}
                inputMode="numeric"
                className={styles.input}
                value={values.gateCount}
                onChange={setField("gateCount")}
                onBlur={blurField("gateCount")}
                aria-invalid={errors.gateCount ? true : undefined}
                aria-describedby={errors.gateCount ? "gateCount-error" : undefined}
              />
            </Field>

            <Field
              name="timeline"
              label="Project timeline"
              required
              error={touched.timeline ? errors.timeline : undefined}
            >
              <select
                id="timeline"
                name="timeline"
                className={styles.input}
                value={values.timeline}
                onChange={setField("timeline")}
                onBlur={blurField("timeline")}
                aria-invalid={errors.timeline ? true : undefined}
                aria-describedby={errors.timeline ? "timeline-error" : undefined}
              >
                <option value="" disabled>
                  Select a timeline
                </option>
                {TIMELINE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              name="description"
              label="Project description"
              span
              hint="Optional — anything about the layout, goals, or site that helps us prepare."
            >
              <textarea
                id="description"
                name="description"
                rows={5}
                maxLength={2000}
                className={styles.input}
                value={values.description}
                onChange={setField("description")}
                aria-describedby={["description-hint"].filter(Boolean).join(" ")}
              />
            </Field>
          </div>

          {/* Honeypot — hidden from humans; bots that fill it are silently accepted and discarded. */}
          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="hp">Company website</label>
            <input
              id="hp"
              name="hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values.hp}
              onChange={setField("hp")}
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.cta} disabled={status === "submitting"}>
              {status === "submitting" ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  Sending…
                </>
              ) : (
                "Request My Free Estimate"
              )}
            </button>
            <p className={styles.privacyNote}>
              We use the details you provide only to review your project, prepare your estimate, and
              follow up with you about it.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ------------------------------ field wrapper ------------------------------ */

function Field({
  name,
  label,
  required,
  hint,
  error,
  span,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  span?: boolean;
  children: ReactNode;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`${styles.field} ${span ? styles.fieldSpan : ""}`}>
      <label className={styles.label} htmlFor={name}>
        {label}
        {required && (
          <>
            <span aria-hidden="true" className={styles.asterisk}>
              {" *"}
            </span>
            <span className={styles.srOnly}>(required)</span>
          </>
        )}
      </label>
      {children}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
