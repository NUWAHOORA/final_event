-- Update notification function to notify ALL users (including organizer)
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
  
  -- Insert notification for ALL users
  INSERT INTO public.notifications (user_id, title, message, type, event_id)
  SELECT
    u.id,
    'New Event Created',
    'A new event "' || event_title || '" has been created and is pending approval.',
    'event_created',
    NEW.id
  FROM auth.users u;
  
  RETURN NEW;
END;
$$;

-- Update status change function to notify ALL users about approved events
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
      -- Notify ALL users about approved event
      INSERT INTO public.notifications (user_id, title, message, type, event_id)
      SELECT
        u.id,
        'Event Approved',
        'The event "' || event_title || '" has been approved and is now live!',
        'event_approved',
        NEW.id
      FROM auth.users u;
    ELSE
      -- Notify only organizer about rejection
      status_message := 'Your event "' || event_title || '" has been rejected.';
      INSERT INTO public.notifications (user_id, title, message, type, event_id)
      VALUES (
        NEW.organizer_id,
        'Event Status Update',
        status_message,
        'event_rejected',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;