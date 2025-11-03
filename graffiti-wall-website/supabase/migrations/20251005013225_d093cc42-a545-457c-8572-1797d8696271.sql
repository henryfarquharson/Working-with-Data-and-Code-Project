-- Add overlap exclusion constraint to bookings table to prevent scheduling conflicts
-- This ensures no two bookings for the same display can overlap in time

-- First, we need to install the btree_gist extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add the exclusion constraint
-- This prevents any two bookings from overlapping for the same display_id
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_display_time_excl 
EXCLUDE USING gist (
  display_id WITH =,
  tstzrange(start_time, end_time) WITH &&
);