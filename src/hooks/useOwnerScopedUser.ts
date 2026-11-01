import { useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuth } from './useAuth';
import { useDataUserId } from './useDataUserId';

/**
 * El usuario conectado, pero con `id` = dueño de los datos del restaurante.
 *
 * Las tablas operativas (caja, mesas, reservas, menú, descuentos) se indexan por
 * el user_id del dueño. Un cajero o gerente que consultara o insertara con su
 * propio id no vería la caja abierta del día y dejaría sus ventas fuera del
 * negocio. Devuelve null hasta saber si quien entra es dueño o miembro del
 * equipo, para que ninguna escritura salga con el id equivocado.
 *
 * Solo para datos del negocio. Lo personal (perfil, formación, notificaciones)
 * sigue usando useAuth().user.
 */
export const useOwnerScopedUser = (): User | null => {
  const { user } = useAuth();
  const { userId, isResolved } = useDataUserId();
  return useMemo(
    () => (user && userId && isResolved ? ({ ...user, id: userId } as User) : null),
    [user, userId, isResolved],
  );
};
