
-- Fix the function search path for the new function
CREATE OR REPLACE FUNCTION generate_quotation_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.public_slug IS NULL THEN
        NEW.public_slug := LOWER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 12));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
