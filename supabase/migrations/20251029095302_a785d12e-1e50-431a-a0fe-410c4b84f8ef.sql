-- Allow students to create events (pending approval)
DROP POLICY IF EXISTS "Staff can create events" ON events;

CREATE POLICY "Students and staff can create events"
ON events
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'student'::app_role)
);

-- Students can view and update their own pending events
CREATE POLICY "Users can view their own pending events"
ON events
FOR SELECT
TO authenticated
USING (
  status = 'approved'::event_status OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  organizer_id = auth.uid()
);

DROP POLICY IF EXISTS "Everyone can view approved events" ON events;