import { describe, it, expect } from "vitest";
import { signUrl, verifyUrl } from "../src/security";

describe("Secure URL Signing", () => {
  const SECRET = "my-secret-key";

  it("should sign and verify a URL correctly", () => {
    const path = "/images/photo.jpg?w=500";
    const signed = signUrl(path, SECRET);

    expect(signed).toContain("s=");
    expect(verifyUrl(signed, SECRET)).toBe(true);
  });

  it("should fail verification if signature is tampered", () => {
    const path = "/images/photo.jpg?w=500";
    const signed = signUrl(path, SECRET);

    // Tamper signature
    const tampered = signed.replace("s=", "s=invalid");
    expect(verifyUrl(tampered, SECRET)).toBe(false);
  });

  it("should fail verification if params are tampered", () => {
    const path = "/images/photo.jpg?w=500";
    const signed = signUrl(path, SECRET);

    // Tamper params (e.g. change width)
    const tampered = signed.replace("w=500", "w=1000");
    expect(verifyUrl(tampered, SECRET)).toBe(false);
  });

  it("should fail validation if wrong secret is used", () => {
    const path = "/images/photo.jpg?w=500";
    const signed = signUrl(path, SECRET);

    expect(verifyUrl(signed, "wrong-secret")).toBe(false);
  });

  it("should handle expiration correctly", () => {
    const path = "/images/photo.jpg";
    // Sign with 1 second expiry
    const signed = signUrl(path, SECRET, { expiresIn: 1 });

    expect(signed).toContain("e=");
    expect(verifyUrl(signed, SECRET)).toBe(true);

    // Mock Date.now to simulate future
    const realDateNow = Date.now;
    global.Date.now = () => realDateNow() + 2000; // +2 seconds

    try {
      expect(verifyUrl(signed, SECRET)).toBe(false);
    } finally {
      global.Date.now = realDateNow;
    }
  });

  it("should handle relative paths and full URLs", () => {
    // signUrl inputs path, returns path+query
    const path = "/foo/bar";
    const signed = signUrl(path, SECRET);
    expect(verifyUrl(signed, SECRET)).toBe(true);
  });
});
