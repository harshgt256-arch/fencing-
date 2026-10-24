"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

let sharedLenis: Lenis | null = null;
let sharedTickerRaf: ((time: number) => void) | null = null;
let subscriberCount = 0;

/**
 * Shared Lenis smooth-scroll instance driven by GSAP's ticker.
 *
 * One coordinated frame loop: gsap.ticker -> lenis.raf -> ScrollTrigger.update.
 * `autoRaf: false` lets GSAP own the RAF loop so there is a single
 * coordinated animation loop rather than competing requestAnimationFrame calls.
 *
 * Touch devices (smartphones/tablets) use native 120Hz hardware-accelerated
 * momentum scrolling without Lenis interception, which prevents iOS/Android
 * touch gesture lag and keeps ScrollTrigger perfectly in sync with native touch.
 */
export function useLenisScroll(): RefObject<Lenis | null> {
  const lenisRef = useRef<Lenis | null>(sharedLenis);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Touch devices already have hardware-accelerated momentum touch scrolling.
    // Lenis is optimized for mousewheel/trackpad desktop smoothing.
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;

    if (isTouch) {
      // On mobile/touch devices, ensure ScrollTrigger natively tracks touch scrolling.
      ScrollTrigger.update();
      return;
    }

    subscriberCount++;

    if (!sharedLenis) {
      sharedLenis = new Lenis({
        autoRaf: false, // GSAP's ticker drives the frame loop
        anchors: true,
      });

      // Keep ScrollTrigger in sync with Lenis' smoothed scroll position.
      sharedLenis.on("scroll", ScrollTrigger.update);

      // Drive Lenis off GSAP's ticker (time is in ms for Lenis).
      sharedTickerRaf = (time: number) => {
        sharedLenis?.raf(time * 1000);
      };
      gsap.ticker.add(sharedTickerRaf);
      gsap.ticker.lagSmoothing(0);
    }

    lenisRef.current = sharedLenis;

    return () => {
      subscriberCount = Math.max(0, subscriberCount - 1);
      if (subscriberCount === 0 && sharedLenis) {
        if (sharedTickerRaf) {
          gsap.ticker.remove(sharedTickerRaf);
          sharedTickerRaf = null;
        }
        sharedLenis.destroy();
        sharedLenis = null;
      }
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
