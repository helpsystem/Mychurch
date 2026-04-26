const CANONICAL_SITE_URL = "https://www.iranianchurchdc.com";

export function resolvePublicSiteUrl() {
    // If we're on the client side, always use the current window origin.
    // This perfectly handles localhost vs production dynamically.
    if (typeof window !== "undefined") {
        return window.location.origin;
    }

    // Server-side fallback
    const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
    if (!raw) return CANONICAL_SITE_URL;

    try {
        const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        return parsed.origin;
    } catch {
        return CANONICAL_SITE_URL;
    }
}
