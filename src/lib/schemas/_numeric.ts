/**
 * Helpers zod para validación numérica consistente.
 * - Coercen strings de inputs HTML
 * - Rechazan NaN / Infinity
 * - Mensajes en español
 *
 * Uso:
 *   import { positiveNumber, nonNegativeInt, money } from '@/lib/schemas/_numeric';
 *   const Schema = z.object({ price: money(), qty: positiveNumber() });
 */
import { z } from 'zod';

const finiteNumber = (msg = 'Debe ser un número válido') =>
  z.coerce
    .number({ invalid_type_error: msg })
    .refine((n) => Number.isFinite(n), { message: msg });

export const positiveNumber = (max = 1_000_000_000) =>
  finiteNumber().min(0.0001, 'Debe ser mayor que 0').max(max, 'Valor excesivo');

export const nonNegativeNumber = (max = 1_000_000_000) =>
  finiteNumber().min(0, 'No puede ser negativo').max(max, 'Valor excesivo');

export const positiveInt = (max = 1_000_000) =>
  z.coerce
    .number({ invalid_type_error: 'Debe ser un entero' })
    .int('Debe ser entero')
    .min(1, 'Debe ser mayor o igual a 1')
    .max(max, 'Valor excesivo');

export const nonNegativeInt = (max = 1_000_000) =>
  z.coerce
    .number({ invalid_type_error: 'Debe ser un entero' })
    .int('Debe ser entero')
    .min(0, 'No puede ser negativo')
    .max(max, 'Valor excesivo');

export const percentage = () =>
  finiteNumber('Porcentaje inválido').min(0, 'Mínimo 0%').max(100, 'Máximo 100%');

/** Dinero (COP/USD), no negativo, hasta 2 decimales en input. */
export const money = (max = 1_000_000_000) =>
  finiteNumber('Monto inválido').min(0, 'No puede ser negativo').max(max, 'Monto excesivo');
