CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on social_links" 
  ON public.social_links
  FOR SELECT 
  USING (true);

-- Allow admins/owners to insert/update/delete
CREATE POLICY "Allow admins/owners to insert social_links" 
  ON public.social_links
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'owner')
    )
  );

CREATE POLICY "Allow admins/owners to update social_links" 
  ON public.social_links
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'owner')
    )
  );

CREATE POLICY "Allow admins/owners to delete social_links" 
  ON public.social_links
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'owner')
    )
  );
