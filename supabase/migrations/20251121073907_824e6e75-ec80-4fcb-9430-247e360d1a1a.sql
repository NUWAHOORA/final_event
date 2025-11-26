-- Drop the old policy that excludes admin
DROP POLICY IF EXISTS "Students and staff can create events" ON public.events;

-- Create new policy that includes admin
CREATE POLICY "Users can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'student'::app_role)
);