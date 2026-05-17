import { describe, it, expect } from "vitest";
import { ok, fail, ServiceError } from "@/services/_base";

describe("services/_base", () => {
  it("ok wraps data", () => {
    const r = ok({ a: 1 });
    expect(r.error).toBeNull();
    expect(r.data).toEqual({ a: 1 });
  });

  it("fail returns a ServiceError", () => {
    const r = fail("boom", "X1");
    expect(r.data).toBeNull();
    expect(r.error).toBeInstanceOf(ServiceError);
    expect(r.error?.code).toBe("X1");
  });
});
