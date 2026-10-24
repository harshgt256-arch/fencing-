/**
 * CENTRAL EDITABLE CONTENT — "Why Choose Us" section
 *
 * ✏️ The company can edit every string in this file without touching any
 * layout or animation code. Only verifiable statements are used — no
 * invented certifications, statistics, or "best in region" claims. If the
 * business owner later confirms credentials (licensing, insurance, years in
 * trade, workmanship warranty), add them as a benefit item or extend the
 * descriptions here; the layout supports any number of benefit rows.
 */

export type BenefitIcon =
  | "materials"
  | "installation"
  | "estimate"
  | "custom"
  | "site"
  | "communication";

export interface WhyChooseUsBenefit {
  icon: BenefitIcon;
  heading: string;
  description: string;
}

export interface WhyChooseUsContent {
  /** Small label shown above the heading. */
  eyebrow: string;
  heading: string;
  intro: string;
  benefits: WhyChooseUsBenefit[];
  /** Trust-focused sentence under the grid. */
  closing: string;
  /** CTA button label; links to the existing inquiry form (#quote). */
  ctaLabel: string;
}

export const whyChooseUs: WhyChooseUsContent = {
  eyebrow: "Why Choose Us",
  heading: "Why Homeowners Choose Us",
  intro:
    "A fence is part of your home for decades, not weeks. We focus on professional fence installation that protects your property, sharpens its appearance, and holds up over the long term — with a process that stays clear from the first visit to the final walkthrough.",
  benefits: [
    {
      icon: "materials",
      heading: "Quality Fencing Materials",
      description:
        "Timber, vinyl, steel, and aluminum sourced for the project at hand — chosen to suit your soil, weather exposure, and the look you want, not just what happens to be in stock.",
    },
    {
      icon: "installation",
      heading: "Careful, Precise Installation",
      description:
        "Posts set plumb and true, panels aligned, gates hung to swing cleanly. We work methodically section by section and keep the site tidy as we go.",
    },
    {
      icon: "estimate",
      heading: "Clear Written Estimates",
      description:
        "Your quote sets out materials, linear footage, height, gates, and removal of any existing fence — so you know exactly what you're approving before work starts.",
    },
    {
      icon: "custom",
      heading: "Solutions for Every Property",
      description:
        "Compact city yards, acreage perimeters, pool enclosures, sloped or uneven ground — the fence is designed around your property and how you actually use it.",
    },
    {
      icon: "site",
      heading: "Attention to Site Conditions",
      description:
        "Property lines, utility clearances, terrain, and drainage are assessed before installation begins, so surprises find us early instead of mid-project.",
    },
    {
      icon: "communication",
      heading: "Professional Communication",
      description:
        "A single point of contact from the first site visit to the final walkthrough, with straightforward updates as your project progresses.",
    },
  ],
  closing:
    "Curious what a well-built fence would add to your property? Tell us a little about it and we'll put together a written estimate for your project.",
  ctaLabel: "Get a Free Fencing Estimate",
};
