-- Allow anyone to read the name of users who have written a review (for displaying reviewer name in customer reviews).
DROP POLICY IF EXISTS "Reviewer names are readable for review display" ON public.users;
CREATE POLICY "Reviewer names are readable for review display" ON public.users
  FOR SELECT USING (id IN (SELECT user_id FROM public.reviews));
