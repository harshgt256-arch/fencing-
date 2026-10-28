"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./BeforeAfterGlider.module.css";

gsap.registerPlugin(ScrollTrigger);

const CLAMP_MIN = 2;
const CLAMP_MAX = 98;
const INITIAL_POSITION = 50;

export default function BeforeAfterGlider() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const beforeImageRef = useRef<HTMLDivElement>(null);

  const [sliderPosition, setSliderPosition] = useState(INITIAL_POSITION);
  const isDraggingRef = useRef(false);
  const hasAnimatedRef = useRef(false);

  // Pointer drag interaction (works across touch, mouse, and pen anywhere on container)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updatePosition = (clientX: number) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width) return;
      const x = clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      const clamped = Math.min(CLAMP_MAX, Math.max(CLAMP_MIN, percentage));
      setSliderPosition(clamped);
    };

    const onPointerDown = (e: PointerEvent) => {
      // Allow primary mouse click or any touch pointer
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDraggingRef.current = true;
      updatePosition(e.clientX);
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // Fallback if pointer capture is not supported
      }
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDraggingRef.current) {
        updatePosition(e.clientX);
        e.preventDefault();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        try {
          if (container.hasPointerCapture(e.pointerId)) {
            container.releasePointerCapture(e.pointerId);
          }
        } catch {
          // ignore
        }
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  // Keyboard support (arrow keys)
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSliderPosition((prev) => Math.max(CLAMP_MIN, prev - 2));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSliderPosition((prev) => Math.min(CLAMP_MAX, prev + 2));
      }
    };

    handle.addEventListener("keydown", onKeyDown);
    return () => handle.removeEventListener("keydown", onKeyDown);
  }, []);

  // Entrance peek hint animation (once when scrolled into view)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;

            gsap.fromTo(
              { val: 50 },
              { val: 65 },
              {
                duration: 0.8,
                ease: "power2.out",
                yoyo: true,
                repeat: 1,
                onUpdate: function () {
                  if (!isDraggingRef.current) {
                    const progress = this.progress();
                    const pos = 65 - ((progress - 0.5) * 2) * 15;
                    setSliderPosition(pos);
                  }
                },
              }
            );
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} aria-label="Before and after fence installation">
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 className={styles.heading}>See the Transformation</h2>
          <p className={styles.subtitle}>Drag or tap anywhere to reveal the difference</p>
        </header>

        <div ref={containerRef} className={styles.gliderContainer}>
          {/* AFTER image (bottom layer) */}
          <div className={styles.imageLayer}>
            <Image
              src="/images/wood-fence-after.jpg"
              alt="Residential side passageway after fence installation — completed timber wood privacy fence with concrete posts running the full length of the boundary"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1400px) 90vw, 1320px"
              className={`${styles.image} ${styles.desktopOnly}`}
              priority
            />
            <Image
              src="/images/wood-fence-after-mobile.jpg"
              alt="Residential side passageway after fence installation — completed timber wood privacy fence with concrete posts running the full length of the boundary"
              fill
              sizes="(max-width: 768px) 100vw, 440px"
              className={`${styles.image} ${styles.mobileOnly}`}
              priority
            />
          </div>

          {/* BEFORE image (top layer, clipped) */}
          <div
            ref={beforeImageRef}
            className={styles.imageLayer}
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <Image
              src="/images/wood-fence-before.jpg"
              alt="Residential side passageway before fence installation — open boundary with a clear view to the neighboring property"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1400px) 90vw, 1320px"
              className={`${styles.image} ${styles.desktopOnly}`}
              priority
            />
            <Image
              src="/images/wood-fence-before-mobile.jpg"
              alt="Residential side passageway before fence installation — open boundary with a clear view to the neighboring property"
              fill
              sizes="(max-width: 768px) 100vw, 440px"
              className={`${styles.image} ${styles.mobileOnly}`}
              priority
            />
          </div>

          {/* Vertical divider line */}
          <div
            className={styles.divider}
            style={{ left: `${sliderPosition}%` }}
            aria-hidden="true"
          />

          {/* Drag handle */}
          <div
            ref={handleRef}
            className={styles.handle}
            style={{ left: `${sliderPosition}%` }}
            role="slider"
            aria-label="Before and after comparison position"
            aria-valuemin={CLAMP_MIN}
            aria-valuemax={CLAMP_MAX}
            aria-valuenow={Math.round(sliderPosition)}
            tabIndex={0}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
              <polyline points="9 18 3 12 9 6" />
            </svg>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
              <polyline points="15 18 21 12 15 6" />
            </svg>
          </div>

          {/* Text labels */}
          <span className={`${styles.label} ${styles.labelBefore}`}>Before</span>
          <span className={`${styles.label} ${styles.labelAfter}`}>After</span>
        </div>
      </div>
    </section>
  );
}
