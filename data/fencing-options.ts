/**
 * CENTRAL EDITABLE DATA — Fencing Options
 *
 * ✏️ PRICE FIELDS ARE ESTIMATES, not company pricing.
 * No company price list has been supplied yet, so `estimateLowUsdPerFooter`
 * / `estimateHighUsdPerFooter` hold typical US market ranges for INSTALLED
 * fencing, per linear foot. Replace them with the company's real pricing
 * (or set them to `null`) as soon as it is available. Cards display
 * "Request a Custom Quote" when a value is null, and always label figures
 * as typical estimates with explicit units.
 *
 * Set `isEstimate: false` only after real company pricing is entered.
 */

export type PrivacyLevel = "none" | "low" | "medium" | "high";
export type MaintenanceLevel = "low" | "moderate" | "high";

export type PriceBand = "under20" | "20to35" | "35plus";

export interface FencePhotoCredit {
  title: string;
  creator: string;
  license: string;
  sourceUrl: string;
}

export interface FencingOption {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  advantages: string[];
  applications: string[];
  styles: string[];
  maintenance: MaintenanceLevel;
  privacy: PrivacyLevel;
  /** Typical realistic lifespan with basic care (informational, not a warranty). */
  lifespan: string;
  /** ✏️ EDITABLE estimate — installed, USD per linear foot. null = quote only. */
  estimateLowUsdPerFooter: number | null;
  estimateHighUsdPerFooter: number | null;
  isEstimate: boolean;
  image: string;
  imageAlt: string;
  photoCredit?: FencePhotoCredit;
  /** Optional internal note for editors — never rendered on the card. */
  editorNote?: string;
}

export const privacyLabel: Record<PrivacyLevel, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const maintenanceLabel: Record<MaintenanceLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

export function priceBand(option: FencingOption): PriceBand | null {
  if (option.estimateLowUsdPerFooter == null || option.estimateHighUsdPerFooter == null) return null;
  const mid = (option.estimateLowUsdPerFooter + option.estimateHighUsdPerFooter) / 2;
  if (mid < 20) return "under20";
  if (mid <= 35) return "20to35";
  return "35plus";
}

export const fencingOptions: FencingOption[] = [
  {
    slug: "wood-privacy",
    name: "Wood Privacy Fencing",
    tagline: "The classic backyard boundary",
    description:
      "Solid board-and-post construction, typically cedar, pine, or fir, built as full panels or board-by-board. Delivers real visual privacy and can be painted or stained to match the home.",
    advantages: [
      "Full-height solid privacy paneling",
      "Lower upfront material cost than vinyl or composite",
      "Repairable board by board; easy to customize or stain",
    ],
    applications: ["Backyards", "Pet containment", "Pool enclosures (code permitting)", "Perimeter screening"],
    styles: [
      "Board-on-board",
      "Board-on-batten",
      "Shadowbox (good neighbor)",
      "Stockade",
      "Lattice top",
    ],
    maintenance: "moderate",
    privacy: "high",
    lifespan: "15–25+ years with periodic sealing or staining",
    estimateLowUsdPerFooter: 18,
    estimateHighUsdPerFooter: 35,
    isEstimate: true,
    image: "/images/fences/wood-privacy.jpg",
    imageAlt:
      "Weathered vertical wood privacy fence boards behind a garden, showing natural grain and full-height solid panels",
    photoCredit: {
      title: "wooden privacy fence (photograph)",
      creator: "Wikimedia Commons contributor",
      license: "CC BY / CC BY-SA",
      sourceUrl: "https://commons.wikimedia.org/",
    },
  },
  {
    slug: "vinyl-pvc",
    name: "Vinyl (PVC) Fencing",
    tagline: "Clean lines, no repainting",
    description:
      "Extruded PVC panels with internal reinforcement. Won't rot, splinter, or need repainting, and rinses clean with a hose. A popular low-upkeep choice for finished residential lots.",
    advantages: [
      "Virtually no painting or staining ever",
      "Does not rot, warp, or attract insects",
      "Consistent, factory-finished look",
    ],
    applications: ["Backyards", "Front yards", "Pool surrounds", "HOA-friendly perimeters"],
    styles: [
      "Solid privacy panels",
      "Semi-privacy (lattice)",
      "Picket",
      "Ranch rail",
    ],
    maintenance: "low",
    privacy: "high",
    lifespan: "25+ years; color-stable formulations vary",
    estimateLowUsdPerFooter: 20,
    estimateHighUsdPerFooter: 40,
    isEstimate: true,
    image: "/images/fences/vinyl-pvc.jpg",
    imageAlt:
      "White vinyl PVC picket fence panels running along a residential yard beside a house",
    photoCredit: {
      title: '"White Vinyl Fence" by Vsnary',
      creator: "Vsnary",
      license: "CC BY 4.0",
      sourceUrl: "https://commons.wikimedia.org/w/index.php?curid=176999887",
    },
  },
  {
    slug: "chain-link",
    name: "Chain-Link Fencing",
    tagline: "Workhorse security on a budget",
    description:
      "Galvanized (or polymer-coated) steel mesh stretched between steel posts. The most economical option for enclosing large areas, and the standard for yards, courts, and commercial lots.",
    advantages: [
      "Economical for long runs and large enclosures",
      "Low profile keeps sight lines open",
      "Fast installation and easy repair",
    ],
    applications: ["Playgrounds & courts", "Commercial perimeters", "Pet yards", "Construction and storage lots"],
    styles: [
      "Galvanized steel",
      "Vinyl-coated (green/black)",
      "Privacy slats",
      "Commercial high-security (with barbed arms)",
    ],
    maintenance: "low",
    privacy: "none",
    lifespan: "20+ years; galvanized mesh resists rust well",
    estimateLowUsdPerFooter: 10,
    estimateHighUsdPerFooter: 25,
    isEstimate: true,
    image: "/images/fences/chain-link.jpg",
    imageAlt:
      "Galvanized chain-link fence enclosing a residential tennis court, with wear mesh, corner posts and a regulation sign",
    photoCredit: {
      title: "chain-link tennis court fence (photograph)",
      creator: "Wikimedia Commons contributor",
      license: "CC BY / CC BY-SA",
      sourceUrl: "https://commons.wikimedia.org/",
    },
  },
  {
    slug: "aluminum",
    name: "Ornamental Aluminum Fencing",
    tagline: "The elegant, rust-proof border",
    description:
      "Welded or mechanically-fastened aluminum pickets in powder-coated finishes. Gives the formal look of iron without the rust, and works especially well around pools and landscaped fronts.",
    advantages: [
      "Will not rust — ideal for poolside and sprinkler zones",
      "Powder-coated finishes for years with no repainting",
      "Open, decorative look that keeps views",
    ],
    applications: ["Pool enclosures", "Front yards", "Gardens", "Entry statements"],
    styles: [
      "Flat top",
      "Spearpoint top",
      "Double picket",
      "Arched estate gates",
    ],
    maintenance: "low",
    privacy: "low",
    lifespan: "25+ years with premium powder coating",
    estimateLowUsdPerFooter: 25,
    estimateHighUsdPerFooter: 45,
    isEstimate: true,
    image: "/images/fences/aluminum.jpg",
    imageAlt:
      "Black ornamental metal fence with vertical pickets running along a residential driveway and hedge",
    photoCredit: {
      title: "black ornamental metal fence (photograph)",
      creator: "Wikimedia Commons contributor",
      license: "CC BY / CC BY-SA",
      sourceUrl: "https://commons.wikimedia.org/",
    },
  },
  {
    slug: "wrought-iron",
    name: "Steel & Wrought-Iron Fencing",
    tagline: "Heirloom strength and presence",
    description:
      "Heavy-duty steel or traditional wrought iron, often hot-dip galvanized and powder-coated. The strongest option on this list, with a formal, architectural character that ages like estate architecture.",
    advantages: [
      "Highest strength and impact resistance",
      "Timeless ornamental detailing",
      "Performs for decades when galvanized",
    ],
    applications: ["Estate perimeters", "Commercial & civic entrances", "Historic properties", "Security lines"],
    styles: [
      "Traditional wrought iron",
      "Modern square steel pickets",
      "Custom arches",
      "Driveway and pedestrian gates",
    ],
    maintenance: "moderate",
    privacy: "low",
    lifespan: "50+ years when maintained (galvanized + coated)",
    estimateLowUsdPerFooter: 30,
    estimateHighUsdPerFooter: 70,
    isEstimate: true,
    image: "/images/fences/wrought-iron.jpg",
    imageAlt:
      "Black wrought-iron fence and gates set in stone posts around a historic residence",
    photoCredit: {
      title: '"Wrought-iron fence and gate, Henry Laurens House, 7 Legare Street, Charleston, SC" by Spencer Means',
      creator: "Spencer Means",
      license: "CC BY-SA 2.0",
      sourceUrl: "https://www.flickr.com/photos/28643687@N08/11123714805",
    },
  },
  {
    slug: "composite",
    name: "Composite Fencing",
    tagline: "Wood's look without wood's upkeep",
    description:
      "Boards engineered from recycled wood fibers and polymer resin, capped for UV and fade resistance. Delivers a wood-look privacy line with very little seasonal care.",
    advantages: [
      "No rot, splinters, or insect damage",
      "Fade-resistant capped boards, no staining",
      "Long, straight spans with hidden fasteners",
    ],
    applications: ["Privacy fencing", "Backyards", "Modern architectural perimeters", "Damp climates"],
    styles: [
      "Solid vertical boards",
      "Horizontal (contemporary)",
      "Two-tone",
      "Top cap styles",
    ],
    maintenance: "low",
    privacy: "high",
    lifespan: "25+ years, fade-resistant capped formulations",
    estimateLowUsdPerFooter: 25,
    estimateHighUsdPerFooter: 45,
    isEstimate: true,
    image: "/images/fences/composite.jpg",
    imageAlt:
      "Sample boards of wood-plastic composite material in several tones, showing the capped fiber texture",
    editorNote:
      "Currently a material-sample photo. Replace with an installed composite fence photo when the company has one.",
  },
  {
    slug: "split-rail",
    name: "Split-Rail Fencing",
    tagline: "Rustic open definition",
    description:
      "Rough-sawn or hand-split posts and rails, often with mesh infill. Defines property lines and guides sight lines without closing them — the traditional look for estates and country drives.",
    advantages: [
      "Rustic character at a friendly price",
      "Quick install over long runs",
      "Blends into landscapes and tree lines",
    ],
    applications: ["Large lots", "Drivelines & gardens accents", "Pool property lines (with mesh)", "Acreages"],
    styles: [
      "Two-rail",
      "Three-rail",
      "Post & rail with mesh",
      "Crossbuck",
    ],
    maintenance: "low",
    privacy: "none",
    lifespan: "20+ years; cedar resists weather naturally",
    estimateLowUsdPerFooter: 8,
    estimateHighUsdPerFooter: 18,
    isEstimate: true,
    image: "/images/fences/split-rail.jpg",
    imageAlt:
      "Wooden split-rail fence in a crisscross joint pattern running along a walking path through a wooded area",
    photoCredit: {
      title: '"split rail fence, with path" by waferboard',
      creator: "waferboard",
      license: "CC BY 2.0",
      sourceUrl: "https://www.flickr.com/photos/60944931@N00/5346278048",
    },
  },
  {
    slug: "farm-ranch",
    name: "Farm & Ranch Fencing",
    tagline: "Built for acreage and livestock",
    description:
      "Post-and-rail, woven wire, and high-tensile systems engineered for acreage contours and animal containment. Heavy corner bracing and tension wire make long runs economical.",
    advantages: [
      "Covers long distances affordably",
      "Routes cleanly over uneven ground",
      "Configurable containment for livestock or pets",
    ],
    applications: ["Pastures", "Equestrian lines", "Livestock containment", "Acreage boundaries"],
    styles: [
      "Board fence (2–4 rail)",
      "Woven wire & barbed combos",
      "High-tensile",
      "Crossbuck estate rail",
    ],
    maintenance: "moderate",
    privacy: "none",
    lifespan: "20–40 years depending on materials and tension",
    estimateLowUsdPerFooter: 8,
    estimateHighUsdPerFooter: 20,
    isEstimate: true,
    image: "/images/fences/farm-ranch.jpg",
    imageAlt:
      "Wood post-and-rail farm fence in front of a red barn and green pasture with horses",
    photoCredit: {
      title: '"Tree by farm fence" by D Coetzee',
      creator: "D Coetzee",
      license: "CC0 1.0",
      sourceUrl: "https://www.flickr.com/photos/29507259@N02/3504995811",
    },
  },
];

/** Variables that move a real project quote — shown as a note under the grid. */
export const pricingVariablesNote =
  "Typical estimates reflect installed cost per linear foot of straight run and change with property measurements, fence height, materials, gates and corners, removal of an existing fence, terrain and site conditions, and the overall scope of work. Your final project price is provided in a custom, written quote.";

/** Small photo credits line (renders at the section's bottom). */
export const photoCreditsLabel =
  "Photographs: licensed stock of representative fence styles (Wikimedia Commons / Flickr, CC).";
