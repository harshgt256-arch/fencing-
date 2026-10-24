"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import styles from "./FrameScrubber.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Exact native frame count of the source video (verified via ffprobe: 192 @ 1920x1080). */
const FRAME_COUNT = 192;
const FRAME_DIR = "/frames/fencing-hero";
/** Pinned scroll distance (px) that drives the full image sequence on desktop. */
const SCROLL_DISTANCE = 4000;
/** ScrollTrigger scrub smoothing (seconds to catch up with scroll). */
const SCRUB = 0.5;
/** Cap device pixel ratio so canvas stays sharp but affordable on Retina. */
const MAX_DPR = 2;
const LOW_MEMORY_CONCURRENCY = 2;
const DEFAULT_CONCURRENCY = 6;

const frameSrc = (index: number): string =>
  `${FRAME_DIR}/frame_${String(index + 1).padStart(4, "0")}.jpg`;

const isLowMemoryDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  return memory !== undefined && memory <= 2;
};

export default function FrameScrubber() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lenisRef = useLenisScroll();

  // Decoded frame cache. Images are HTMLImageElements; `ready[i]` is true once
  // the image is loaded AND decoded, so drawing never triggers a sync decode.
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(FRAME_COUNT).fill(null)
  );
  const readyRef = useRef<boolean[]>(new Array(FRAME_COUNT).fill(false));
  const loadedCountRef = useRef(0);

  // Scroll-driven animation state, mutated by GSAP without React re-renders.
  const stateRef = useRef({ progress: 0 });
  const desiredFrameRef = useRef(0);
  const drawnImageRef = useRef<HTMLImageElement | null>(null);
  const dprCapRef = useRef(MAX_DPR);

  // React state only for the loading indicator (never per scroll tick).
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // -------- Canvas sizing (devicePixelRatio aware, resize safe) --------
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const sizeCanvas = () => {
      const width = window.innerWidth;
      const height = section.clientHeight || window.innerHeight;
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        dprCapRef.current
      );
      const pw = Math.max(1, Math.round(width * dpr));
      const ph = Math.max(1, Math.round(height * dpr));
      if (canvas.width === pw && canvas.height === ph) return;
      canvas.width = pw;
      canvas.height = ph;
    };

    sizeCanvas();

    const redraw = () => {
      const img = imagesRef.current[desiredFrameRef.current];
      if (!img) return;
      drawnImageRef.current = null;
      drawFrame(ctx, img, canvas);
    };

    const observer = new ResizeObserver(() => {
      sizeCanvas();
      redraw();
      ScrollTrigger.refresh();
    });
    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  // -------- Intelligent strided preloading --------
  // Pass 1: Stride 12 (16 keyframes) -> scrubbable across entire duration in ~1.5s
  // Pass 2: Stride 4 (fills gaps to 48 keyframes)
  // Pass 3: Stride 2 (fills gaps to 96 keyframes)
  // Pass 4: Complete remaining frames
  useEffect(() => {
    let disposed = false;
    const lowMemory = isLowMemoryDevice();
    dprCapRef.current = lowMemory ? 1 : MAX_DPR;
    const concurrency = lowMemory ? LOW_MEMORY_CONCURRENCY : DEFAULT_CONCURRENCY;

    const loadImage = (index: number) =>
      new Promise<void>((resolve) => {
        if (disposed || readyRef.current[index]) return resolve();
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          const markReady = () => {
            if (disposed) return resolve();
            imagesRef.current[index] = image;
            readyRef.current[index] = true;
            loadedCountRef.current += 1;
            resolve();
          };
          image
            .decode()
            .then(markReady)
            .catch(() => {
              markReady();
            });
        };
        image.onerror = () => {
          resolve();
        };
        image.src = frameSrc(index);
      });

    // Build strided priority order
    const priorityQueue: number[] = [0];
    const queuedSet = new Set<number>([0]);

    const addStride = (step: number) => {
      for (let i = 0; i < FRAME_COUNT; i += step) {
        if (!queuedSet.has(i)) {
          queuedSet.add(i);
          priorityQueue.push(i);
        }
      }
      if (!queuedSet.has(FRAME_COUNT - 1)) {
        queuedSet.add(FRAME_COUNT - 1);
        priorityQueue.push(FRAME_COUNT - 1);
      }
    };

    addStride(12);
    addStride(4);
    addStride(2);
    addStride(1);

    // Frame 1 renders immediately
    loadImage(0).then(() => {
      if (disposed) return;
      setFirstFrameReady(true);

      let cursor = 1;
      const workers = Array.from({ length: concurrency }, async () => {
        while (cursor < priorityQueue.length) {
          if (disposed) return;
          const index = priorityQueue[cursor];
          cursor += 1;
          if (index !== undefined) {
            await loadImage(index);
          }
          if (disposed) return;
        }
      });
      void Promise.all(workers);
    });

    return () => {
      disposed = true;
      for (let i = 0; i < FRAME_COUNT; i += 1) {
        imagesRef.current[i] = null;
        readyRef.current[i] = false;
      }
      loadedCountRef.current = 0;
    };
  }, []);

  // Loading indicator
  useEffect(() => {
    if (firstFrameReady) return;
    const id = window.setInterval(() => {
      setLoadProgress(loadedCountRef.current / FRAME_COUNT);
    }, 150);
    return () => window.clearInterval(id);
  }, [firstFrameReady]);

  // -------- Scroll-driven scrub --------
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const resolveFrame = (index: number): HTMLImageElement | null => {
      const images = imagesRef.current;
      const ready = readyRef.current;
      if (ready[index] && images[index]) return images[index];
      // Fallback to nearest loaded frame
      for (let next = index - 1; next >= 0; next -= 1) {
        if (ready[next] && images[next]) return images[next];
      }
      for (let next = index + 1; next < FRAME_COUNT; next += 1) {
        if (ready[next] && images[next]) return images[next];
      }
      return null;
    };

    const render = () => {
      const progress = Math.min(1, Math.max(0, stateRef.current.progress));
      const index = Math.round(progress * (FRAME_COUNT - 1));
      desiredFrameRef.current = index;
      const image = resolveFrame(index);
      if (!image || image === drawnImageRef.current) return;
      drawnImageRef.current = image;
      drawFrame(ctx, image, canvas);
      if (
        typeof window !== "undefined" &&
        window.location.search.includes("frameDebug")
      ) {
        (window as unknown as Record<string, unknown>).__frameDebug = {
          progress,
          index,
          drawnSrc: image.src.split("/").pop(),
        };
      }
    };

    const cleanupContext = gsap.context(() => {
      const isMobile = window.innerWidth < 768;
      const scrollDistance = isMobile ? 1800 : SCROLL_DISTANCE;
      const scrubAmount = isMobile ? 0.1 : SCRUB;

      gsap.to(stateRef.current, {
        progress: 1,
        duration: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${scrollDistance}`,
          pin: true,
          scrub: scrubAmount,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    gsap.ticker.add(render);

    return () => {
      gsap.ticker.remove(render);
      cleanupContext.revert();
      drawnImageRef.current = null;
      void lenisRef;
    };
  }, [lenisRef]);

  return (
    <section ref={sectionRef} className={styles.hero} aria-label="Fence installation progress">
      <canvas ref={canvasRef} className={styles.canvas} />
      {!firstFrameReady && (
        <div className={styles.loadBar} aria-hidden="true">
          <div
            className={styles.loadFill}
            style={{ transform: `scaleX(${loadProgress})` }}
          />
        </div>
      )}
    </section>
  );
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvas: HTMLCanvasElement
) {
  const cw = canvas.width;
  const ch = canvas.height;
  const iw = image.naturalWidth || 1920;
  const ih = image.naturalHeight || 1080;

  const scale = Math.max(cw / iw, ch / ih);
  const dw = Math.round(iw * scale);
  const dh = Math.round(ih * scale);
  const dx = Math.round((cw - dw) / 2);
  const dy = Math.round((ch - dh) / 2);

  ctx.drawImage(image, dx, dy, dw, dh);
}
