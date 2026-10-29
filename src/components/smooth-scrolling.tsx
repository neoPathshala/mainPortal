"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

/** Ease stepped mouse wheels; touch, trackpads and nested readers stay native. */
export function SmoothScrolling() {
  const pathname = usePathname();
  useEffect(() => {
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let target = window.scrollY;
    let previousTime = 0;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const maximum = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const animate = (time: number) => {
      target = Math.max(0, Math.min(maximum(), target));
      const elapsed = previousTime ? Math.min(50, time - previousTime) : 16;
      previousTime = time;
      const distance = target - window.scrollY;
      if (Math.abs(distance) < 0.5) {
        window.scrollTo({top: target, behavior: "instant"});
        frame = 0;
        return;
      }
      window.scrollTo({top: window.scrollY + distance * (1 - Math.exp(-elapsed / 110)), behavior: "instant"});
      frame = requestAnimationFrame(animate);
    };
    const wheel = (event: WheelEvent) => {
      // Pixel streams with small/fractional deltas already have device inertia.
      const stepped = event.deltaMode !== 0 || (Number.isInteger(event.deltaY) && Math.abs(event.deltaY) >= 50);
      if (event.defaultPrevented || !event.cancelable || reducedMotion.matches || event.ctrlKey || event.metaKey || event.shiftKey || event.deltaX || !stepped) {
        stop();
        return;
      }
      if (getComputedStyle(document.body).overflowY === "hidden") { stop(); return; }
      for (let element = event.target instanceof Element ? event.target : null; element && element !== document.body && element !== document.documentElement; element = element.parentElement) {
        if (element.matches("textarea, input, [role=dialog], [role=listbox], [contenteditable=true]") || (/auto|scroll|overlay/.test(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight)) {
          stop();
          return;
        }
      }
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      event.preventDefault();
      if (!frame || Math.sign(delta) !== Math.sign(target - window.scrollY)) target = window.scrollY;
      target = Math.max(0, Math.min(maximum(), target + delta));
      if (!frame) { previousTime = 0; frame = requestAnimationFrame(animate); }
    };
    window.addEventListener("wheel", wheel, {passive: false});
    window.addEventListener("pointerdown", stop, {passive: true});
    window.addEventListener("keydown", stop);
    window.addEventListener("touchstart", stop, {passive: true});
    reducedMotion.addEventListener("change", stop);
    return () => {
      stop();
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("touchstart", stop);
      reducedMotion.removeEventListener("change", stop);
    };
  }, [pathname]);
  return null;
}
