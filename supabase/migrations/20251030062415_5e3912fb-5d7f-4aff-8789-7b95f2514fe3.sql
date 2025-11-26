-- Ensure unique constraint on user_roles (user_id, role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Create trigger to populate profiles and user_roles on new user signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Backfill profiles for existing users missing a profile
INSERT INTO public.profiles (user_id, full_name, email, department)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', ''),
       u.email,
       u.raw_user_meta_data->>'department'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- Backfill roles for existing users missing a role (default to 'student' if none provided)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
       COALESCE(NULLIF(u.raw_user_meta_data->>'role','')::app_role, 'student'::app_role)
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id
);
