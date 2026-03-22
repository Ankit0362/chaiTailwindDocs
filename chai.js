function createChaiRuntime() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      init() {
        return null;
      },
      scan() {},
      destroy() {},
      toggleDarkMode() {},
    };
  }

  let style = null;
  let observer = null;
  let initialized = false;

  const ensureStyle = () => {
    if (style && style.isConnected) return style;

    style = document.querySelector("style[data-chai-runtime='true']");
    if (!style) {
      style = document.createElement("style");
      style.setAttribute("data-chai-runtime", "true");
      (document.head || document.documentElement).appendChild(style);
    }
    return style;
  };

  const cache = new Set();

  const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 };

  const spacing = Object.fromEntries(
    Array.from({ length: 301 }, (_, i) => [i, i * 4 + "px"]),
  );

  const colors = {
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
      950: "#030712",
    },
    red: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
    },
    green: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
    blue: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    indigo: {
      50: "#eef2ff",
      100: "#e0e7ff",
      200: "#c7d2fe",
      300: "#a5b4fc",
      400: "#818cf8",
      500: "#6366f1",
      600: "#4f46e5",
      700: "#4338ca",
      800: "#3730a3",
      900: "#312e81",
    },
    purple: {
      50: "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7e22ce",
      800: "#6b21a8",
      900: "#581c87",
    },
    pink: {
      50: "#fdf2f8",
      100: "#fce7f3",
      200: "#fbcfe8",
      300: "#f9a8d4",
      400: "#f472b6",
      500: "#ec4899",
      600: "#db2777",
      700: "#be185d",
      800: "#9d174d",
      900: "#831843",
    },
    white: "#ffffff",
    black: "#000000",
    transparent: "transparent",
  };

  const animationCss = `
@keyframes fade-in{from{opacity:0}to{opacity:1}}
@keyframes slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes slide-down{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
@keyframes slide-left{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
@keyframes slide-right{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes scale-in{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes scale-out{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.9)}}
@keyframes rotate-in{from{opacity:0;transform:rotate(-10deg)}to{opacity:1;transform:rotate(0)}}
@keyframes zoom-in{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}
@keyframes zoom-out{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.5)}}
@keyframes flip-x{from{transform:rotateX(90deg)}to{transform:rotateX(0)}}
@keyframes flip-y{from{transform:rotateY(90deg)}to{transform:rotateY(0)}}
@keyframes swing{0%{transform:rotate(0deg)}15%{transform:rotate(15deg)}30%{transform:rotate(-10deg)}45%{transform:rotate(8deg)}60%{transform:rotate(-5deg)}75%{transform:rotate(3deg)}100%{transform:rotate(0deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes bounce{0%,100%{transform:translateY(-25%)}50%{transform:translateY(0)}}
@keyframes heartbeat{0%,100%{transform:scale(1)}25%{transform:scale(1.15)}50%{transform:scale(1.3)}}
@keyframes flash{0%,50%,100%{opacity:1}25%,75%{opacity:0.2}}
@keyframes shake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-5px)}20%,40%,60%,80%{transform:translateX(5px)}}
`;

  const insert = (rule) => {
    try {
      const styleEl = ensureStyle();
      if (!styleEl.sheet) return;
      styleEl.sheet.insertRule(rule, styleEl.sheet.cssRules.length);
    } catch {}
  };

  const toCss = (obj) =>
    Object.entries(obj)
      .map(
        ([k, v]) =>
          k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()) +
          ":" +
          v +
          "!important",
      )
      .join(";");

  const hexToRgb = (hex) => {
    if (hex === "transparent") return "0,0,0";
    hex = hex.replace("#", "");
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((x) => x + x)
        .join("");
    const num = parseInt(hex, 16);
    return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`;
  };

  const utils = {
    flex: { display: "flex" },
    grid: { display: "grid" },
    block: { display: "block" },
    inline: { display: "inline-block" },
    hidden: { display: "none" },
    relative: { position: "relative" },
    absolute: { position: "absolute" },
    fixed: { position: "fixed" },
    "flex-col": { flexDirection: "column" },
    "justify-between": { justifyContent: "space-between" },
    "items-center": { alignItems: "center" },
    "text-center": { textAlign: "center" },
    "font-bold": { fontWeight: "700" },
    "w-full": { width: "100%" },
    "h-full": { height: "100%" },
    "rounded-lg": { borderRadius: "12px" },
    "rounded-full": { borderRadius: "9999px" },
    transition: { transition: "all .3s ease" },
    "animate-fade": {
      animation:
        "fade-in var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
    },
    "animate-slide-up": {
      animation:
        "slide-up var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
    },
    "animate-slide-down": {
      animation:
        "slide-down var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
    },
    "animate-slide-left": {
      animation:
        "slide-left var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
    },
    "animate-slide-right": {
      animation:
        "slide-right var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
    },
    "animate-scale": {
      animation:
        "scale-in var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
    },
    "animate-scale-out": {
      animation:
        "scale-out var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
    },
    "animate-rotate": {
      animation:
        "rotate-in var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
    },
    "animate-zoom-in": {
      animation:
        "zoom-in var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
    },
    "animate-zoom-out": {
      animation:
        "zoom-out var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
    },
    "animate-flip-x": {
      animation:
        "flip-x var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
      perspective: "1000px",
    },
    "animate-flip-y": {
      animation:
        "flip-y var(--chai-duration,0.8s) var(--chai-ease,ease) var(--chai-delay,0s) 1 forwards",
      perspective: "1000px",
    },
    "animate-swing": {
      animation:
        "swing var(--chai-duration,0.8s) var(--chai-ease,ease-in-out) var(--chai-delay,0s) 1 forwards",
      transformOrigin: "top center",
    },
    "animate-pulse": { animation: "pulse 2s infinite" },
    "animate-bounce": { animation: "bounce 1s infinite" },
    "animate-heartbeat": {
      animation:
        "heartbeat var(--chai-duration,0.8s) var(--chai-ease,ease-in-out) var(--chai-delay,0s) infinite",
      transformOrigin: "center",
    },
    "animate-flash": {
      animation:
        "flash var(--chai-duration,0.8s) var(--chai-ease,ease-in-out) var(--chai-delay,0s) infinite",
    },
    "animate-shake": {
      animation:
        "shake var(--chai-duration,0.8s) var(--chai-ease,ease-in-out) var(--chai-delay,0s) 1 forwards",
    },
  };

  Object.entries(spacing).forEach(([k, v]) => {
    utils[`p-${k}`] = { padding: v };
    utils[`px-${k}`] = { paddingLeft: v, paddingRight: v };
    utils[`py-${k}`] = { paddingTop: v, paddingBottom: v };
    utils[`m-${k}`] = { margin: v };
    utils[`mx-${k}`] = { marginLeft: v, marginRight: v };
    utils[`my-${k}`] = { marginTop: v, marginBottom: v };
    utils[`w-${k}`] = { width: v };
    utils[`h-${k}`] = { height: v };
    utils[`top-${k}`] = { top: v };
    utils[`left-${k}`] = { left: v };
    utils[`right-${k}`] = { right: v };
    utils[`bottom-${k}`] = { bottom: v };
    utils[`gap-${k}`] = { gap: v };
  });

  const fs = {
    1: "0.75rem",
    2: "0.875rem",
    3: "1rem",
    4: "1.125rem",
    5: "1.25rem",
    6: "1.5rem",
    10: "3rem",
  };
  Object.entries(fs).forEach(([k, v]) => (utils[`fs-${k}`] = { fontSize: v }));

  for (let i = 1; i <= 12; i++)
    utils[`cols-${i}`] = { gridTemplateColumns: `repeat(${i},1fr)` };

  Object.entries(colors).forEach(([c, shades]) => {
    const apply = (n, v) => {
      utils[`bg-${n}`] = { backgroundColor: v };
      utils[`text-${n}`] = { color: v };
      utils[`border-${n}`] = { borderColor: v };
    };
    if (typeof shades === "object")
      Object.entries(shades).forEach(([s, v]) => apply(`${c}-${s}`, v));
    else apply(c, shades);
  });

  const durations = {
    50: "50ms",
    75: "75ms",
    100: "100ms",
    150: "150ms",
    200: "200ms",
    300: "300ms",
    500: "500ms",
    700: "700ms",
    1000: "1s",
    1500: "1.5s",
    2000: "2s",
    3000: "3s",
    5000: "5s",
  };
  Object.entries(durations).forEach(
    ([k, v]) => (utils[`duration-${k}`] = { "--chai-duration": v }),
  );

  const delays = {
    75: "75ms",
    100: "100ms",
    150: "150ms",
    200: "200ms",
    300: "300ms",
    500: "500ms",
    700: "700ms",
    1000: "1s",
  };
  Object.entries(delays).forEach(
    ([k, v]) => (utils[`delay-${k}`] = { "--chai-delay": v }),
  );

  const easings = {
    linear: "linear",
    ease: "ease",
    "ease-in": "ease-in",
    "ease-out": "ease-out",
    "ease-in-out": "ease-in-out",
  };
  Object.entries(easings).forEach(
    ([k, v]) => (utils[`ease-${k}`] = { "--chai-ease": v }),
  );

  const speeds = {
    "ultra-fast": "0.2s",
    "very-fast": "0.5s",
    fast: "1s",
    normal: "0.8s",
    slow: "3s",
    "very-slow": "5s",
    "ultra-slow": "8s",
  };
  Object.entries(speeds).forEach(
    ([k, v]) => (utils[`speed-${k}`] = { "--chai-duration": v }),
  );

  const createRule = (cls, styles, variants, medias) => {
    const key = cls + variants.join("") + medias.join("");
    if (cache.has(key)) return;
    cache.add(key);

    let selector = "." + cls.replace(/[:\/\[\]#]/g, "\\$&");

    variants.forEach((v) => {
      if (v === "hover") selector += ":hover";
      if (v === "dark") selector = ".dark " + selector;
      if (v === "group-hover")
        selector = `.group:hover ${selector}, .chai-group:hover ${selector}`;
    });

    let rule = `${selector}{${toCss(styles)}}`;

    medias.forEach((m) => {
      rule = `@media (min-width:${m}px){${rule}}`;
    });

    insert(rule);
  };

  const parse = (cls) => {
    if (!cls.startsWith("chai-")) return;

    let raw = cls
      .replace("chai-", "")
      .replace(/hover-|group-hover-|dark-|sm-|md-|lg-|xl-/g, (m) =>
        m.replace("-", ":"),
      );

    const parts = raw.split(":");
    const variants = [],
      medias = [];
    let base = parts.pop();

    parts.forEach((p) => {
      if (breakpoints[p]) medias.push(breakpoints[p]);
      else variants.push(p);
    });

    let styles;

    if (base.includes("/")) {
      const [colorPart, opacity] = base.split("/");
      const [type, col, shade] = colorPart.split("-");
      const val = colors[col]?.[shade] || colors[col];
      if (val) {
        const prop =
          type === "bg"
            ? "backgroundColor"
            : type === "border"
              ? "borderColor"
              : "color";
        styles = { [prop]: `rgba(${hexToRgb(val)},${opacity / 100})` };
      }
    } else {
      styles = utils[base];
    }

    if (styles) createRule(cls, styles, variants, medias);
  };

  const scan = (root = document) => {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("[class*='chai-']").forEach((el) => {
      el.classList.forEach((cls) => parse(cls));
    });
  };

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      window.localStorage.setItem("chai-theme", isDark ? "dark" : "light");
    } catch {}
  };

  const init = () => {
    if (initialized) {
      scan();
      return { scan, destroy, toggleDarkMode };
    }

    const styleEl = ensureStyle();
    if (!styleEl.textContent.includes("@keyframes fade-in")) {
      styleEl.textContent += animationCss;
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => scan(), {
        once: true,
      });
    } else {
      scan();
    }

    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          m.addedNodes.forEach((n) => n.nodeType === 1 && scan(n));
          if (m.type === "attributes" && m.attributeName === "class") {
            scan(m.target);
          }
        });
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    initialized = true;
    return { scan, destroy, toggleDarkMode };
  };

  const destroy = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    initialized = false;
  };

  return { init, scan, destroy, toggleDarkMode };
}

const chaiRuntime = createChaiRuntime();

if (typeof module !== "undefined" && module.exports) {
  module.exports = chaiRuntime;
}

if (typeof window !== "undefined") {
  window.ChaiCSS = chaiRuntime;
  window.toggleDarkMode = chaiRuntime.toggleDarkMode;
  chaiRuntime.init();
}
