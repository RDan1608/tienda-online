"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/**
 * FLIP: cuando cambia la lista, las tarjetas que ya estaban se deslizan desde su posición
 * anterior a la nueva en vez de saltar. Solo anima `transform` (GPU) y nunca bloquea el clic.
 * Las tarjetas nuevas se animan con CSS (.card-in); las que salen simplemente desaparecen.
 */
export function useFlip(container: RefObject<HTMLElement | null>, key: string) {
  const previous = useRef(new Map<string, { x: number; y: number }>());

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, { x: number; y: number }>();

    root.querySelectorAll<HTMLElement>("[data-flip]").forEach((node) => {
      const id = node.dataset.flip!;
      // offsetLeft/Top ignoran transforms en curso y el scroll: son posiciones de layout reales.
      const pos = { x: node.offsetLeft, y: node.offsetTop };
      next.set(id, pos);

      const before = previous.current.get(id);
      if (!before || reduce || (before.x === pos.x && before.y === pos.y)) return;

      node.getAnimations().forEach((a) => a.cancel());
      node.animate(
        [{ transform: `translate(${before.x - pos.x}px, ${before.y - pos.y}px)` }, { transform: "translate(0, 0)" }],
        { duration: 320, easing: EASE_OUT },
      );
    });

    previous.current = next;
  }, [container, key]);
}
