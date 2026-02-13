
-- Create the admin user via auth
-- We need to insert the admin role after the user is created via signup
-- Create a function that will be called to set up the initial admin
CREATE OR REPLACE FUNCTION public.setup_initial_admin(admin_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    UPDATE public.profiles SET onboarding_completed = true, user_type = 'gewerbe', display_name = 'Admin'
    WHERE user_id = admin_user_id;
  END IF;
END;
$$;
