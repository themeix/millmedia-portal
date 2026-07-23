-- Run these in your Supabase SQL Editor to create optimized views and indexes

-- 1. Create composite index for members table (optimizes all publication queries)
CREATE INDEX IF NOT EXISTS idx_members_site_status_created 
ON members(site_id, status, created_at);

-- 2. Create index for newsletter_subscribers created_at
CREATE INDEX IF NOT EXISTS idx_newsletter_created_at 
ON newsletter_subscribers(created_at);

-- 3. Create view for publication stats (replaces 18 queries with 1)
CREATE OR REPLACE VIEW publication_stats AS
SELECT
  site_id,
  COUNT(*) FILTER (WHERE status='free') AS current_total,
  COUNT(*) FILTER (WHERE status='free' AND created_at >= date_trunc('month', now())) AS new_this_month,
  COUNT(*) FILTER (WHERE status='free' AND created_at >= now() - interval '30 days') AS last_30_days
FROM members
GROUP BY site_id;

-- 4. Create view for daily subscriber growth (replaces manual JS aggregation)
CREATE OR REPLACE VIEW daily_subscriber_growth AS
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS actual
FROM newsletter_subscribers
WHERE created_at >= now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- 5. Create materialized view for faster daily data refreshes
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_subscriber_growth_mv AS
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS actual
FROM newsletter_subscribers
GROUP BY DATE(created_at);

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_daily_growth_mv_date 
ON daily_subscriber_growth_mv(date);

-- Function to refresh materialized view (call this periodically or via cron)
CREATE OR REPLACE FUNCTION refresh_daily_growth()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_subscriber_growth_mv;
END;
$$ LANGUAGE plpgsql;