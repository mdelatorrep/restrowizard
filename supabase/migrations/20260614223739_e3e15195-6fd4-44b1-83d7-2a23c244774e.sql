
-- Backfill: cuando menu_items.recipe_id apunta a una receta sin menu_item_id
UPDATE public.recipes r
SET menu_item_id = mi.id
FROM public.menu_items mi
WHERE mi.recipe_id = r.id
  AND r.menu_item_id IS NULL;

-- Backfill inverso: cuando recipes.menu_item_id apunta a un platillo sin recipe_id
UPDATE public.menu_items mi
SET recipe_id = r.id
FROM public.recipes r
WHERE r.menu_item_id = mi.id
  AND mi.recipe_id IS NULL;

-- Trigger: cuando se actualiza recipes.menu_item_id, propagar a menu_items.recipe_id
CREATE OR REPLACE FUNCTION public.sync_recipe_to_menu_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si se vincula a un nuevo platillo, escribir su recipe_id
  IF NEW.menu_item_id IS DISTINCT FROM OLD.menu_item_id THEN
    IF OLD.menu_item_id IS NOT NULL THEN
      UPDATE public.menu_items
        SET recipe_id = NULL
      WHERE id = OLD.menu_item_id AND recipe_id = NEW.id;
    END IF;
    IF NEW.menu_item_id IS NOT NULL THEN
      UPDATE public.menu_items
        SET recipe_id = NEW.id
      WHERE id = NEW.menu_item_id AND (recipe_id IS DISTINCT FROM NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_recipe_to_menu_item ON public.recipes;
CREATE TRIGGER trg_sync_recipe_to_menu_item
AFTER UPDATE OF menu_item_id ON public.recipes
FOR EACH ROW EXECUTE FUNCTION public.sync_recipe_to_menu_item();

-- Trigger: cuando se actualiza menu_items.recipe_id, propagar a recipes.menu_item_id
CREATE OR REPLACE FUNCTION public.sync_menu_item_to_recipe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.recipe_id IS DISTINCT FROM OLD.recipe_id THEN
    IF OLD.recipe_id IS NOT NULL THEN
      UPDATE public.recipes
        SET menu_item_id = NULL
      WHERE id = OLD.recipe_id AND menu_item_id = NEW.id;
    END IF;
    IF NEW.recipe_id IS NOT NULL THEN
      UPDATE public.recipes
        SET menu_item_id = NEW.id
      WHERE id = NEW.recipe_id AND (menu_item_id IS DISTINCT FROM NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_menu_item_to_recipe ON public.menu_items;
CREATE TRIGGER trg_sync_menu_item_to_recipe
AFTER UPDATE OF recipe_id ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.sync_menu_item_to_recipe();
