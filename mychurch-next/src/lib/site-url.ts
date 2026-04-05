const CANONICAL_SITE_URL = "https://samanabyar.online";

export function resolvePublicSiteUrl() {
    const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();

    if (!raw) return CANONICAL_SITE_URL;

    try {
        const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        const host = parsed.hostname.toLowerCase();
        const isLocal = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");

        if (isLocal) return CANONICAL_SITE_URL;

        return parsed.origin;
    } catch {
        return CANONICAL_SITE_URL;
    }
}
