-- Confirmar manualmente el usuario que ya se registró
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'mdelatorrep@gmail.com' AND email_confirmed_at IS NULL;