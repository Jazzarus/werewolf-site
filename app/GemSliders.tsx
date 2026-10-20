"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Drives the gem setup rows in guides (see makeGemSlider in lib/markdown.ts):
 * the arrows slide the row, and on wide screens the hover cards of gems inside
 * the row are positioned on the viewport, because a scrolling row would clip
 * them. Small screens already dock every tooltip to the bottom of the screen.
 */
const WIDE_SCREEN = "(min-width: 48rem)";
const EDGE = 8;
const GAP = 10;

function getParts(slider: Element) {
  return {
    track: slider.querySelector<HTMLElement>(".gemSetups"),
    prev: slider.querySelector<HTMLButtonElement>(".gemSliderPrev"),
    next: slider.querySelector<HTMLButtonElement>(".gemSliderNext"),
  };
}

/** Disables the arrow at either end, and hides both when every card fits. */
function syncArrows(slider: HTMLElement) {
  const { track, prev, next } = getParts(slider);
  if (!track || !prev || !next) return;
  const maxScroll = track.scrollWidth - track.clientWidth;
  slider.dataset.fits = maxScroll <= 2 ? "true" : "false";
  prev.disabled = track.scrollLeft <= 2;
  next.disabled = track.scrollLeft >= maxScroll - 2;
}

function slide(arrow: HTMLElement) {
  const slider = arrow.closest<HTMLElement>(".gemSlider");
  const track = slider && getParts(slider).track;
  const firstCard = track?.firstElementChild as HTMLElement | null | undefined;
  if (!slider || !track || !firstCard) return;

  // Move by the cards that are in view, so each click turns the page.
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  const pitch = firstCard.offsetWidth + gap;
  const visible = Math.max(1, Math.floor((track.clientWidth + gap + 2) / pitch));
  const direction = arrow.classList.contains("gemSliderPrev") ? -1 : 1;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  track.scrollBy({ left: direction * visible * pitch, behavior: reduceMotion ? "auto" : "smooth" });
}

/** Puts a gem's hover card above (or below) the gem, kept inside the window. */
function placeTooltip(term: HTMLElement) {
  const tooltip = term.querySelector<HTMLElement>(":scope > .gameTooltip");
  if (!tooltip || !window.matchMedia(WIDE_SCREEN).matches) return;

  const anchor = term.getBoundingClientRect();
  const width = tooltip.offsetWidth;
  const height = tooltip.offsetHeight;
  const left = anchor.left + anchor.width / 2 - width / 2;
  const above = anchor.top - GAP - height;
  const top = above >= EDGE ? above : anchor.bottom + GAP;

  // Custom properties, so the docked tooltips of small screens are never overridden.
  tooltip.style.setProperty("--tip-left", `${Math.max(EDGE, Math.min(left, window.innerWidth - width - EDGE))}px`);
  tooltip.style.setProperty("--tip-top", `${Math.max(EDGE, top)}px`);
}

function closestFromEvent(event: Event, selector: string) {
  return event.target instanceof Element ? event.target.closest<HTMLElement>(selector) : null;
}

export function GemSliders() {
  const pathname = usePathname();

  // Arrow state for the rows on the current page.
  useEffect(() => {
    const sliders = Array.from(document.querySelectorAll<HTMLElement>(".gemSlider"));
    const cleanups = sliders.map((slider) => {
      const { track } = getParts(slider);
      if (!track) return () => {};
      const update = () => syncArrows(slider);
      track.addEventListener("scroll", update, { passive: true });
      const observer = new ResizeObserver(update);
      observer.observe(track);
      update();
      return () => {
        track.removeEventListener("scroll", update);
        observer.disconnect();
      };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [pathname]);

  // Arrow clicks and hover cards work through the document, so no per-page setup.
  useEffect(() => {
    let active: HTMLElement | null = null;
    let frame = 0;

    const onClick = (event: MouseEvent) => {
      const arrow = closestFromEvent(event, ".gemSliderArrow");
      if (arrow) slide(arrow);
    };
    const onEnter = (event: Event) => {
      const term = closestFromEvent(event, ".gemSlider .gameTerm");
      if (!term) return;
      active = term;
      // After the hover state has shown the card, so it can be measured.
      window.requestAnimationFrame(() => placeTooltip(term));
    };
    const onMove = () => {
      if (!active || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (active?.matches(":hover, :focus")) placeTooltip(active);
      });
    };

    document.addEventListener("click", onClick);
    document.addEventListener("pointerover", onEnter);
    document.addEventListener("focusin", onEnter);
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerover", onEnter);
      document.removeEventListener("focusin", onEnter);
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
