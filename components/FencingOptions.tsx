"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  fencingOptions,
  maintenanceLabel,
  privacyLabel,
  priceBand,
  pricingVariablesNote,
  photoCreditsLabel,
  type FencingOption,
  type PriceBand,
  type PrivacyLevel,
} from "@/data/fencing-options";
import styles from "./FencingOptions.module.css";

gsap.registerPlugin(ScrollTrigger);

type PrivacyFilter = "any" | PrivacyLevel;
type BudgetFilter = "any" | PriceBand;

const PRIVACY_FILTERS: { id: PrivacyFilter; label: string }[] = [
  { id: "any", label: "Any" },
  { id: "none", label: "Open view" },
  { id: "low", label: "Partly private" },
  { id: "medium", label: "Mostly private" },
  { id: "high", label: "Fully private" },
];

const BUDGET_FILTERS: { id: BudgetFilter; label: string }[] = [
  { id: "any", label: "Any budget" },
  { id: "under20", label: "Economy" },
  { id: "20to35", label: "Mid-range" },
  { id: "35plus", label: "Premium" },
];

const matchesPrivacy = (fences: PrivacyLevel, filter: PrivacyFilter): boolean => {
  if (filter === "any") return true;
  if (filter === "none") return fences === "none";
  if (filter === "low") return fences === "low" || fences === "medium";
  if (filter === "medium") return fences === "medium" || fences === "high";
  return fences === "high";
};

function priceLine(option: FencingOption): string {
  if (option.estimateLowUsdPerFooter == null || option.estimateHighUsdPerFooter == null) {
    return "Request a Custom Quote";
  }
  const dollar = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return `${dollar.format(option.estimateLowUsdPerFooter)}–${dollar.format(option.estimateHighUsdPerFooter)}`;
}

export default function FencingOptions() {
  const sectionRef = useRef<HTMLElement>(null);
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>("any");
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>("any");

  const visible = useMemo(
    () =>
      fencingOptions.filter((option) => {
        if (materialFilter !== "all" && option.slug !== materialFilter) return false;
        if (!matchesPrivacy(option.privacy, privacyFilter)) return false;
        if (budgetFilter !== "any" && priceBand(option) !== budgetFilter) return false;
        return true;
      }),
    [materialFilter, privacyFilter, budgetFilter]
  );

  const filtersActive = materialFilter !== "all" || privacyFilter !== "any" || budgetFilter !== "any";

  // Entrance reveals: one GSAP context, batched ScrollTrigger, visible-by-default.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cleanup = gsap.context(() => {
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        batchMax: 4,
        onEnter: (batch) =>
          gsap.from(batch, {
            autoAlpha: 0,
            y: 26,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.09,
            overwrite: true,
          }),
      });
      ScrollTrigger.refresh();
    }, section);

    return () => cleanup.revert();
  }, []);

  return (
    <section id="fencing-options" ref={sectionRef} className={styles.section} aria-labelledby="fencing-options-heading">
      <div className={styles.inner}>
        <header className={styles.header} data-reveal>
          <h2 id="fencing-options-heading" className={styles.heading}>
            Explore Our Fencing Options
          </h2>
          <p className={styles.intro}>
            Every property asks for a different fence. Compare the eight materials we install — how
            private, durable, and costly each typically runs — then request pricing for the one that
            fits your yard.
          </p>
        </header>

        <div className={styles.filterBar} data-reveal>
          <div className={styles.filterGroup} role="group" aria-label="Filter by fence material">
            <span className={styles.filterLabel}>Material</span>
            <div className={styles.chips}>
              <button
                type="button"
                className={`${styles.chip} ${materialFilter === "all" ? styles.chipOn : ""}`}
                aria-pressed={materialFilter === "all"}
                onClick={() => setMaterialFilter("all")}
              >
                All
              </button>
              {fencingOptions.map((option) => (
                <button
                  key={option.slug}
                  type="button"
                  className={`${styles.chip} ${materialFilter === option.slug ? styles.chipOn : ""}`}
                  aria-pressed={materialFilter === option.slug}
                  onClick={() => setMaterialFilter(option.slug)}
                >
                  {option.name.replace(/ Fencing$/, "")}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup} role="group" aria-label="Filter by privacy level">
            <span className={styles.filterLabel}>Privacy</span>
            <div className={styles.chips}>
              {PRIVACY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  name="privacy"
                  className={`${styles.chip} ${privacyFilter === filter.id ? styles.chipOn : ""}`}
                  aria-pressed={privacyFilter === filter.id}
                  onClick={() => setPrivacyFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup} role="group" aria-label="Filter by typical budget">
            <span className={styles.filterLabel}>Budget</span>
            <div className={styles.chips}>
              {BUDGET_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  name="budget"
                  className={`${styles.chip} ${budgetFilter === filter.id ? styles.chipOn : ""}`}
                  aria-pressed={budgetFilter === filter.id}
                  onClick={() => setBudgetFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className={styles.resultCount} role="status" aria-live="polite">
          {visible.length} of {fencingOptions.length} fence types shown
        </p>

        <ul className={styles.grid}>
          {visible.map((option) => (
            <FenceCard key={option.slug} option={option} />
          ))}
        </ul>

        {visible.length === 0 && (
          <div className={styles.empty}>
            <p>No fence matches that combination of filters.</p>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setMaterialFilter("all");
                setPrivacyFilter("any");
                setBudgetFilter("any");
              }}
            >
              Clear all filters
            </button>
          </div>
        )}

        <aside className={styles.pricingNote} data-reveal>
          <h3 className={styles.noteTitle}>What moves your final price</h3>
          <p>{pricingVariablesNote}</p>
        </aside>

        <p className={styles.credits}>{photoCreditsLabel}</p>
      </div>
    </section>
  );
}

function FenceCard({ option }: { option: FencingOption }) {
  return (
    <li className={styles.cardItem} data-reveal>
      <article className={styles.card}>
        <div className={styles.media}>
          <Image
            src={option.image}
            alt={option.imageAlt}
            fill
            sizes="(max-width: 720px) 92vw, (max-width: 1100px) 46vw, 440px"
            className={styles.image}
          />
        </div>

        <div className={styles.body}>
          <h3 className={styles.cardName}>{option.name}</h3>
          <p className={styles.tagline}>{option.tagline}</p>

          <p className={styles.description}>{option.description}</p>

          <dl className={styles.specs}>
            <div className={styles.spec}>
              <dt>Privacy</dt>
              <dd>{privacyLabel[option.privacy]}</dd>
            </div>
            <div className={styles.spec}>
              <dt>Upkeep</dt>
              <dd>{maintenanceLabel[option.maintenance]}</dd>
            </div>
            <div className={styles.spec}>
              <dt>Longevity</dt>
              <dd>{option.lifespan}</dd>
            </div>
            <div className={`${styles.spec} ${styles.specPrice}`}>
              <dt>
                {option.isEstimate ? "Typical inst. est.*" : "Installed"}
              </dt>
              <dd>
                {option.estimateLowUsdPerFooter == null || option.estimateHighUsdPerFooter == null
                  ? "Request a Custom Quote"
                  : `${priceLine(option)}${option.isEstimate ? "*" : ""}`}
              </dd>
            </div>
          </dl>

          <ul className={styles.advantages} aria-label="Main advantages">
            {option.advantages.map((advantage) => (
              <li key={advantage}>{advantage}</li>
            ))}
          </ul>

          <p className={styles.line}>
            <span className={styles.lineLabel}>Best for</span> {option.applications.join(" · ")}
          </p>
          <p className={styles.line}>
            <span className={styles.lineLabel}>Styles</span> {option.styles.join(" · ")}
          </p>

          <a
            className={styles.cta}
            href="#quote"
            data-fence-type={option.slug}
            aria-label={`Request pricing for ${option.name}`}
          >
            Request Pricing
            <span className={styles.ctaArrow} aria-hidden="true">
              →
            </span>
          </a>
        </div>
      </article>
    </li>
  );
}
