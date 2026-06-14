/**
 * Helpers zod para validación numérica consistente (es).
 */
import { z } from 'zod';

export const positiveNumber = (max = 1_000_000_000) =>
  z.coerce
    .number({ invalid_type_error: 'Debe ser un número válido' })
    .min(0.0001, 'Debe ser mayor que 0')
    .max(max, 'Valor excesivo')
    .refine((n) => Number.isFinite(n), { message: 'Debe ser un número válido' });

export const nonNegativeNumber = (max = 1_000_000_000) =>
  z.coerce
    .number({ invalid_type_error: 'Debe ser un número válido' })
    .min(0, 'No puede ser negativo')
    .max(max, 'Valor excesivo')
    .refine((n) => Number.isFinite(n), { message: 'Debe ser un número válido' });

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
  z.coerce
    .number({ invalid_type_error: 'Porcentaje inválido' })
    .min(0, 'Mínimo 0%')
    .max(100, 'Máximo 100%');

export const money = (max = 1_000_000_000) =>
  z.coerce
    .number({ invalid_type_error: 'Monto inválido' })
    .min(0, 'No puede ser negativo')
    .max(max, 'Monto excesivo')
    .refine((n) => Number.isFinite(n), { message: 'Monto inválido' });
