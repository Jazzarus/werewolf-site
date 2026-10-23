"use client";

import { useEffect } from "react";

/**
 * Enlarges the passive tree screenshots in guides ("::tree-image[slug]", see
 * treeImages in lib/markdown.ts). A click opens the picture over the page,
 * fitted to the window; a click on the picture switches between fitted and
 * full size (scrollable, centred on the spot that was clicked). Escape, the
 * close button, or a click outside the picture closes it.
 */
function openViewer(opener: HTMLElement, source: HTMLImageElement) {
  const overlay = document.createElement("div");
  overlay.className = "zoomOverlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", source.alt || "Enlarged image");
  overlay.dataset.size = "fit";

  const stage = document.createElement("div");
  stage.className = "zoomStage";
  stage.tabIndex = 0;

  const image = document.createElement("img");
  image.className = "zoomImage";
  image.src = source.currentSrc || source.src;
  image.alt = source.alt;
  stage.append(image);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "zoomClose";
  close.setAttribute("aria-label", "Close the enlarged image");
  close.textContent = "×";

  const hint = document.createElement("p");
  hint.className = "zoomHint";
  hint.textContent = "Click the image to switch between fitted and full size. Esc to close.";

  overlay.append(stage, close, hint);
  document.body.append(overlay);

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  close.focus();

  function dismiss() {
    document.removeEventListener("keydown", onKey, true);
    document.body.style.overflow = previousOverflow;
    overlay.remove();
    opener.focus();
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      dismiss();
    } else if (event.key === "Tab") {
      // Keep focus inside the viewer: close button and the scrollable stage.
      event.preventDefault();
      (document.activeElement === close ? stage : close).focus();
    }
  }

  function toggleSize(event: MouseEvent) {
    const box = image.getBoundingClientRect();
    const x = box.width ? (event.clientX - box.left) / box.width : 0.5;
    const y = box.height ? (event.clientY - box.top) / box.height : 0.5;
    const toFull = overlay.dataset.size !== "full";
    overlay.dataset.size = toFull ? "full" : "fit";
    if (toFull) {
      // Centre the full-size picture on the point that was clicked.
      stage.scrollLeft = x * image.offsetWidth - stage.clientWidth / 2;
      stage.scrollTop = y * image.offsetHeight - stage.clientHeight / 2;
    }
  }

  image.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSize(event);
  });
  stage.addEventListener("click", dismiss);
  close.addEventListener("click", dismiss);
  document.addEventListener("keydown", onKey, true);
}

export function ImageZoom() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLElement>(".treeImageButton");
      const image = button?.querySelector<HTMLImageElement>("img");
      if (button && image) openViewer(button, image);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
