import { describe, it, expect } from "vitest";
import { compilePolicy, type PolicySchema } from "../src/dsl";
import type { PolicyContext } from "../src";

describe("Policy DSL", () => {
  const mockContext = (overrides: Partial<PolicyContext> = {}): PolicyContext => ({
    width: 1000,
    height: 1000,
    bytes: 1024 * 1024, // 1MB
    format: "jpeg",
    filename: "test.jpg",
    contentType: "image/jpeg",
    metadata: {
      width: 1000,
      height: 1000,
      format: "jpeg",
    },
    ...overrides,
  });

  it("should compile a policy that matches a simple condition (width > 800)", () => {
    const schema: PolicySchema = {
      name: "test-policy",
      rules: [
        {
          condition: { width: { gt: 800 } },
          result: {
            variants: [{ width: 800, format: "webp" }],
          },
        },
      ],
    };

    const policy = compilePolicy(schema);
    const result = policy(mockContext({ width: 1200 }));

    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].width).toBe(800);
  });

  it("should return empty variants if no rules match", () => {
    const schema: PolicySchema = {
      name: "test-policy",
      rules: [
        {
          condition: { width: { gt: 2000 } },
          result: {
            variants: [{ width: 2000, format: "webp" }],
          },
        },
      ],
    };

    const policy = compilePolicy(schema);
    const result = policy(mockContext({ width: 1200 }));

    expect(result.variants).toHaveLength(0);
  });

  it("should support multiple conditions (AND logic)", () => {
    const schema: PolicySchema = {
      name: "test-policy",
      rules: [
        {
          condition: {
            width: { gt: 800 },
            format: { eq: "png" },
          },
          result: { variants: [{ width: 800, format: "png" }] },
        },
      ],
    };

    const policy = compilePolicy(schema);

    // Match
    expect(policy(mockContext({ width: 1000, format: "png" })).variants).toHaveLength(1);

    // Mismatch width
    expect(policy(mockContext({ width: 500, format: "png" })).variants).toHaveLength(0);

    // Mismatch format
    expect(policy(mockContext({ width: 1000, format: "jpeg" })).variants).toHaveLength(0);
  });

  it("should support 'in' operator for strings", () => {
    const schema: PolicySchema = {
      name: "test-policy",
      rules: [
        {
          condition: {
            format: { in: ["jpeg", "png"] },
          },
          result: { variants: [{ width: 500, format: "webp" }] },
        },
      ],
    };

    const policy = compilePolicy(schema);

    expect(policy(mockContext({ format: "jpeg" })).variants).toHaveLength(1);
    expect(policy(mockContext({ format: "png" })).variants).toHaveLength(1);
    expect(policy(mockContext({ format: "webp" })).variants).toHaveLength(0);
  });

  it("should evaluate rules in order and pick the first match", () => {
    const schema: PolicySchema = {
      name: "priority-test",
      rules: [
        {
          condition: { width: { gt: 1000 } },
          result: { variants: [{ width: 1000, format: "webp" }] },
        },
        {
          condition: { width: { gt: 500 } },
          result: { variants: [{ width: 500, format: "webp" }] },
        },
      ],
    };

    const policy = compilePolicy(schema);

    // Greater than 1000 -> Should catch first rule
    const res1 = policy(mockContext({ width: 1200 }));
    expect(res1.variants[0].width).toBe(1000);

    // Greater than 500 but not 1000 -> Should catch second rule
    const res2 = policy(mockContext({ width: 800 }));
    expect(res2.variants[0].width).toBe(500);
  });
});
