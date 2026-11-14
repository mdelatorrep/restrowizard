-- Create enum types for job board
CREATE TYPE public.job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');
CREATE TYPE public.experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead');
CREATE TYPE public.job_category AS ENUM ('kitchen', 'service', 'management', 'administration', 'marketing', 'finance', 'maintenance');
CREATE TYPE public.application_status AS ENUM ('pending', 'reviewed', 'interview', 'accepted', 'rejected');
CREATE TYPE public.course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE public.course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.enrollment_status AS ENUM ('enrolled', 'completed', 'dropped', 'certified');

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    job_type job_type NOT NULL,
    job_category job_category NOT NULL,
    experience_level experience_level NOT NULL,
    location TEXT NOT NULL,
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    currency TEXT DEFAULT 'EUR',
    benefits TEXT[],
    skills_required TEXT[],
    restaurant_name TEXT NOT NULL,
    application_deadline TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min)
);

-- Create job applications table
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    cover_letter TEXT,
    resume_url TEXT,
    status application_status DEFAULT 'pending',
    notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    interview_date TIMESTAMP WITH TIME ZONE,
    UNIQUE(job_id, applicant_id)
);

-- Create training courses table
CREATE TABLE public.training_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    objectives TEXT,
    content_outline TEXT,
    course_level course_level NOT NULL,
    job_category job_category NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency TEXT DEFAULT 'EUR',
    max_participants INTEGER CHECK (max_participants > 0),
    prerequisites TEXT,
    certification_provided BOOLEAN DEFAULT false,
    skills_covered TEXT[],
    course_image TEXT,
    status course_status DEFAULT 'draft',
    rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_enrollments INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course enrollments table
CREATE TABLE public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status enrollment_status DEFAULT 'enrolled',
    final_grade DECIMAL(5,2) CHECK (final_grade >= 0 AND final_grade <= 100),
    certificate_url TEXT,
    payment_status TEXT DEFAULT 'pending',
    amount_paid DECIMAL(10,2) DEFAULT 0,
    UNIQUE(course_id, student_id)
);

-- Create course reviews table
CREATE TABLE public.course_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    enrollment_id UUID REFERENCES public.course_enrollments(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, reviewer_id)
);

-- Create applicant profiles table for additional job seeker info
CREATE TABLE public.applicant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    headline TEXT,
    bio TEXT,
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
    preferred_job_types job_type[],
    preferred_categories job_category[],
    skills TEXT[],
    certifications TEXT[],
    languages TEXT[],
    desired_salary_min DECIMAL(10,2),
    desired_salary_max DECIMAL(10,2),
    currency TEXT DEFAULT 'EUR',
    availability_status TEXT DEFAULT 'available',
    portfolio_url TEXT,
    linkedin_url TEXT,
    resume_url TEXT,
    is_open_to_remote BOOLEAN DEFAULT false,
    preferred_locations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (desired_salary_max IS NULL OR desired_salary_min IS NULL OR desired_salary_max >= desired_salary_min)
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs
CREATE POLICY "Anyone can view active jobs" ON public.jobs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Employers can manage their jobs" ON public.jobs
    FOR ALL USING (auth.uid() = employer_id);

-- RLS Policies for job applications
CREATE POLICY "Users can view their applications" ON public.job_applications
    FOR SELECT USING (
        auth.uid() = applicant_id OR 
        auth.uid() IN (SELECT employer_id FROM public.jobs WHERE id = job_id)
    );

CREATE POLICY "Users can create applications" ON public.job_applications
    FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants and employers can update applications" ON public.job_applications
    FOR UPDATE USING (
        auth.uid() = applicant_id OR 
        auth.uid() IN (SELECT employer_id FROM public.jobs WHERE id = job_id)
    );

-- RLS Policies for training courses
CREATE POLICY "Anyone can view published courses" ON public.training_courses
    FOR SELECT USING (status = 'published');

CREATE POLICY "Instructors can manage their courses" ON public.training_courses
    FOR ALL USING (auth.uid() = instructor_id);

-- RLS Policies for course enrollments
CREATE POLICY "Users can view their enrollments" ON public.course_enrollments
    FOR SELECT USING (
        auth.uid() = student_id OR 
        auth.uid() IN (SELECT instructor_id FROM public.training_courses WHERE id = course_id)
    );

CREATE POLICY "Users can create enrollments" ON public.course_enrollments
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students and instructors can update enrollments" ON public.course_enrollments
    FOR UPDATE USING (
        auth.uid() = student_id OR 
        auth.uid() IN (SELECT instructor_id FROM public.training_courses WHERE id = course_id)
    );

-- RLS Policies for course reviews
CREATE POLICY "Anyone can view course reviews" ON public.course_reviews
    FOR SELECT USING (true);

CREATE POLICY "Students can create reviews for enrolled courses" ON public.course_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_id AND 
        auth.uid() IN (SELECT student_id FROM public.course_enrollments WHERE id = enrollment_id)
    );

-- RLS Policies for applicant profiles
CREATE POLICY "Anyone can view applicant profiles" ON public.applicant_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their applicant profile" ON public.applicant_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX idx_jobs_category ON public.jobs(job_category);
CREATE INDEX idx_jobs_location ON public.jobs(location);
CREATE INDEX idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_training_courses_instructor_id ON public.training_courses(instructor_id);
CREATE INDEX idx_training_courses_category ON public.training_courses(job_category);
CREATE INDEX idx_training_courses_status ON public.training_courses(status);
CREATE INDEX idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_student_id ON public.course_enrollments(student_id);
CREATE INDEX idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX idx_applicant_profiles_user_id ON public.applicant_profiles(user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_courses_updated_at
    BEFORE UPDATE ON public.training_courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applicant_profiles_updated_at
    BEFORE UPDATE ON public.applicant_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update job view count
CREATE OR REPLACE FUNCTION public.increment_job_views(job_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.jobs 
    SET views_count = views_count + 1 
    WHERE id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update applications count
CREATE OR REPLACE FUNCTION public.update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.jobs 
        SET applications_count = applications_count + 1 
        WHERE id = NEW.job_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.jobs 
        SET applications_count = applications_count - 1 
        WHERE id = OLD.job_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_applications_count
    AFTER INSERT OR DELETE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_job_applications_count();

-- Create function to update course rating and enrollments
CREATE OR REPLACE FUNCTION public.update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update course rating
    IF TG_TABLE_NAME = 'course_reviews' THEN
        UPDATE public.training_courses 
        SET rating = (
            SELECT ROUND(AVG(rating)::numeric, 1)
            FROM public.course_reviews 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        )
        WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    END IF;
    
    -- Update enrollments count
    IF TG_TABLE_NAME = 'course_enrollments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE public.training_courses 
            SET total_enrollments = total_enrollments + 1 
            WHERE id = NEW.course_id;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public.training_courses 
            SET total_enrollments = total_enrollments - 1 
            WHERE id = OLD.course_id;
            RETURN OLD;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.course_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_course_stats();

CREATE TRIGGER update_course_enrollments
    AFTER INSERT OR DELETE ON public.course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_course_stats();