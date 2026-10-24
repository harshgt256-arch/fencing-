"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./FinalCta.module.css";

gsap.registerPlugin(ScrollTrigger);

const COPY = {
  eyebrow: "LET'S GET STARTED",
  heading: "Ready to Transform Your Property?",
  intro:
    "Tell us about your property, fencing style preferences, project timeline, and budget. Our team will review your requirements and provide a clear, itemized fencing estimate tailored to your home.",
  primaryLabel: "Get a Free Fencing Estimate",
  primaryHref: "#quote",
  secondaryLabel: "Explore Fencing Options",
  secondaryHref: "#fencing-options",
  badges: [
    "Tailored to your property & layout",
    "Clear, itemized proposals",
    "Quality materials & craftsmanship",
  ],
};

export default function FinalCta() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Subtle GSAP ScrollTrigger entrance animation with short opacity + scale transition
  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    // Respect prefers-reduced-motion: skip GSAP transition entirely
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const cleanup = gsap.context(() => {
      gsap.from(content, {
        autoAlpha: 0,
        scale: 0.95,
        y: 18,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          once: true,
        },
      });
    }, section);

    return () => cleanup.revert();
  }, []);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    const id = targetId.replace(/^#/, "");
    const targetElement = document.getElementById(id);

    if (targetElement) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      targetElement.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      // Update URL hash cleanly without instant jump
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="final-cta"
      className={styles.section}
      aria-labelledby="final-cta-heading"
    >
      {/* Background residential fencing image with restrained overlay */}
      <div className={styles.bgContainer} aria-hidden="true">
        <Image
          src="/images/wood-fence-after.jpg"
          alt=""
          fill
          sizes="100vw"
          className={styles.bgImage}
          priority={false}
        />
        <div className={styles.overlay} />
      </div>

      <div className={styles.inner}>
        <div ref={contentRef} className={styles.content}>
          <div className={styles.eyebrowBadge}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            <span className={styles.eyebrowText}>{COPY.eyebrow}</span>
          </div>

          <h2 id="final-cta-heading" className={styles.heading}>
            {COPY.heading}
          </h2>

          <p className={styles.intro}>{COPY.intro}</p>

          <div className={styles.actions}>
            {/* Primary Action: navigate to the inquiry form */}
            <a
              className={styles.primaryBtn}
              href={COPY.primaryHref}
              onClick={(e) => handleSmoothScroll(e, COPY.primaryHref)}
            >
              <span>{COPY.primaryLabel}</span>
              <svg
                className={styles.btnIcon}
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4.167 10h11.666m-5-5l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            {/* Secondary Action: back to fencing options & pricing */}
            <a
              className={styles.secondaryBtn}
              href={COPY.secondaryHref}
              onClick={(e) => handleSmoothScroll(e, COPY.secondaryHref)}
            >
              <span>{COPY.secondaryLabel}</span>
            </a>
          </div>

          {/* Reassurance points */}
          <ul className={styles.reassuranceList} aria-label="Our project standards">
            {COPY.badges.map((badge, idx) => (
              <li key={idx} className={styles.reassuranceItem}>
                <svg
                  className={styles.checkIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M16.667 5L7.5 14.167 3.333 10"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{badge}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
