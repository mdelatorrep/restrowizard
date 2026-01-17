import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  action?: 'process_payment' | 'create_payment_link' | 'check_status' | 'refund';
  gateway: 'wompi' | 'bold' | 'mercadopago' | 'epayco';
  amount: number;
  currency?: string;
  payment_method?: string;
  customer_email?: string;
  customer_name?: string;
  description?: string;
  metadata?: Record<string, any>;
  transaction_id?: string;
  expires_in?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const request: PaymentRequest = await req.json();
    const { gateway, amount, currency = 'COP', action = 'process_payment' } = request;

    console.log(`Processing ${action} for gateway: ${gateway}, amount: ${amount} ${currency}`);

    // Get user's gateway credentials
    const { data: credentials, error: credError } = await supabase
      .from('payment_gateway_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('gateway', gateway)
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Credenciales de ${gateway} no configuradas o inactivas` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (gateway) {
      case 'wompi':
        result = await processWompiPayment(credentials, request);
        break;
      case 'bold':
        result = await processBoldPayment(credentials, request);
        break;
      case 'mercadopago':
        result = await processMercadoPagoPayment(credentials, request);
        break;
      case 'epayco':
        result = await processEpaycoPayment(credentials, request);
        break;
      default:
        result = { success: false, error: `Gateway ${gateway} no soportado` };
    }

    console.log(`Payment result:`, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Payment processor error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Wompi Payment Processor (Colombia)
async function processWompiPayment(credentials: any, request: PaymentRequest) {
  const baseUrl = credentials.is_sandbox 
    ? 'https://sandbox.wompi.co/v1'
    : 'https://production.wompi.co/v1';

  try {
    // For card payments, create a transaction
    if (request.action === 'create_payment_link') {
      const response = await fetch(`${baseUrl}/payment_links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.private_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: request.description || 'Pago POS',
          description: request.description,
          single_use: true,
          collect_shipping: false,
          currency: request.currency || 'COP',
          amount_in_cents: Math.round(request.amount * 100),
          expires_at: request.expires_in 
            ? new Date(Date.now() + request.expires_in * 60000).toISOString()
            : undefined
        })
      });

      const data = await response.json();
      
      if (data.data) {
        return {
          success: true,
          url: data.data.url,
          reference: data.data.id,
          status: 'pending'
        };
      } else {
        return { success: false, error: data.error?.message || 'Error creando link de pago' };
      }
    }

    // Create a transaction source (tokenize)
    if (request.payment_method === 'card') {
      // For POS card payments, we typically use a card reader integration
      // This is a simplified version for online payments
      return {
        success: true,
        status: 'requires_action',
        message: 'Usa el lector de tarjetas o crea un link de pago',
        gateway: 'wompi'
      };
    }

    // For PSE, Nequi, etc.
    if (request.payment_method === 'pse' || request.payment_method === 'nequi') {
      const response = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.private_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount_in_cents: Math.round(request.amount * 100),
          currency: request.currency || 'COP',
          customer_email: request.customer_email,
          payment_method: {
            type: request.payment_method?.toUpperCase(),
            user_type: 0, // Natural person
            financial_institution_code: '1022' // Default to Bancolombia
          },
          reference: `POS-${Date.now()}`,
          customer_data: {
            full_name: request.customer_name || 'Cliente POS'
          }
        })
      });

      const data = await response.json();
      
      if (data.data) {
        return {
          success: true,
          transactionId: data.data.id,
          reference: data.data.reference,
          status: data.data.status,
          redirectUrl: data.data.redirect_url
        };
      } else {
        return { success: false, error: data.error?.message || 'Error procesando pago' };
      }
    }

    return { success: true, status: 'pending', message: 'Pago registrado' };

  } catch (error: any) {
    console.error('Wompi error:', error);
    return { success: false, error: error.message };
  }
}

// Bold Payment Processor (Colombia)
async function processBoldPayment(credentials: any, request: PaymentRequest) {
  const baseUrl = credentials.is_sandbox
    ? 'https://sandbox.api.bold.co'
    : 'https://api.bold.co';

  try {
    if (request.action === 'create_payment_link') {
      const response = await fetch(`${baseUrl}/v1/payment-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.private_key}`,
          'Content-Type': 'application/json',
          'x-api-key': credentials.public_key
        },
        body: JSON.stringify({
          amount: Math.round(request.amount),
          currency: request.currency || 'COP',
          description: request.description || 'Pago POS',
          expiration_date: request.expires_in
            ? new Date(Date.now() + request.expires_in * 60000).toISOString()
            : undefined,
          single_use: true
        })
      });

      const data = await response.json();
      
      if (data.payment_link) {
        return {
          success: true,
          url: data.payment_link,
          reference: data.id,
          qrCode: data.qr_code,
          status: 'pending'
        };
      } else {
        return { success: false, error: data.message || 'Error creando link Bold' };
      }
    }

    // Bold primarily works with payment links and QR codes for POS
    return {
      success: true,
      status: 'requires_action',
      message: 'Genera un link de pago o QR para Bold',
      gateway: 'bold'
    };

  } catch (error: any) {
    console.error('Bold error:', error);
    return { success: false, error: error.message };
  }
}

// MercadoPago Payment Processor (LATAM)
async function processMercadoPagoPayment(credentials: any, request: PaymentRequest) {
  const baseUrl = 'https://api.mercadopago.com';

  try {
    if (request.action === 'create_payment_link') {
      const response = await fetch(`${baseUrl}/checkout/preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.private_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{
            title: request.description || 'Pago POS',
            quantity: 1,
            unit_price: request.amount,
            currency_id: request.currency || 'COP'
          }],
          expires: request.expires_in ? true : false,
          expiration_date_to: request.expires_in
            ? new Date(Date.now() + request.expires_in * 60000).toISOString()
            : undefined,
          auto_return: 'approved'
        })
      });

      const data = await response.json();
      
      if (data.init_point) {
        return {
          success: true,
          url: credentials.is_sandbox ? data.sandbox_init_point : data.init_point,
          reference: data.id,
          status: 'pending'
        };
      } else {
        return { success: false, error: data.message || 'Error creando preferencia' };
      }
    }

    // Create QR payment (Point of Sale integration)
    if (request.payment_method === 'qr') {
      const response = await fetch(`${baseUrl}/instore/orders/qr/seller/collectors/${credentials.public_key}/pos/POS001/qrs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.private_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          external_reference: `POS-${Date.now()}`,
          title: request.description || 'Pago POS',
          description: request.description,
          total_amount: request.amount,
          items: [{
            title: 'Venta POS',
            unit_price: request.amount,
            quantity: 1,
            unit_measure: 'unit',
            total_amount: request.amount
          }]
        })
      });

      const data = await response.json();
      
      if (data.qr_data) {
        return {
          success: true,
          qrCode: data.qr_data,
          reference: data.in_store_order_id,
          status: 'pending'
        };
      }
    }

    return { success: true, status: 'pending', message: 'Pago registrado' };

  } catch (error: any) {
    console.error('MercadoPago error:', error);
    return { success: false, error: error.message };
  }
}

// ePayco Payment Processor (Colombia)
async function processEpaycoPayment(credentials: any, request: PaymentRequest) {
  const baseUrl = credentials.is_sandbox
    ? 'https://sandbox.epayco.co/api'
    : 'https://api.epayco.co';

  try {
    if (request.action === 'create_payment_link') {
      // ePayco uses checkout links
      const checkoutUrl = credentials.is_sandbox
        ? 'https://sandbox.checkout.epayco.co'
        : 'https://checkout.epayco.co';

      const params = new URLSearchParams({
        key: credentials.public_key,
        amount: request.amount.toString(),
        currency: request.currency || 'COP',
        name: 'Pago POS',
        description: request.description || 'Pago en punto de venta'
      });

      return {
        success: true,
        url: `${checkoutUrl}?${params.toString()}`,
        status: 'pending'
      };
    }

    // For Daviplata payments
    if (request.payment_method === 'daviplata') {
      const response = await fetch(`${baseUrl}/daviplata/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          public_key: credentials.public_key,
          docType: 'CC',
          document: request.metadata?.document || '',
          name: request.customer_name || 'Cliente',
          email: request.customer_email || '',
          cell_phone: request.metadata?.phone || '',
          invoice: `POS-${Date.now()}`,
          value: request.amount.toString(),
          currency: 'COP'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          transactionId: data.data?.ref_payco,
          status: data.data?.status,
          message: 'Confirma el pago en tu app Daviplata'
        };
      } else {
        return { success: false, error: data.message || 'Error procesando Daviplata' };
      }
    }

    return { success: true, status: 'pending', message: 'Pago registrado' };

  } catch (error: any) {
    console.error('ePayco error:', error);
    return { success: false, error: error.message };
  }
}
