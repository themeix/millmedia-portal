-- Enable row level security
ALTER TABLE publication_targets ENABLE ROW LEVEL SECURITY;

-- Allow anon/service role reads
CREATE POLICY "Allow public read"
ON publication_targets
FOR SELECT
USING (true);

-- Allow anon writes from app API routes
CREATE POLICY "Allow anon write"
ON publication_targets
FOR ALL
USING (auth.role() = 'anon')
WITH CHECK (auth.role() = 'anon');

-- Allow service role full access
CREATE POLICY "Allow service role full access"
ON publication_targets
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
