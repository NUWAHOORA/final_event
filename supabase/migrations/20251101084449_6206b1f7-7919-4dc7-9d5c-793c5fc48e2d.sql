-- Add is_approved column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Update existing users to be approved (so they can still log in)
UPDATE public.profiles SET is_approved = true WHERE is_approved = false;

-- Update the handle_new_user function to set is_approved = false for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, full_name, email, department, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'department',
    false  -- New users need approval
  );
  
  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role)
  );
  
  RETURN NEW;
END;
$$;

-- Create index for better performance when querying pending users
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON public.profiles(is_approved);