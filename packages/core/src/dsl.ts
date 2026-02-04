import type { Policy, PolicyContext, PolicyDecision } from "./index.js";

export interface Condition {
  width?: { gt?: number; lt?: number; eq?: number };
  height?: { gt?: number; lt?: number; eq?: number };
  format?: { eq?: string; in?: string[] };
  bytes?: { gt?: number; lt?: number };
  contentType?: { eq?: string; in?: string[] };
}

export interface Rule {
  name?: string;
  condition?: Condition;
  result: PolicyDecision;
}

export interface PolicySchema {
  name: string;
  rules: Rule[];
}

export function compilePolicy(schema: PolicySchema): Policy {
  return (ctx: PolicyContext): PolicyDecision => {
    for (const rule of schema.rules) {
      if (matches(ctx, rule.condition)) {
        return rule.result;
      }
    }

    // Default fallback if no rules match
    return { variants: [] };
  };
}

function matches(ctx: PolicyContext, condition?: Condition): boolean {
  if (!condition) return true; // No condition means always match

  if (condition.width) {
    if (condition.width.gt !== undefined && ctx.width <= condition.width.gt) return false;
    if (condition.width.lt !== undefined && ctx.width >= condition.width.lt) return false;
    if (condition.width.eq !== undefined && ctx.width !== condition.width.eq) return false;
  }

  if (condition.height) {
    if (condition.height.gt !== undefined && ctx.height <= condition.height.gt) return false;
    if (condition.height.lt !== undefined && ctx.height >= condition.height.lt) return false;
    if (condition.height.eq !== undefined && ctx.height !== condition.height.eq) return false;
  }

  if (condition.format) {
    if (condition.format.eq !== undefined && ctx.format !== condition.format.eq) return false;
    if (condition.format.in !== undefined && !condition.format.in.includes(ctx.format))
      return false;
  }

  if (condition.bytes) {
    if (condition.bytes.gt !== undefined && ctx.bytes <= condition.bytes.gt) return false;
    if (condition.bytes.lt !== undefined && ctx.bytes >= condition.bytes.lt) return false;
  }

  if (condition.contentType) {
    if (condition.contentType.eq !== undefined && ctx.contentType !== condition.contentType.eq)
      return false;
    if (
      condition.contentType.in !== undefined &&
      !condition.contentType.in.includes(ctx.contentType)
    )
      return false;
  }

  return true;
}
