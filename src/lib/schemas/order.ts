import { z } from 'zod';

export const OrderItemSchema = z.object({
  name: z.string().trim().min(1, 'Producto requerido'),
  quantity: z.coerce.number().int().min(1, 'Cantidad mínima 1'),
  price: z.coerce.number().min(0, 'Precio inválido'),
});

export const CreateOrderSchema = z.object({
  customer_name: z.string().trim().max(120).optional().or(z.literal('')),
  customer_phone: z.string().trim().max(40).optional().or(z.literal('')),
  delivery_address: z.string().trim().max(300).optional().or(z.literal('')),
  order_type: z.enum(['dine_in', 'takeout', 'delivery']),
  items: z.array(OrderItemSchema).min(1, 'Agrega al menos un item'),
}).refine(
  (v) => v.order_type !== 'delivery' || (v.delivery_address && v.delivery_address.trim().length > 0),
  { message: 'Dirección requerida para domicilio', path: ['delivery_address'] }
);

export const DeliveryZoneSchema = z.object({
  zone_name: z.string().trim().min(1, 'El nombre es requerido').max(120),
  delivery_fee: z.coerce.number().min(0, 'Tarifa inválida'),
  min_order: z.coerce.number().min(0, 'Mínimo inválido'),
  estimated_time_minutes: z.coerce.number().int().min(0).max(600),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type DeliveryZoneInput = z.infer<typeof DeliveryZoneSchema>;
