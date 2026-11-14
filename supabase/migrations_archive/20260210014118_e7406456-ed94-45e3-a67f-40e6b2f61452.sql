
-- =============================================
-- RestroLearn: Complete Database Schema
-- =============================================

-- 1. New table: learning_tracks
CREATE TABLE public.learning_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,
  target_role TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  estimated_weeks INTEGER,
  courses_count INTEGER NOT NULL DEFAULT 0,
  enrollments_count INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  icon_emoji TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published tracks" ON public.learning_tracks FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage tracks" ON public.learning_tracks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 2. New table: learning_track_courses
CREATE TABLE public.learning_track_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(track_id, course_id)
);

ALTER TABLE public.learning_track_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view track courses" ON public.learning_track_courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage track courses" ON public.learning_track_courses FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. New table: course_lessons
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free_preview BOOLEAN NOT NULL DEFAULT false,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  quiz_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view free preview lessons" ON public.course_lessons FOR SELECT USING (is_free_preview = true);
CREATE POLICY "Enrolled users can view lessons" ON public.course_lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.course_id = course_lessons.course_id AND ce.user_id = auth.uid())
);
CREATE POLICY "Admins can manage lessons" ON public.course_lessons FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 4. New table: lesson_progress
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  quiz_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);

-- 5. New table: course_reviews
CREATE TABLE public.course_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.course_reviews FOR SELECT USING (true);
CREATE POLICY "Users manage own reviews" ON public.course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.course_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.course_reviews FOR DELETE USING (auth.uid() = user_id);

-- 6. New table: course_certificates
CREATE TABLE public.course_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.training_courses(id) ON DELETE SET NULL,
  track_id UUID REFERENCES public.learning_tracks(id) ON DELETE SET NULL,
  certificate_type TEXT NOT NULL DEFAULT 'course',
  certificate_number TEXT NOT NULL UNIQUE DEFAULT ('CERT-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::text) FROM 1 FOR 10))),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own certificates" ON public.course_certificates FOR SELECT USING (auth.uid() = user_id);

-- 7. Alter training_courses - add new fields
ALTER TABLE public.training_courses
  ADD COLUMN IF NOT EXISTS lessons_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_duration_minutes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instructor_name TEXT,
  ADD COLUMN IF NOT EXISTS instructor_bio TEXT,
  ADD COLUMN IF NOT EXISTS instructor_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS what_you_learn TEXT[],
  ADD COLUMN IF NOT EXISTS requirements TEXT[],
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS completion_certificate BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_generated_content BOOLEAN NOT NULL DEFAULT false;

-- 8. Alter course_enrollments - add new fields
ALTER TABLE public.course_enrollments
  ADD COLUMN IF NOT EXISTS lessons_completed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_lessons INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_lesson_id UUID,
  ADD COLUMN IF NOT EXISTS certificate_id UUID REFERENCES public.course_certificates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enrolled_via TEXT NOT NULL DEFAULT 'direct';

-- 9. Trigger: update lessons_count & total_duration on course_lessons changes
CREATE OR REPLACE FUNCTION public.update_course_lesson_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.training_courses SET
    lessons_count = (SELECT COUNT(*) FROM public.course_lessons WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)),
    total_duration_minutes = (SELECT COALESCE(SUM(duration_minutes), 0) FROM public.course_lessons WHERE course_id = COALESCE(NEW.course_id, OLD.course_id))
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_course_lesson_stats
AFTER INSERT OR UPDATE OR DELETE ON public.course_lessons
FOR EACH ROW EXECUTE FUNCTION public.update_course_lesson_stats();

-- 10. Trigger: update courses_count on learning_track_courses changes
CREATE OR REPLACE FUNCTION public.update_track_course_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.learning_tracks SET
    courses_count = (SELECT COUNT(*) FROM public.learning_track_courses WHERE track_id = COALESCE(NEW.track_id, OLD.track_id))
  WHERE id = COALESCE(NEW.track_id, OLD.track_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_track_course_count
AFTER INSERT OR UPDATE OR DELETE ON public.learning_track_courses
FOR EACH ROW EXECUTE FUNCTION public.update_track_course_count();

-- 11. Trigger: recalculate average_rating on course_reviews changes
CREATE OR REPLACE FUNCTION public.update_course_avg_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.training_courses SET
    average_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.course_reviews WHERE course_id = COALESCE(NEW.course_id, OLD.course_id))
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_course_avg_rating
AFTER INSERT OR UPDATE OR DELETE ON public.course_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_course_avg_rating();

-- 12. Function: issue certificate when course completed 100%
CREATE OR REPLACE FUNCTION public.check_course_completion_certificate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_cert_id UUID;
  v_course_has_cert BOOLEAN;
BEGIN
  IF NEW.is_completed = true AND (OLD IS NULL OR OLD.is_completed = false) THEN
    SELECT COUNT(*) INTO v_total FROM public.course_lessons WHERE course_id = NEW.course_id;
    SELECT COUNT(*) INTO v_completed FROM public.lesson_progress WHERE course_id = NEW.course_id AND user_id = NEW.user_id AND is_completed = true;
    
    IF v_total > 0 AND v_completed >= v_total THEN
      SELECT completion_certificate INTO v_course_has_cert FROM public.training_courses WHERE id = NEW.course_id;
      IF v_course_has_cert THEN
        IF NOT EXISTS (SELECT 1 FROM public.course_certificates WHERE user_id = NEW.user_id AND course_id = NEW.course_id) THEN
          INSERT INTO public.course_certificates (user_id, course_id, certificate_type)
          VALUES (NEW.user_id, NEW.course_id, 'course')
          RETURNING id INTO v_cert_id;
          
          UPDATE public.course_enrollments SET
            certificate_id = v_cert_id,
            completed_at = now(),
            progress_percent = 100,
            lessons_completed = v_completed,
            total_lessons = v_total
          WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
        END IF;
      END IF;
    END IF;
    
    -- Update enrollment progress
    UPDATE public.course_enrollments SET
      lessons_completed = v_completed,
      total_lessons = v_total,
      progress_percent = CASE WHEN v_total > 0 THEN ROUND((v_completed::numeric / v_total) * 100) ELSE 0 END,
      last_lesson_id = NEW.lesson_id
    WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_course_completion
AFTER INSERT OR UPDATE ON public.lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.check_course_completion_certificate();
