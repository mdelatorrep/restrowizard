
ALTER TABLE public.restaurant_websites
  DROP CONSTRAINT IF EXISTS restaurant_websites_user_id_fkey;

ALTER TABLE public.restaurant_websites
  ADD CONSTRAINT restaurant_websites_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
