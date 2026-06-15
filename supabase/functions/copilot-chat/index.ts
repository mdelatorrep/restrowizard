import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "npm:ai";
import { z } from "npm:zod";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { pickSdkModel } from "../_shared/ai-sdk-gateway.ts";
import { embedTexts } from "../_shared/embeddings.ts";
import { buildGuardrailPrompt } from "../_shared/ai-guardrails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `${buildGuardrailPrompt({ domain: "co-piloto agéntico de gestión de restaurantes" })}

Eres el Co-Piloto agéntico de RestroWizard, un asistente IA especializado en gestión de restaurantes.

Tu rol es ayudar a gerentes y dueños con:
- Análisis de ventas, finanzas y KPIs
- Inventario, proveedores y órdenes de compra
- Menú: ingeniería, precios y recetas
- Feedback de clientes y reputación
- Alertas operativas proactivas
- Búsqueda en la base de conocimiento del restaurante

REGLAS:
- Responde siempre en español, conciso y práctico. Markdown ligero (negritas, listas).
- USA las herramientas disponibles antes de inventar datos. Si necesitas KPIs, recetas o feedback, llama a la tool correspondiente.
- Para preguntas conceptuales o sobre los procesos del propio restaurante, usa search_knowledge_base.
- HERRAMIENTAS DESTRUCTIVAS (update_menu_item_price, create_inventory_purchase_order): primero llámalas con confirm=false para mostrar el preview al usuario, espera su "sí/confirma" en lenguaje natural, y solo entonces vuelve a llamarlas con confirm=true.
- Si un dato no existe, dilo claro ("Información no disponible — requiere verificación") y sugiere acción concreta. NUNCA inventes cifras, precios, proveedores ni contactos.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let userId: string | null = null;
    if (authHeader.startsWith("Bearer ")) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getUser();
      userId = data.user?.id ?? null;
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({}));
    const messages = body?.messages as UIMessage[] | undefined;
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Payload inválido: se esperaba { messages: UIMessage[] }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tools = buildTools(admin, userId);

    const result = streamText({
      model: pickSdkModel("fast"),
      system: SYSTEM_PROMPT + (userId ? "" : "\n\nNOTA: Usuario no autenticado, las herramientas de datos están deshabilitadas."),
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(50),
      abortSignal: req.signal,
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (error) {
    console.error("[copilot-chat]", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

type Admin = ReturnType<typeof createClient>;

function buildTools(admin: Admin, userId: string | null) {
  const requireUser = () => {
    if (!userId) throw new Error("Usuario no autenticado");
    return userId;
  };

  return {
    get_kpis: tool({
      description:
        "Obtiene KPIs financieros (ingresos, food cost, labor cost, ticket promedio, cubiertos) para un rango de días.",
      inputSchema: z.object({
        days: z.number().int().min(1).max(90).default(7).describe("Días hacia atrás (default 7)"),
      }),
      execute: async ({ days }) => {
        const uid = requireUser();
        const today = new Date();
        const results: Array<Record<string, unknown>> = [];
        let totalRevenue = 0, totalOrders = 0, totalCovers = 0, totalFood = 0, totalLabor = 0;
        for (let i = 0; i < days; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const { data } = await admin.rpc("get_aggregated_daily_sales", {
            p_user_id: uid,
            p_date: dateStr,
          });
          const row = Array.isArray(data) && data[0] ? data[0] : null;
          if (row) {
            results.push({ date: dateStr, ...row });
            totalRevenue += Number(row.total_revenue ?? 0);
            totalOrders += Number(row.order_count ?? 0);
            totalCovers += Number(row.covers_count ?? 0);
            totalFood += Number(row.food_cost ?? 0);
            totalLabor += Number(row.labor_cost ?? 0);
          }
        }
        const foodPct = totalRevenue > 0 ? (totalFood / totalRevenue) * 100 : 0;
        const laborPct = totalRevenue > 0 ? (totalLabor / totalRevenue) * 100 : 0;
        const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        return {
          period_days: days,
          totals: {
            revenue: round(totalRevenue),
            orders: totalOrders,
            covers: totalCovers,
            food_cost: round(totalFood),
            labor_cost: round(totalLabor),
            food_cost_pct: round(foodPct),
            labor_cost_pct: round(laborPct),
            prime_cost_pct: round(foodPct + laborPct),
            avg_ticket: round(avgTicket),
          },
          daily: results.slice(0, 14),
        };
      },
    }),

    find_recipe_by_name: tool({
      description: "Busca recetas por nombre (coincidencia parcial). Devuelve costo por porción y rentabilidad.",
      inputSchema: z.object({
        query: z.string().min(1).describe("Nombre o parte del nombre de la receta"),
        limit: z.number().int().min(1).max(10).default(5),
      }),
      execute: async ({ query, limit }) => {
        const uid = requireUser();
        const { data, error } = await admin
          .from("recipes")
          .select("id, name, cost_per_portion, portion_size, selling_price, profit_margin, menu_item_id")
          .eq("user_id", uid)
          .ilike("name", `%${query}%`)
          .limit(limit);
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, recipes: data ?? [] };
      },
    }),

    analyze_menu_engineering: tool({
      description:
        "Analiza el menú con la matriz BCG (Stars, Cash Cows, Question Marks, Dogs) basado en popularidad y rentabilidad.",
      inputSchema: z.object({
        category: z.enum(["all", "star", "cash_cow", "question_mark", "dog"]).default("all"),
        limit: z.number().int().min(1).max(30).default(10),
      }),
      execute: async ({ category, limit }) => {
        const uid = requireUser();
        let q = admin
          .from("menu_items")
          .select("id, name, price, popularity_score, profitability_score, bcg_category, menu_id, restaurant_menus!inner(user_id)")
          .eq("restaurant_menus.user_id", uid)
          .order("popularity_score", { ascending: false })
          .limit(limit);
        if (category !== "all") q = q.eq("bcg_category", category);
        const { data, error } = await q;
        if (error) return { error: error.message };
        const items = (data ?? []).map((i: Record<string, unknown>) => ({
          id: i.id, name: i.name, price: i.price,
          popularity: i.popularity_score, profitability: i.profitability_score,
          category: i.bcg_category,
        }));
        return { count: items.length, items };
      },
    }),

    summarize_recent_feedback: tool({
      description: "Resume el feedback reciente de clientes con rating promedio y conteo por tipo.",
      inputSchema: z.object({
        days: z.number().int().min(1).max(60).default(7),
      }),
      execute: async ({ days }) => {
        const uid = requireUser();
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const { data, error } = await admin
          .from("customer_feedback")
          .select("rating, comment, sentiment, created_at, customer_name")
          .eq("user_id", uid)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) return { error: error.message };
        const items = data ?? [];
        const avg = items.length > 0 ? items.reduce((s, i) => s + Number(i.rating ?? 0), 0) / items.length : 0;
        const recent = items.slice(0, 5).map((i) => ({
          rating: i.rating, sentiment: i.sentiment, comment: (i.comment ?? "").slice(0, 200),
        }));
        return {
          period_days: days,
          total: items.length,
          avg_rating: round(avg),
          recent_samples: recent,
        };
      },
    }),

    trigger_proactive_alert_scan: tool({
      description: "Lanza un escaneo de alertas proactivas (food cost, labor, stock, ventas). Devuelve las alertas detectadas.",
      inputSchema: z.object({}),
      execute: async () => {
        const uid = requireUser();
        const { data: alerts, error } = await admin
          .from("copilot_alerts")
          .select("id, alert_type, message, priority, created_at")
          .eq("user_id", uid)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) return { error: error.message };
        return { unread: alerts?.length ?? 0, alerts: alerts ?? [] };
      },
    }),

    search_knowledge_base: tool({
      description:
        "Busca semánticamente en la base de conocimiento del restaurante (manuales, recetas, notas, procesos). Úsalo antes de inventar respuestas conceptuales.",
      inputSchema: z.object({
        query: z.string().min(2),
        limit: z.number().int().min(1).max(8).default(5),
      }),
      execute: async ({ query, limit }) => {
        const uid = requireUser();
        try {
          const [embedding] = await embedTexts([query]);
          const { data, error } = await admin.rpc("match_knowledge", {
            query_embedding: embedding as unknown as string,
            match_user_id: uid,
            match_count: limit,
            min_similarity: 0.3,
          });
          if (error) return { error: error.message };
          return {
            count: data?.length ?? 0,
            results: (data ?? []).map((r: Record<string, unknown>) => ({
              title: r.source_title,
              type: r.source_type,
              similarity: round(Number(r.similarity ?? 0), 3),
              excerpt: String(r.content ?? "").slice(0, 400),
            })),
          };
        } catch (e) {
          return { error: (e as Error).message };
        }
      },
    }),

    update_menu_item_price: tool({
      description:
        "Actualiza el precio de un platillo del menú. SIEMPRE llama primero con confirm=false para mostrar preview; espera confirmación en lenguaje natural; luego llama con confirm=true.",
      inputSchema: z.object({
        menu_item_id: z.string().uuid(),
        new_price: z.number().positive(),
        confirm: z.boolean().default(false),
      }),
      execute: async ({ menu_item_id, new_price, confirm }) => {
        const uid = requireUser();
        const { data: item } = await admin
          .from("menu_items")
          .select("id, name, price, menu_id, restaurant_menus!inner(user_id)")
          .eq("id", menu_item_id)
          .eq("restaurant_menus.user_id", uid)
          .maybeSingle();
        if (!item) return { error: "Platillo no encontrado o sin permisos" };
        if (!confirm) {
          return {
            preview: true,
            confirm_required: true,
            item: { id: item.id, name: item.name, current_price: item.price, new_price },
            message: `Cambiar precio de "${item.name}" de ${item.price} a ${new_price}. Confirma para aplicar.`,
          };
        }
        const { error } = await admin
          .from("menu_items")
          .update({ price: new_price })
          .eq("id", menu_item_id);
        if (error) return { error: error.message };
        return { ok: true, item_id: menu_item_id, old_price: item.price, new_price };
      },
    }),

    create_inventory_purchase_order: tool({
      description:
        "Crea una orden de compra de inventario. SIEMPRE llama primero con confirm=false para preview; espera confirmación; luego confirm=true.",
      inputSchema: z.object({
        supplier_id: z.string().uuid(),
        items: z.array(z.object({
          inventory_item_id: z.string().uuid(),
          quantity: z.number().positive(),
          unit_cost: z.number().nonnegative(),
        })).min(1),
        notes: z.string().optional(),
        confirm: z.boolean().default(false),
      }),
      execute: async ({ supplier_id, items, notes, confirm }) => {
        const uid = requireUser();
        const total = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
        if (!confirm) {
          return {
            preview: true,
            confirm_required: true,
            supplier_id,
            items_count: items.length,
            estimated_total: round(total),
            message: `Crear orden de compra con ${items.length} items por un total estimado de ${round(total)}. Confirma para crear.`,
          };
        }
        const { data: po, error } = await admin
          .from("inventory_purchase_orders")
          .insert({
            user_id: uid,
            supplier_id,
            total_amount: total,
            notes,
            status: "draft",
          })
          .select("id, order_number")
          .single();
        if (error || !po) return { error: error?.message ?? "Error creando orden" };
        const rows = items.map((i) => ({
          purchase_order_id: po.id,
          inventory_item_id: i.inventory_item_id,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
          subtotal: i.quantity * i.unit_cost,
        }));
        const { error: itErr } = await admin.from("inventory_purchase_order_items").insert(rows);
        if (itErr) return { error: itErr.message, partial: { po_id: po.id } };
        return { ok: true, po_id: po.id, order_number: po.order_number, total: round(total) };
      },
    }),

    // P1-7: Invoices tool
    list_pending_invoices: tool({
      description: "Lista facturas de proveedores pendientes con monto, fecha y proveedor.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(30).default(10),
      }),
      execute: async ({ limit }) => {
        const uid = requireUser();
        const { data, error } = await admin
          .from("supplier_invoices")
          .select("id, supplier_name, invoice_number, invoice_date, due_date, total_amount, currency, status")
          .eq("user_id", uid)
          .eq("status", "pending")
          .order("invoice_date", { ascending: false, nullsFirst: false })
          .limit(limit);
        if (error) return { error: error.message };
        const total_pending = (data ?? []).reduce((s, i) => s + Number(i.total_amount ?? 0), 0);
        return { count: data?.length ?? 0, total_pending: round(total_pending), invoices: data ?? [] };
      },
    }),

    // P1-7: Talent tool
    list_team_members: tool({
      description: "Lista miembros activos del equipo con cargo, departamento y rendimiento.",
      inputSchema: z.object({
        department: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ department, limit }) => {
        const uid = requireUser();
        let q = admin
          .from("staff_members")
          .select("id, name, position, department, performance_score, training_progress, hire_date")
          .eq("user_id", uid)
          .eq("is_active", true)
          .order("name")
          .limit(limit);
        if (department) q = q.ilike("department", `%${department}%`);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { count: data?.length ?? 0, members: data ?? [] };
      },
    }),

    // P1-7: Reservations tool
    list_upcoming_reservations: tool({
      description: "Lista próximas reservas de mesa (default: próximos 7 días).",
      inputSchema: z.object({
        days_ahead: z.number().int().min(1).max(30).default(7),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ days_ahead, limit }) => {
        const uid = requireUser();
        const today = new Date().toISOString().split("T")[0];
        const future = new Date(Date.now() + days_ahead * 86400000).toISOString().split("T")[0];
        const { data, error } = await admin
          .from("table_reservations")
          .select("id, customer_name, party_size, reservation_date, reservation_time, status, special_requests")
          .eq("user_id", uid)
          .gte("reservation_date", today)
          .lte("reservation_date", future)
          .in("status", ["pending", "confirmed"])
          .order("reservation_date")
          .order("reservation_time")
          .limit(limit);
        if (error) return { error: error.message };
        const total_covers = (data ?? []).reduce((s, r) => s + Number(r.party_size ?? 0), 0);
        return { count: data?.length ?? 0, total_covers, reservations: data ?? [] };
      },
    }),
  };
}

function round(n: number, dec = 2) {
  const f = Math.pow(10, dec);
  return Math.round(n * f) / f;
}
