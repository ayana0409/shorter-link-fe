/**
 * Static / Fixed Direct Links Configuration
 *
 * Allows predefined short codes to map directly to destination URLs on the frontend.
 * When a user visits `/s/:code`, if `:code` matches any static link from the environment list:
 * - Redirects immediately via window.location.replace without calling the backend.
 * - Works instantly even when the backend server is sleeping (cold start).
 *
 * Configured dynamically via the REACT_APP_STATIC_LINKS environment variable list.
 */

// Optional in-code fallback mappings (can be left empty if fully configured via .env)
export const STATIC_LINKS = {};

/**
 * Normalizes URL to ensure it has a valid protocol
 * e.g., "abc.com" -> "https://abc.com"
 */
export const normalizeDestinationUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
        return trimmed;
    }
    return `https://${trimmed}`;
};

/**
 * Parses environment variable REACT_APP_STATIC_LINKS into a code -> url map.
 * Supports multiple list formats:
 * 1. Semicolon or newline separated list:
 *    "12345=https://abc.com;67890=https://xyz.com;demo=https://google.com"
 * 2. Comma separated list:
 *    "12345=https://abc.com,67890=https://xyz.com"
 * 3. JSON Object:
 *    '{"12345":"https://abc.com","67890":"https://xyz.com"}'
 * 4. JSON Array:
 *    '[{"code":"12345","url":"https://abc.com"},{"code":"67890","url":"https://xyz.com"}]'
 *
 * @returns {Record<string, string>}
 */
export const parseEnvStaticLinks = () => {
    const raw = process.env.REACT_APP_STATIC_LINKS || process.env.STATIC_LINKS;
    if (!raw || typeof raw !== "string") return {};

    const trimmed = raw.trim();
    if (!trimmed) return {};

    // 1. JSON Format: Object {"code": "url"} or Array [{"code":"...", "url":"..."}]
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                const map = {};
                for (const item of parsed) {
                    const code = item.code || item.shortCode || item.key;
                    const url = item.url || item.destination || item.target || item.value;
                    if (code && url) {
                        map[String(code).trim()] = String(url).trim();
                    }
                }
                return map;
            } else if (typeof parsed === "object" && parsed !== null) {
                const map = {};
                for (const [k, v] of Object.entries(parsed)) {
                    if (k && v) {
                        map[String(k).trim()] = String(v).trim();
                    }
                }
                return map;
            }
        } catch (e) {
            console.warn("[StaticLinks] Failed to parse JSON from REACT_APP_STATIC_LINKS:", e);
        }
    }

    // 2. Delimited List Format (split by semicolon, newline, or comma)
    const result = {};
    const items = trimmed.split(/[\r\n;]+/).flatMap((part) => {
        if (!trimmed.includes(";") && part.includes(",")) {
            return part.split(",");
        }
        return part;
    });

    for (const item of items) {
        const line = item.trim();
        if (!line) continue;

        let code = "";
        let url = "";

        if (line.includes("->")) {
            const parts = line.split("->");
            code = parts[0];
            url = parts.slice(1).join("->");
        } else if (line.includes("=")) {
            const parts = line.split("=");
            code = parts[0];
            url = parts.slice(1).join("=");
        } else if (line.includes("|")) {
            const parts = line.split("|");
            code = parts[0];
            url = parts.slice(1).join("|");
        } else if (line.includes(":") && !line.startsWith("http")) {
            const idx = line.indexOf(":");
            code = line.slice(0, idx);
            url = line.slice(idx + 1);
        }

        if (code && url) {
            result[code.trim()] = url.trim();
        }
    }

    return result;
};

/**
 * Retrieves destination URL for a given short code if it exists in static mappings.
 * Returns normalized URL string or null.
 *
 * @param {string} code - The short code from the URL (e.g., "12345")
 * @returns {string|null} - Destination URL or null
 */
export const getStaticDestinationUrl = (code) => {
    if (!code || typeof code !== "string") return null;

    const normalizedCode = code.trim();
    const envLinks = parseEnvStaticLinks();

    // Priority: Environment variable list > In-code fallback object
    const targetUrl = envLinks[normalizedCode] || STATIC_LINKS[normalizedCode];

    if (targetUrl) {
        return normalizeDestinationUrl(targetUrl);
    }

    return null;
};
