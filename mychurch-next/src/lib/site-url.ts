const CANONICAL_SITE_URL = "https://www.iranianchurchdc.com";

export function normalizeSiteOrigin(raw: string | undefined | null, fallback = CANONICAL_SITE_URL) {
    const trimmed = (raw || "").trim();
    if (!trimmed) return fallback;

    try {
        const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
        return parsed.origin;
    } catch {
        return fallback;
    }
}

export function resolveAuthCallbackOrigin(requestUrl: URL, headers: Headers) {
    const siteUrl = normalizeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL, "");
    if (siteUrl) {
        return siteUrl;
    }

    const forwardedHost = headers.get("x-forwarded-host") || headers.get("host");
    const forwardedProto = headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");

    if (forwardedHost) {
        let origin = `${forwardedProto}://${forwardedHost}`;
        if (origin.startsWith("https://localhost:")) {
            origin = origin.replace("https://", "http://");
        }
        return origin;
    }

    return requestUrl.origin;
}

export function resolvePublicSiteUrl() {
    // Client-side: prefer an explicit NEXT_PUBLIC_SITE_URL when provided (build-time env).
    // This prevents OAuth redirects to unintended origins when behind proxies/CDNs.
    if (typeof window !== "undefined") {
        const clientEnv = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
        if (clientEnv) {
            return normalizeSiteOrigin(clientEnv, CANONICAL_SITE_URL);
        }

        // Fall back to the actual browser origin when no env is set (local dev).
        return window.location.origin;
    }

    // Server-side fallback
    return normalizeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL, CANONICAL_SITE_URL);
}
