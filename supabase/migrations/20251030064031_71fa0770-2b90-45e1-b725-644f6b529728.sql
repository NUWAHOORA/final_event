-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- System can insert notifications for users
CREATE POLICY "Admins and staff can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Create function to notify all users about new event
CREATE OR REPLACE FUNCTION public.notify_users_new_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_title text;
BEGIN
  -- Get event title
  event_title := NEW.title;
  
  -- Insert notification for all users except the organizer
  INSERT INTO public.notifications (user_id, title, message, type, event_id)
  SELECT 
    u.id,
    'New Event Created',
    'A new event "' || event_title || '" has been created and is pending approval.',
    'event_created',
    NEW.id
  FROM auth.users u
  WHERE u.id != NEW.organizer_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new event notifications
DROP TRIGGER IF EXISTS on_event_created ON public.events;
CREATE TRIGGER on_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_users_new_event();

-- Create function to notify when event is approved
CREATE OR REPLACE FUNCTION public.notify_event_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_title text;
  status_message text;
BEGIN
  -- Only notify on status changes
  IF OLD.status != NEW.status AND (NEW.status = 'approved' OR NEW.status = 'rejected') THEN
    event_title := NEW.title;
    
    IF NEW.status = 'approved' THEN
      status_message := 'Your event "' || event_title || '" has been approved!';
      
      -- Notify all users about approved event
      INSERT INTO public.notifications (user_id, title, message, type, event_id)
      SELECT 
        u.id,
        'Event Approved',
        'The event "' || event_title || '" has been approved and is now live!',
        'event_approved',
        NEW.id
      FROM auth.users u
      WHERE u.id != NEW.organizer_id;
    ELSE
      status_message := 'Your event "' || event_title || '" has been rejected.';
    END IF;
    
    -- Notify organizer
    INSERT INTO public.notifications (user_id, title, message, type, event_id)
    VALUES (
      NEW.organizer_id,
      'Event Status Update',
      status_message,
      'event_' || NEW.status,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for event status changes
DROP TRIGGER IF EXISTS on_event_status_changed ON public.events;
CREATE TRIGGER on_event_status_changed
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_event_status_change();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);