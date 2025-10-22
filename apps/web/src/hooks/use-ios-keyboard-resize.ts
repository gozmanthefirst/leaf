import { useEffect } from "react";

function isIOSLike(): boolean {
  const ua = navigator.userAgent || "";
  // iPhone/iPad/iPod, plus iPadOS (Mac desktop UA with touch)
  const isiOSDevice = /\b(iPhone|iPad|iPod)\b/i.test(ua);
  const isIPadOSDesktopUA =
    /\bMacintosh\b/.test(ua) && navigator.maxTouchPoints > 1;
  return isiOSDevice || isIPadOSDesktopUA;
}

export function useIOSKeyboardResize(rootId = "app-root") {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isIOSLike()) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const rootEl = document.getElementById(rootId);
    if (!rootEl) return;

    const update = () => {
      const h = Math.round(vv.height);
      const kb = Math.max(0, window.innerHeight - h - vv.offsetTop);

      document.documentElement.style.setProperty("--vvh", `${h}px`);
      document.documentElement.style.setProperty("--kb", `${kb}px`);

      rootEl.style.minHeight = "var(--vvh)";
      rootEl.style.height = "var(--vvh)";
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
      document.documentElement.style.removeProperty("--vvh");
      document.documentElement.style.removeProperty("--kb");
      rootEl.style.removeProperty("min-height");
      rootEl.style.removeProperty("height");
    };
  }, [rootId]);
}
