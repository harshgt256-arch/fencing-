"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { testimonials, aggregateRating } from "@/data/testimonials";
import styles from "./Testimonials.module.css";

gsap.registerPlugin(ScrollTrigger);

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars}>
      <span aria-hidden="true">
        {"★".repeat(rating)}
        <span className={styles.starsEmpty}>{"★".repeat(5 - rating)}</span>
      </span>
      <span className={styles.starsSrOnly}>{`Rated ${rating} out of 5`}</span>
    </span>
  );
}

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // -------- Prev/next + keyboard navigation --------
  const stepBy = (direction: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector("li");
    const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 24;
    const step = slide ? slide.getBoundingClientRect().width + gap : track.clientWidth;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  // -------- Mouse drag-to-scroll (touch swiping is native) --------
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let isDown = false;
    let dragged = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // let native touch scrolling take over
      isDown = true;
      dragged = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > 6) {
        dragged = true;
        track.classList.add(styles.dragging);
        track.setPointerCapture(e.pointerId);
      }
      if (dragged) {
        track.scrollLeft = startScroll - dx;
        e.preventDefault();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove(styles.dragging);
      if (dragged && track.hasPointerCapture(e.pointerId)) {
        track.releasePointerCapture(e.pointerId);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepBy(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepBy(1);
      }
    };

    track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("keydown", onKeyDown);

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      track.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // -------- Entrance reveals (same batched pattern as the other sections) --------
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
            duration: 0.6,
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
      aria-labelledby="testimonials-heading"
    >
      <div className={styles.inner}>
        <header className={styles.header} data-reveal>
          <h2 id="testimonials-heading" className={styles.heading}>
            What Our Customers Say
          </h2>
          <p className={styles.intro}>
            Feedback from homeowners who trusted us with their property — the
            way we actually work, in their words.
          </p>

          {/* Aggregate rating summary: rendered only when verified data exists */}
          {aggregateRating && (
            <p className={styles.aggregate}>
              <Stars rating={Math.round(aggregateRating.rating)} />
              {`${aggregateRating.rating.toFixed(1)} / ${aggregateRating.ratingMax} · ${aggregateRating.count} verified reviews${aggregateRating.source ? ` · ${aggregateRating.source}` : ""}`}
            </p>
          )}
        </header>

        <div className={styles.carousel} data-reveal>
          <div
            ref={trackRef}
            className={styles.track}
            role="group"
            aria-label="Customer testimonials — scroll horizontally or use the arrow keys"
            tabIndex={0}
          >
            {testimonials.map((testimonial) => (
              <li className={styles.cardItem} key={testimonial.id}>
                <figure className={styles.card}>
                  <span aria-hidden="true" className={styles.quoteMark}>
                    “
                  </span>

                  {testimonial.rating != null && (
                    <div className={styles.cardMeta}>
                      <Stars rating={testimonial.rating} />
                    </div>
                  )}

                  <blockquote className={styles.quote}>
                    {testimonial.quote}
                  </blockquote>

                  <figcaption className={styles.caption}>
                    <span className={styles.customer}>{testimonial.customerName}</span>
                    <span className={styles.captionMeta}>
                      {testimonial.date}
                      {testimonial.source && (
                        <a
                          className={styles.sourceBadge}
                          href={testimonial.sourceUrl ?? undefined}
                          {...(testimonial.sourceUrl
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {testimonial.source}
                        </a>
                      )}
                    </span>
                  </figcaption>

                  {testimonial.isPlaceholder && (
                    <span className={styles.sampleBadge}>
                      Sample review — replace with customer feedback
                    </span>
                  )}
                </figure>
              </li>
            ))}
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => stepBy(-1)}
              aria-label="Previous reviews"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => stepBy(1)}
              aria-label="Next reviews"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.closing} data-reveal>
          <a className={styles.cta} href="#quote">
            Request Your Fencing Estimate
          </a>
        </div>
      </div>
    </section>
  );
}
