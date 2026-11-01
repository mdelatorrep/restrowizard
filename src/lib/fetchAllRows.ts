/**
 * B-47 · PostgREST devuelve como máximo 1.000 filas por consulta. Un P&L de 30
 * días de un restaurante con volumen tiene más órdenes y muchas más líneas de
 * costo que eso: sin paginar, las cifras salen recortadas sin ningún error.
 *
 * `build` debe crear la consulta desde cero en cada llamada (el builder de
 * Supabase no se puede reutilizar entre páginas) y llevar un orden estable.
 * Devuelve { data, error } para mantener la forma de una respuesta de Supabase.
 */
export interface PageableQuery<T> {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
}

export const fetchAllRows = async <T>(
  build: () => PageableQuery<T>,
  pageSize = 1000,
  maxRows = 200_000,
): Promise<{ data: T[]; error: unknown }> => {
  const rows: T[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return { data: rows, error: null };
};
