-- Update handle_new_user() function to add input validation and length limits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  -- Extract and sanitize full_name
  v_full_name := trim(new.raw_user_meta_data ->> 'full_name');
  
  -- Enforce reasonable length limit (100 characters)
  IF v_full_name IS NOT NULL AND length(v_full_name) > 100 THEN
    v_full_name := substring(v_full_name, 1, 100);
  END IF;
  
  -- Handle empty strings as NULL
  IF v_full_name = '' THEN
    v_full_name := NULL;
  END IF;
  
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (new.id, v_full_name);
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create user profile for %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;