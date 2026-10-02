-- ==========================================================
-- KINETIX FUNCTIONAL ZONE - ESQUEMA DE BASE DE DATOS SUPABASE
-- PostgreSQL + Row Level Security (RLS) + Storage
-- ==========================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES DE USUARIOS (Atletas y Coaches)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'coach', 'admin')),
  height_cm NUMERIC(5,1) NOT NULL DEFAULT 175.0,
  emergency_contact TEXT,
  avatar_url TEXT,
  
  -- Membresía Kinetix (3 Planes Oficiales)
  plan_name TEXT NOT NULL DEFAULT 'Kinetix' CHECK (plan_name IN ('Kinetix', 'Kinetix con Nutrición', 'Entrenos Personalizados (Coach Jorge)')),
  monthly_fee NUMERIC(8,2) NOT NULL DEFAULT 79.99,
  currency TEXT NOT NULL DEFAULT 'USD',
  membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'expiring_soon', 'in_grace_period', 'suspended')),
  expiry_date DATE NOT NULL,
  billing_day_of_month INT NOT NULL DEFAULT 15,
  has_nutrition_plan BOOLEAN NOT NULL DEFAULT false,
  personal_coach TEXT DEFAULT 'Coach Jorge',
  grace_period_days INT NOT NULL DEFAULT 5,
  payment_reminder_sent BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA DE COMPOSICIÓN CORPORAL (Báscula RENPHO)
CREATE TABLE IF NOT EXISTS public.body_composition_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2) NOT NULL,
  muscle_mass_percent NUMERIC(4,1) NOT NULL,
  body_fat_percent NUMERIC(4,1) NOT NULL,
  visceral_fat_level INT NOT NULL CHECK (visceral_fat_level BETWEEN 1 AND 59),
  bmi NUMERIC(4,1) NOT NULL,
  bmi_category TEXT NOT NULL,
  source_scale TEXT DEFAULT 'Renpho',
  notes TEXT,
  recorded_by_role TEXT NOT NULL DEFAULT 'athlete' CHECK (recorded_by_role IN ('athlete', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA DE EVALUACIONES FÍSICAS (Test de Cooper y 1RM del Coach)
CREATE TABLE IF NOT EXISTS public.physical_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  coach_id UUID REFERENCES public.profiles(id),
  coach_name TEXT NOT NULL DEFAULT 'Coach Roberto',
  
  -- Test de Cooper por Niveles
  cooper_level_number INT NOT NULL CHECK (cooper_level_number BETWEEN 1 AND 5),
  cooper_level_label TEXT NOT NULL,
  cooper_distance_meters INT,
  cooper_notes TEXT,
  cooper_target_zone TEXT,
  
  -- Registros de 1RM en formato JSONB (Sentadillas, Peso Muerto, Hip Thrust, Press, Remo)
  strength_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA DE FOTOS DE PROGRESO PRIVADAS
CREATE TABLE IF NOT EXISTS public.private_progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_label TEXT NOT NULL,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  front_photo_url TEXT,
  side_photo_url TEXT,
  back_photo_url TEXT,
  weight_kg NUMERIC(5,2),
  body_fat_percent NUMERIC(4,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. TABLA DE NOTIFICACIONES / AVISOS IN-APP
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment_reminder', 'membership_suspension', 'new_evaluation', 'milestone', 'system_alert')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==========================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_composition_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Reglas para perfiles: cada atleta ve el suyo, coaches ven todos
CREATE POLICY "Atletas pueden ver su propio perfil" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Coaches pueden ver todos los perfiles" 
ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('coach', 'admin'))
);

-- 2. Reglas para fotos privadas: ESTRICTAMENTE SOLO EL ATLETA
CREATE POLICY "Fotos privadas: Solo el dueño tiene acceso"
ON public.private_progress_photos FOR ALL USING (auth.uid() = user_id);

-- 3. Reglas para composición corporal: Atleta puede insertar y ver los suyos, coaches pueden ver
CREATE POLICY "Atletas gestionan sus mediciones de bioimpedancia"
ON public.body_composition_records FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Coaches leen mediciones"
ON public.body_composition_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('coach', 'admin'))
);

-- 4. Reglas para evaluaciones: Coaches pueden insertar/editar, Atletas solo leen las suyas
CREATE POLICY "Atletas leen sus evaluaciones oficiales"
ON public.physical_evaluations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches crean y gestionan evaluaciones"
ON public.physical_evaluations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('coach', 'admin'))
);
