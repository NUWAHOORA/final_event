-- Add resources_required field to events table
ALTER TABLE events ADD COLUMN resources_required text;

-- Update resources table to change types from venue to actual resources
-- First, update the enum to include proper resource types
ALTER TYPE resource_type RENAME TO resource_type_old;

CREATE TYPE resource_type AS ENUM ('music_instruments', 'projector', 'chairs', 'tables', 'microphone', 'speakers', 'other');

-- Update the resources table to use new enum
ALTER TABLE resources ALTER COLUMN type TYPE resource_type USING 
  CASE 
    WHEN type::text = 'venue' THEN 'other'::resource_type
    ELSE 'other'::resource_type
  END;

-- Drop old enum
DROP TYPE resource_type_old;