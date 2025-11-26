-- Add uniqueness to user_roles and backfill missing roles from existing users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Backfill roles based on raw_user_meta_data.role, defaulting to 'student'
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
       COALESCE(NULLIF(u.raw_user_meta_data->>'role','')::app_role, 'student'::app_role)
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL;