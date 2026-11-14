-- C-02 (completitud frente a la propuesta, 14-nov-2026)
-- Los proveedores sembrados el 10-feb-2026 no tienen dueño y nadie los verificó.
-- Ningún proveedor muestra el sello "verificado" sin una verificación real.
UPDATE public.service_providers
   SET is_verified = false
 WHERE owner_id IS NULL
   AND is_verified IS TRUE;
