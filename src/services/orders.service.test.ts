import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client BEFORE importing the service under test.
vi.mock("@/integrations/supabase/client", () => {
  const builder: any = {};
  const reset = () => {
    builder.select = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.gte = vi.fn(() => builder);
    builder.lte = vi.fn(() => builder);
    builder.order = vi.fn(() => builder);
    builder.limit = vi.fn(() => builder);
    builder._resolveWith = { data: null, error: null };
    builder.then = (onFulfilled: any) => Promise.resolve(builder._resolveWith).then(onFulfilled);
  };
  reset();
  const from = vi.fn(() => builder);
  return {
    supabase: { from },
    __builder: builder,
    __reset: reset,
  };
});

import { listUnifiedOrders, getOrderStatusHistory } from "./orders.service";
import * as mod from "@/integrations/supabase/client";

const builder = (mod as any).__builder;
const reset = (mod as any).__reset;

describe("orders.service", () => {
  beforeEach(() => reset());

  it("listUnifiedOrders applies filters and returns data", async () => {
    builder._resolveWith = { data: [{ id: "o1", user_id: "u1" }], error: null };
    const res = await listUnifiedOrders({
      userId: "u1",
      from: "2026-01-01",
      to: "2026-12-31",
      channel: "inhouse",
      status: "paid",
      limit: 50,
    });
    expect(res.error).toBeNull();
    expect(res.data?.[0].id).toBe("o1");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "u1");
    expect(builder.gte).toHaveBeenCalledWith("created_at", "2026-01-01");
    expect(builder.lte).toHaveBeenCalledWith("created_at", "2026-12-31");
    expect(builder.limit).toHaveBeenCalledWith(50);
  });

  it("listUnifiedOrders surfaces ServiceError on failure", async () => {
    builder._resolveWith = { data: null, error: { message: "boom", code: "42P01" } };
    const res = await listUnifiedOrders({ userId: "u1" });
    expect(res.data).toBeNull();
    expect(res.error?.message).toBe("boom");
    expect(res.error?.code).toBe("42P01");
  });

  it("getOrderStatusHistory returns ordered rows", async () => {
    builder._resolveWith = { data: [{ id: "h1", status: "pending" }], error: null };
    const res = await getOrderStatusHistory("order-123");
    expect(res.error).toBeNull();
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});
