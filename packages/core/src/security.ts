import { createHmac } from "crypto";

export interface SignOptions {
  expiresIn?: number; // seconds
}

export function signUrl(path: string, secret: string, options?: SignOptions): string {
  const urlObj = new URL(path, "http://dummy"); // Handle relative paths

  if (options?.expiresIn) {
    const expires = Math.floor(Date.now() / 1000) + options.expiresIn;
    urlObj.searchParams.set("e", expires.toString());
  }

  // Remove existing signature if present to prevent double signing issues
  urlObj.searchParams.delete("s");

  const signature = generateSignature(urlObj.pathname + urlObj.search, secret);
  urlObj.searchParams.set("s", signature);

  // Return path + query (remove dummy origin)
  return urlObj.pathname + urlObj.search;
}

export function verifyUrl(path: string, secret: string): boolean {
  const urlObj = new URL(path, "http://dummy");
  const signature = urlObj.searchParams.get("s");
  const expires = urlObj.searchParams.get("e");

  if (!signature) return false;

  // Check expiration if present
  if (expires) {
    const now = Math.floor(Date.now() / 1000);
    if (now > parseInt(expires, 10)) {
      return false;
    }
  }

  // Reconstruction of the string to sign:
  // We need to verify the signature against the path and ALL params EXCEPT 's'.
  urlObj.searchParams.delete("s");

  const expectedSignature = generateSignature(urlObj.pathname + urlObj.search, secret);

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(signature, expectedSignature);
}

function generateSignature(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url"); // stricter, url-safe base64
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
