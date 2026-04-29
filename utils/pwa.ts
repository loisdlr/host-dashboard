/**
 * PWA setup for the web build of Cozy Manhattan.
 *
 * Injects the manifest link, theme-color meta, apple-touch-icon, and
 * registers the service worker. Safe to call on web only.
 */
export function setupPwa() {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  ensureLink({ rel: "manifest", href: "/manifest.webmanifest" });
  ensureLink({
    rel: "apple-touch-icon",
    href: "/icon.png",
  });
  ensureLink({
    rel: "icon",
    type: "image/png",
    href: "/icon.png",
  });

  ensureMeta({ name: "theme-color", content: "#0E7C7B" });
  ensureMeta({ name: "application-name", content: "Cozy Manhattan" });
  ensureMeta({ name: "apple-mobile-web-app-capable", content: "yes" });
  ensureMeta({ name: "mobile-web-app-capable", content: "yes" });
  ensureMeta({
    name: "apple-mobile-web-app-status-bar-style",
    content: "black-translucent",
  });
  ensureMeta({ name: "apple-mobile-web-app-title", content: "Cozy" });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("SW registration failed:", err);
      });
    });
  }
}

function ensureLink(attrs: {
  rel: string;
  href: string;
  type?: string;
}) {
  const selector = attrs.type
    ? `link[rel="${attrs.rel}"][type="${attrs.type}"]`
    : `link[rel="${attrs.rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.rel = attrs.rel;
    if (attrs.type) el.type = attrs.type;
    document.head.appendChild(el);
  }
  if (el.href !== attrs.href) el.href = attrs.href;
}

function ensureMeta(attrs: { name: string; content: string }) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${attrs.name}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.name = attrs.name;
    document.head.appendChild(el);
  }
  if (el.content !== attrs.content) el.content = attrs.content;
}
