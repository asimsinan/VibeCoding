-- Create the shapes table
CREATE TABLE IF NOT EXISTS public.shapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whiteboard_id UUID REFERENCES public.whiteboards(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'rectangle', 'circle', 'line', 'arrow'
  start_point JSONB NOT NULL, -- {x: number, y: number}
  end_point JSONB NOT NULL,   -- {x: number, y: number}
  stroke_color TEXT NOT NULL,
  stroke_width INTEGER NOT NULL,
  fill_color TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS shapes_whiteboard_id_idx ON public.shapes (whiteboard_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.shapes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to perform all operations (for simplicity, adjust as needed)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.shapes;
CREATE POLICY "Allow all for authenticated users" ON public.shapes
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create the text_objects table
CREATE TABLE IF NOT EXISTS public.text_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whiteboard_id UUID REFERENCES public.whiteboards(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  position JSONB NOT NULL, -- {x: number, y: number}
  font_size INTEGER NOT NULL,
  color TEXT NOT NULL,
  font_family TEXT NOT NULL,
  font_weight TEXT NOT NULL, -- 'normal' or 'bold'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS text_objects_whiteboard_id_idx ON public.text_objects (whiteboard_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.text_objects ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all for authenticated users
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.text_objects;
CREATE POLICY "Allow all for authenticated users" ON public.text_objects
FOR ALL TO authenticated USING (true) WITH CHECK (true);
