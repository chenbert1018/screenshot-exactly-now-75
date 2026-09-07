INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'v1c6_admin_7051@example.com'
ON CONFLICT (user_id, role) DO NOTHING;