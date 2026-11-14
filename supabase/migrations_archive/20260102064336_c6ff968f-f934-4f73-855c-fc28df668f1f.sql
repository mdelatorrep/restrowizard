-- Update the handle_new_user function to properly store user_type from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, restaurant_name, user_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'restaurant_name',
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'restaurant_owner')
  );
  
  -- Assign default role based on user type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- If the user is a consultant, also add the consultant role
  IF NEW.raw_user_meta_data ->> 'user_type' = 'consultant' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'consultant')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;