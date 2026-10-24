/**
 * CENTRAL EDITABLE CONTENT — Testimonials / Customer Reviews
 *
 * ⚠️ DEVELOPMENT PLACEHOLDERS
 * Every entry below currently has `isPlaceholder: true`. They are sample
 * reviews added ONLY so the layout and interactions can be developed and
 * presented. Each placeholder card renders with a visible "Sample" badge
 * so it can never be mistaken for real customer feedback. When the
 * business supplies authentic reviews, add them with `isPlaceholder`
 * removed (or set to false), including the customer's real or approved
 * display name, and the badge disappears automatically.
 *
 * Only store verified details:
 *  - `rating` — only when the review came with a rating (1–5).
 *  - `date`   — only when the review's date is available.
 *  - `source` / `sourceUrl` — only when the review's origin is known
 *    (e.g. "Google", a platform badge rendered on the card). Leave null
 *    otherwise; no attribution is invented.
 *
 * 📊 AGGREGATE RATING SUMMARY
 * `aggregate` stays null until verified aggregate figures (e.g. a Google
 * profile's star average and review count authorized for reuse) exist.
 * The section renders NO summary while it is null — no invented stats.
 */

export interface Testimonial {
  id: string;
  /** Customer's name or approved display name. */
  customerName: string;
  quote: string;
  /** Verified rating (1–5) from the review itself; null when unknown. */
  rating: number | null;
  /** Review date as it should be displayed; omit when unknown. */
  date?: string;
  /** Review source (e.g. "Google") — shown only when known. */
  source?: string;
  sourceUrl?: string;
  /** Sample flag — renders the visible "Sample" placeholder badge. */
  isPlaceholder?: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: "sample-01",
    customerName: "Sample Customer",
    quote:
      "The crew walked me through the timeline, kept the yard tidy, and the finished fence runs dead-straight along the boundary. Exactly what we hoped for.",
    rating: 5,
    date: "Spring 2026",
    isPlaceholder: true,
  },
  {
    id: "sample-02",
    customerName: "Sample Customer",
    quote:
      "Clear written quote up front — materials, footage, gates, everything spelled out. There were no surprises at any point, which we appreciated.",
    rating: 5,
    date: "Summer 2026",
    isPlaceholder: true,
  },
  {
    id: "sample-03",
    customerName: "Sample Customer",
    quote:
      "Our lot isn't level in the least, and they designed the run to step with the terrain instead of leaving gaps. Thoughtful work from start to finish.",
    rating: 4,
    date: "Summer 2026",
    isPlaceholder: true,
  },
  {
    id: "sample-04",
    customerName: "Sample Customer",
    quote:
      "They took care checking where our property line actually sat before setting a single post, and kept us updated the whole way. Honest, tidy people.",
    rating: 5,
    date: "Fall 2026",
    isPlaceholder: true,
  },
  {
    id: "sample-05",
    customerName: "Sample Customer",
    quote:
      "Good materials, careful install, and the gate still swings perfectly after a season of daily use. We'd recommend them to anyone building a fence.",
    rating: 5,
    date: "Fall 2026",
    isPlaceholder: true,
  },
];

/**
 * Verified aggregate rating, if/when available from an authorized source.
 * While null, the section simply shows no summary.
 */
export const aggregateRating: {
  label: string;
  rating: number;
  count: number;
  ratingMax: number;
  source?: string;
} | null = null;
