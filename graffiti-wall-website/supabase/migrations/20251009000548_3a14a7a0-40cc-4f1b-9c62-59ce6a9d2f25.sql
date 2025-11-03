-- Update Main Billboard timezone to Sydney
UPDATE displays 
SET timezone = 'Australia/Sydney', 
    updated_at = now()
WHERE name = 'Main Billboard';