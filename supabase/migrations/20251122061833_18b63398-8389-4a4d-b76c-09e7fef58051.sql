-- Create venues table
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  capacity INTEGER,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing venues
CREATE POLICY "Everyone can view venues" 
ON public.venues 
FOR SELECT 
USING (true);

-- Create policy for managing venues (admin only)
CREATE POLICY "Admins can manage venues" 
ON public.venues 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update the foreign key constraint on events table to properly reference venues
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_venue_id_fkey;

ALTER TABLE public.events 
ADD CONSTRAINT events_venue_id_fkey 
FOREIGN KEY (venue_id) 
REFERENCES public.venues(id) 
ON DELETE SET NULL;

-- Add trigger for updated_at on venues
CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default venues
INSERT INTO public.venues (name, location, capacity, description) VALUES
('Main Auditorium', 'Building A, 1st Floor', 500, 'Large auditorium with stage and audio system'),
('Conference Hall', 'Building B, 2nd Floor', 100, 'Modern conference room with projector'),
('Sports Complex', 'Athletic Center', 200, 'Indoor sports facility'),
('Lecture Hall 1', 'Academic Block, 3rd Floor', 150, 'Traditional lecture hall with tiered seating'),
('Open Ground', 'Main Campus', 1000, 'Outdoor event space');

-- Remove venue-related types from resources if they exist
-- Resources should now only be equipment/items, not venues