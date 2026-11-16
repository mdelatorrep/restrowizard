DROP POLICY IF EXISTS "Authenticated users can delete pre-registrations" ON public.growth_preregistrations;
DROP POLICY IF EXISTS "Authenticated users can read pre-registrations" ON public.growth_preregistrations;
CREATE POLICY "Platform admins can delete preregistrations" ON public.growth_preregistrations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can submit a pre-registration" ON public.growth_preregistrations;
CREATE POLICY "Anyone can submit a valid pre-registration" ON public.growth_preregistrations FOR INSERT TO anon, authenticated
WITH CHECK (email IS NOT NULL AND length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND (interest_type IS NULL OR length(interest_type) <= 100));

DROP POLICY IF EXISTS "Authenticated users can view benchmarks" ON public.industry_benchmarks;
CREATE POLICY "Restaurant members can view benchmarks" ON public.industry_benchmarks FOR SELECT TO authenticated
USING (public.get_user_business_id(auth.uid()) IS NOT NULL OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.course_reviews;
CREATE POLICY "View reviews of published courses" ON public.course_reviews FOR SELECT
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.training_courses c WHERE c.id = course_reviews.course_id AND c.is_published = true));

DROP POLICY IF EXISTS "Authenticated can view recipe-menu links" ON public.recipe_menu_items;
CREATE POLICY "View links of accessible recipes" ON public.recipe_menu_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_menu_items.recipe_id));

DROP POLICY IF EXISTS "pos_activity insert" ON public.pos_user_activity;
CREATE POLICY "pos_activity insert" ON public.pos_user_activity FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IN (SELECT public.team_owner_ids('{pos}'::text[], 'read'::text)));