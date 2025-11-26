-- Update RLS policy to allow staff to view all events
DROP POLICY IF EXISTS "Users can view their own pending events" ON public.events;

CREATE POLICY "Users can view events based on role" 
ON public.events 
FOR SELECT 
USING (
  status = 'approved'::event_status 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'staff'::app_role)
  OR organizer_id = auth.uid()
);