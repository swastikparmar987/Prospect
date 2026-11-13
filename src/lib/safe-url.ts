import { URL } from "url";
import dns from "dns/promises";

/**
 * Parses numeric (decimal integer, hex, octal) IP strings into standard dotted-quad IPv4.
 * Example: 2130706433 -> 127.0.0.1, 0x7f000001 -> 127.0.0.1, 0177.0.0.1 -> 127.0.0.1
 */
export function normalizeNumericIp(hostname: string): string | null {
  const clean = hostname.replace(/[\[\]]/g, "").trim().toLowerCase();

  // Decimal integer IP (e.g., 2130706433)
  if (/^\d{8,10}$/.test(clean)) {
    const num = parseInt(clean, 10);
    if (num >= 0 && num <= 4294967295) {
      return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
      ].join(".");
    }
  }

  // Hexadecimal IP (e.g. 0x7f000001)
  if (/^0x[0-9a-f]{8}$/i.test(clean)) {
    const num = parseInt(clean, 16);
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255,
    ].join(".");
  }

  // Dotted notation with octal/hex segments (e.g. 0177.0.0.1 or 0x7f.0.0.1)
  const parts = clean.split(".");
  if (parts.length === 4) {
    const octets: number[] = [];
    for (const p of parts) {
      let val: number;
      if (p.startsWith("0x") || p.startsWith("0X")) {
        val = parseInt(p, 16);
      } else if (p.length > 1 && p.startsWith("0")) {
        val = parseInt(p, 8);
      } else if (/^\d+$/.test(p)) {
        val = parseInt(p, 10);
      } else {
        return null;
      }
      if (isNaN(val) || val < 0 || val > 255) return null;
      octets.push(val);
    }
    return octets.join(".");
  }

  return null;
}

/**
 * Checks whether an IPv4 address falls within private, loopback, or link-local subnets.
 */
export function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }
  const [o1, o2] = parts;

  // 0.0.0.0/8 (Current network)
  if (o1 === 0) return true;
  // 10.0.0.0/8 (RFC1918 Private)
  if (o1 === 10) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;
  // 127.0.0.0/8 (Loopback)
  if (o1 === 127) return true;
  // 169.254.0.0/16 (Link-Local, AWS/GCP metadata)
  if (o1 === 169 && o2 === 254) return true;
  // 172.16.0.0/12 (RFC1918 Private)
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
  // 192.168.0.0/16 (RFC1918 Private)
  if (o1 === 192 && o2 === 168) return true;

  return false;
}

/**
 * Checks whether an IPv6 address is private, loopback, link-local, or IPv4-mapped private.
 */
export function isPrivateIpv6(ipv6: string): boolean {
  const clean = ipv6.replace(/[\[\]]/g, "").trim().toLowerCase();

  // Loopback (::1)
  if (clean === "::1" || clean === "0:0:0:0:0:0:0:1") return true;

  // Unspecified (::)
  if (clean === "::" || clean === "0:0:0:0:0:0:0:0") return true;

  // Link-Local (fe80::/10)
  if (clean.startsWith("fe8") || clean.startsWith("fe9") || clean.startsWith("fea") || clean.startsWith("feb")) {
    return true;
  }

  // Unique Local Addresses (fc00::/7, fd00::/8)
  if (clean.startsWith("fc") || clean.startsWith("fd")) {
    return true;
  }

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or normalized ::ffff:7f00:1 or ::ffff:a9fe:a9fe)
  if (clean.includes("::ffff:")) {
    const mapped = clean.split("::ffff:")[1];
    if (mapped.includes(".")) {
      return isPrivateIpv4(mapped);
    }
    const hexParts = mapped.split(":");
    if (hexParts.length === 2) {
      const high = parseInt(hexParts[0], 16);
      const low = parseInt(hexParts[1], 16);
      if (!isNaN(high) && !isNaN(low)) {
        const o1 = (high >> 8) & 255;
        const o2 = high & 255;
        const o3 = (low >> 8) & 255;
        const o4 = low & 255;
        const ip = `${o1}.${o2}.${o3}.${o4}`;
        return isPrivateIpv4(ip);
      }
    }
  }

  return false;
}

/**
 * Validates whether a target URL is safe for public HTTP inspection.
 * Prevents SSRF attacks against localhost, cloud metadata, RFC1918 private subnets,
 * IPv6 loopbacks, and alternative integer/hex/octal IP formats.
 */
export function isSafePublicUrl(urlString: string): { isSafe: boolean; reason?: string; parsedUrl?: URL } {
  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { isSafe: false, reason: `Unsupported protocol: ${parsed.protocol}. Only http: and https: are permitted.` };
    }

    const rawHostname = parsed.hostname.toLowerCase();

    // 1. Hostname string blocklist
    if (
      rawHostname === "localhost" ||
      rawHostname.endsWith(".localhost") ||
      rawHostname.endsWith(".local") ||
      rawHostname.endsWith(".internal") ||
      rawHostname === "instance-data" ||
      rawHostname === "metadata.google.internal"
    ) {
      return { isSafe: false, reason: "Forbidden: Localhost and internal hostnames are restricted." };
    }

    // 2. Cloud metadata IP blocklist
    if (rawHostname === "169.254.169.254" || rawHostname === "100.100.100.200") {
      return { isSafe: false, reason: "Forbidden: Cloud metadata service endpoints are restricted." };
    }

    // 3. IPv6 checks
    if (rawHostname.includes(":") || rawHostname.startsWith("[")) {
      if (isPrivateIpv6(rawHostname)) {
        return { isSafe: false, reason: "Forbidden: Private or loopback IPv6 address restricted." };
      }
    }

    // 4. Normalized IP checks (handles octal, hex, decimal integers)
    const normalizedIp = normalizeNumericIp(rawHostname);
    if (normalizedIp) {
      if (isPrivateIpv4(normalizedIp)) {
        return { isSafe: false, reason: `Forbidden: Private IP address (${normalizedIp}) restricted.` };
      }
    }

    // 5. Standard dotted IPv4 checks
    if (isPrivateIpv4(rawHostname)) {
      return { isSafe: false, reason: `Forbidden: Private network IP (${rawHostname}) restricted.` };
    }

    return { isSafe: true, parsedUrl: parsed };
  } catch (err) {
    return { isSafe: false, reason: `Malformed URL: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * Cleans and sanitizes a URL if safe, returns null otherwise.
 */
export function sanitizeExternalUrl(urlString?: string | null): string | null {
  if (!urlString || typeof urlString !== "string") return null;
  const check = isSafePublicUrl(urlString.trim());
  return check.isSafe && check.parsedUrl ? check.parsedUrl.toString() : null;
}

/**
 * SSRF-Safe HTTP Fetch with manual redirect revalidation and step inspection.
 * Prevents attackers from using HTTP 302 redirects to pivot into internal networks
 * or cloud metadata endpoints.
 */
export async function safeFetch(
  urlString: string,
  options: RequestInit = {},
  maxRedirects = 5
): Promise<Response> {
  let currentUrl = urlString;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    const safety = isSafePublicUrl(currentUrl);
    if (!safety.isSafe) {
      throw new Error(`SSRF Blocked: Destination ${currentUrl} is not permitted. Reason: ${safety.reason}`);
    }

    // Optional DNS rebinding pre-flight check for domain names
    const parsed = new URL(currentUrl);
    if (!/^[\d.]+$/.test(parsed.hostname) && !parsed.hostname.includes(":")) {
      try {
        const lookup = await dns.lookup(parsed.hostname);
        if (isPrivateIpv4(lookup.address) || isPrivateIpv6(lookup.address)) {
          throw new Error(`SSRF DNS Rebinding Blocked: Hostname ${parsed.hostname} resolved to private IP ${lookup.address}`);
        }
      } catch (err: any) {
        if (err.message.includes("SSRF")) throw err;
        // Ignore DNS resolution errors here; let fetch handle network resolution
      }
    }

    const response = await fetch(currentUrl, {
      ...options,
      redirect: "manual",
    });

    // Check for redirect status codes
    const isRedirect = [301, 302, 303, 307, 308].includes(response.status);
    if (isRedirect) {
      const location = response.headers.get("location");
      if (!location) {
        return response; // No redirect header, return response
      }

      // Resolve relative redirect against current URL
      const nextUrl = new URL(location, currentUrl).toString();
      redirectsCount++;
      if (redirectsCount > maxRedirects) {
        throw new Error(`Too many redirects (exceeded limit of ${maxRedirects})`);
      }

      // Revalidate redirect destination!
      const redirectSafety = isSafePublicUrl(nextUrl);
      if (!redirectSafety.isSafe) {
        throw new Error(
          `SSRF Redirect Blocked: Target redirect destination ${nextUrl} is restricted. Reason: ${redirectSafety.reason}`
        );
      }

      currentUrl = nextUrl;
      continue;
    }

    return response;
  }

  throw new Error(`Too many redirects (exceeded limit of ${maxRedirects})`);
}
