"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function ScrollReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); window.clearTimeout(fallback); } }, { threshold: 0.12, rootMargin: "0px 0px -30px" });
    const fallback = window.setTimeout(() => { setVisible(true); observer.disconnect(); }, 700);
    observer.observe(node);
    return () => { window.clearTimeout(fallback); observer.disconnect(); };
  }, []);
  return <div ref={ref} className={`scroll-reveal ${visible ? "is-visible" : ""} ${className}`}>{children}</div>;
}
