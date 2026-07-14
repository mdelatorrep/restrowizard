import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface OrderRequest {
  restaurant_user_id: string;
  items: OrderItem[];
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  delivery_notes?: string;
  delivery_zone_id?: string;
  payment_method: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: OrderRequest = await req.json();
    console.log("Received order request:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.restaurant_user_id || !body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: restaurant_user_id, items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.customer_name || body.customer_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Customer name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.customer_phone || body.customer_phone.trim().length < 7) {
      return new Response(
        JSON.stringify({ error: "Valid phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.delivery_address || body.delivery_address.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Complete delivery address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate restaurant exists and has website with delivery enabled
    const { data: website, error: websiteError } = await supabase
      .from("restaurant_websites")
      .select("id, show_delivery, delivery_min_order")
      .eq("user_id", body.restaurant_user_id)
      .eq("is_published", true)
      .maybeSingle();

    if (websiteError || !website) {
      console.error("Website error:", websiteError);
      return new Response(
        JSON.stringify({ error: "Restaurant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!website.show_delivery) {
      return new Response(
        JSON.stringify({ error: "Delivery is not enabled for this restaurant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side price validation (B-03): never trust client-provided prices.
    const requestedIds = [...new Set(body.items.map((i) => i.id))];
    const { data: ownerMenus } = await supabase
      .from("restaurant_menus")
      .select("id")
      .eq("user_id", body.restaurant_user_id);
    const menuIds = (ownerMenus || []).map((m) => m.id);
    let dbItems: any[] = [];
    if (menuIds.length > 0 && requestedIds.length > 0) {
      const { data } = await supabase
        .from("menu_items")
        .select("id, name, price, is_available, menu_id")
        .in("id", requestedIds)
        .in("menu_id", menuIds);
      dbItems = data || [];
    }
    const dbById = new Map(dbItems.map((i) => [i.id, i]));

    const validatedItems = [] as Array<{ id: string; name: string; quantity: number; price: number; notes: string | null }>;
    for (const item of body.items) {
      const db = dbById.get(item.id);
      if (!db) {
        return new Response(
          JSON.stringify({ error: `Producto no disponible: ${String(item.name || item.id).slice(0, 100)}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (db.is_available === false) {
        return new Response(
          JSON.stringify({ error: `Producto agotado: ${db.name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const quantity = Math.min(Math.max(1, Math.floor(item.quantity)), 99);
      validatedItems.push({
        id: db.id,
        name: String(db.name).slice(0, 100),
        quantity,
        price: Number(db.price),
        notes: item.notes?.slice(0, 200) || null,
      });
    }
    if (validatedItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay productos válidos en el pedido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate totals from server-side prices
    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Get delivery fee from zone if provided
    let deliveryFee = 0;
    let estimatedTime = 45;
    
    if (body.delivery_zone_id) {
      const { data: zone } = await supabase
        .from("delivery_zones")
        .select("delivery_fee, estimated_time_minutes, min_order, is_active")
        .eq("id", body.delivery_zone_id)
        .eq("user_id", body.restaurant_user_id)
        .maybeSingle();
      
      if (zone && zone.is_active) {
        deliveryFee = zone.delivery_fee || 0;
        estimatedTime = zone.estimated_time_minutes || 45;
        
        // Check minimum order
        if (zone.min_order && subtotal < zone.min_order) {
          return new Response(
            JSON.stringify({ 
              error: `Minimum order for this zone is $${zone.min_order.toLocaleString()}` 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Check global minimum order
    if (website.delivery_min_order && subtotal < website.delivery_min_order) {
      return new Response(
        JSON.stringify({ 
          error: `Minimum order is $${website.delivery_min_order.toLocaleString()}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const total = subtotal + deliveryFee;

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("restaurant_orders")
      .insert({
        user_id: body.restaurant_user_id,
        source: "website",
        order_type: "delivery",
        status: "pending",
        customer_name: body.customer_name.trim().slice(0, 100),
        customer_phone: body.customer_phone.trim().slice(0, 20),
        customer_email: body.customer_email?.trim().slice(0, 255) || null,
        delivery_address: body.delivery_address.trim().slice(0, 500),
        delivery_notes: body.delivery_notes?.trim().slice(0, 500) || null,
        items: validatedItems,
        subtotal,
        delivery_fee: deliveryFee,
        discount: 0,
        tax: 0,
        total,
        payment_method: body.payment_method || "cash",
        payment_status: "pending",
        estimated_time_minutes: estimatedTime,
      })
      .select("id, order_number")
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order created successfully:", order);

    // Process loyalty points (non-blocking)
    try {
      if (body.customer_phone || body.customer_email) {
        const pointsToAward = Math.floor(total / 1000);
        
        // Find existing loyalty customer
        let loyaltyCustomer = null;
        
        if (body.customer_email) {
          const { data } = await supabase
            .from("loyalty_customers")
            .select("*")
            .eq("user_id", body.restaurant_user_id)
            .eq("customer_email", body.customer_email)
            .maybeSingle();
          loyaltyCustomer = data;
        }
        
        if (!loyaltyCustomer && body.customer_phone) {
          const { data } = await supabase
            .from("loyalty_customers")
            .select("*")
            .eq("user_id", body.restaurant_user_id)
            .eq("customer_phone", body.customer_phone)
            .maybeSingle();
          loyaltyCustomer = data;
        }

        if (loyaltyCustomer) {
          // Update existing customer
          const newPoints = (loyaltyCustomer.current_points || 0) + pointsToAward;
          const newLifetime = (loyaltyCustomer.lifetime_points || 0) + pointsToAward;
          const newTotal = (Number(loyaltyCustomer.total_spent) || 0) + total;
          const newOrders = (loyaltyCustomer.total_orders || 0) + 1;

          await supabase
            .from("loyalty_customers")
            .update({
              current_points: newPoints,
              lifetime_points: newLifetime,
              total_spent: newTotal,
              total_orders: newOrders,
              avg_order_value: newTotal / newOrders,
              last_order_at: new Date().toISOString(),
            })
            .eq("id", loyaltyCustomer.id);

          if (pointsToAward > 0) {
            await supabase
              .from("loyalty_points_transactions")
              .insert({
                user_id: body.restaurant_user_id,
                customer_id: loyaltyCustomer.id,
                points: pointsToAward,
                transaction_type: "earn",
                source: "order",
                source_id: order.id,
                description: `+${pointsToAward} pts por pedido #${order.order_number}`,
                balance_after: newPoints,
              });
          }
        } else {
          // Create new loyalty customer
          const { data: newCustomer } = await supabase
            .from("loyalty_customers")
            .insert({
              user_id: body.restaurant_user_id,
              customer_name: body.customer_name,
              customer_email: body.customer_email || null,
              customer_phone: body.customer_phone,
              current_points: pointsToAward,
              lifetime_points: pointsToAward,
              total_spent: total,
              total_orders: 1,
              avg_order_value: total,
              first_order_at: new Date().toISOString(),
              last_order_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (newCustomer && pointsToAward > 0) {
            await supabase
              .from("loyalty_points_transactions")
              .insert({
                user_id: body.restaurant_user_id,
                customer_id: newCustomer.id,
                points: pointsToAward,
                transaction_type: "earn",
                source: "order",
                source_id: order.id,
                description: `+${pointsToAward} pts por pedido #${order.order_number}`,
                balance_after: pointsToAward,
              });
          }
        }
      }
    } catch (loyaltyError) {
      console.error("Loyalty processing error (non-blocking):", loyaltyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_number: order.order_number,
        order_id: order.id,
        total,
        delivery_fee: deliveryFee,
        estimated_time_minutes: estimatedTime,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
