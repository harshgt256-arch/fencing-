"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { whyChooseUs, type BenefitIcon } from "@/data/why-choose-us";
import styles from "./WhyChooseUs.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Stroke icons in the site's existing icon language (24px, round caps). */
function BenefitIconSvg({ icon }: { icon: BenefitIcon }) {
  const props = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (icon) {
    case "materials":
      // Stacked layers = quality material buildup
      return (
        <svg {...props}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 12 12 17 22 12" />
          <polyline points="2 17 12 22 22 17" />
        </svg>
      );
    case "installation":
      // Target = precise, careful installation
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "estimate":
      // Document with lines = written estimate
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case "custom":
      // Sliders = solutions tuned per property
      return (
        <svg {...props}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    case "site":
      // Terrain = site conditions
      return (
        <svg {...props}>
          <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
        </svg>
      );
    case "communication":
      // Chat bubble = ongoing communication
      return (
        <svg {...props}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
  }
}

export default function WhyChooseUs() {
  const sectionRef = useRef<HTMLElement>(null);

  // Entrance reveals: same batched ScrollTrigger pattern as FencingOptions,
  // visible by default and skipped entirely under prefers-reduced-motion.
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
            y: 24,
            duration: 0.55,
            ease: "power2.out",
            stagger: 0.08,
            overwrite: true,
          }),
      });
      ScrollTrigger.refresh();
    }, section);

    return () => cleanup.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="why-choose-us-heading"
    >
      <div className={styles.inner}>
        <header className={styles.header} data-reveal>
          <span className={styles.eyebrow}>{whyChooseUs.eyebrow}</span>
          <h2 id="why-choose-us-heading" className={styles.heading}>
            {whyChooseUs.heading}
          </h2>
          <p className={styles.intro}>{whyChooseUs.intro}</p>
        </header>

        <ul className={styles.grid}>
          {whyChooseUs.benefits.map((benefit) => (
            <li className={styles.cardItem} key={benefit.icon} data-reveal>
              <article className={styles.card}>
                <span className={styles.iconChip}>
                  <BenefitIconSvg icon={benefit.icon} />
                </span>
                <h3 className={styles.cardHeading}>{benefit.heading}</h3>
                <p className={styles.cardDescription}>{benefit.description}</p>
              </article>
            </li>
          ))}
        </ul>

        <div className={styles.closing} data-reveal>
          <p className={styles.closingText}>{whyChooseUs.closing}</p>
          <a className={styles.cta} href="#quote">
            {whyChooseUs.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
