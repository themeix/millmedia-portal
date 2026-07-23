# Mill Media Analytics Dashboard Portal - PRD

## 1. Product Overview

Mill Media currently uses a Google Sheets-based reporting system for subscriber analytics. The goal is to replace this with a reliable analytics dashboard powered by automated data collection from Ghost and Stripe.

The platform will provide:
- Paid subscriber analytics
- Free subscriber analytics  
- Top performing stories
- Monthly targets
- Historical trends
- Sync monitoring

## 2. Technology Stack

### Frontend
- Next.js 16
- Tailwind CSS
- shadcn/ui
- Recharts
- TanStack Table

### Backend
- Next.js API Routes
- Scheduled sync jobs

### Database
- Supabase PostgreSQL

### Data Sources
- Ghost (Members, Posts, Authors, Comments)
- Stripe (Customers, Subscriptions, Invoices, Charges)

## 3. Database Structure

### Existing Tables with Verified Schema

#### Subscriber Data
- **members** (280,426 rows)
  - Fields: id, site_id, email, name, status, created_at, labels, country, last_seen_at, is_active, deleted_at, source, synced_at, subscription_count, email_count, email_opened_count, email_open_rate, email_suppressed, email_suppression_reason, newsletters, subscribed_to_email, can_comment, attribution_type, attribution_id, attribution_title, attribution_url, referrer_source, referrer_medium, referrer_url

- **paying_members** (17,163 rows)
  - Segregated paid subscriber data for analytics

- **newsletter_subscribers** (263,263 rows)
  - Newsletter-specific subscriber tracking

- **ghost_signup_events** (2,071 rows)
  - Signup event tracking and attribution

#### Stripe Data
- **stripe_customers** (35,406 rows)
  - Customer information and billing details

- **stripe_subscriptions** (33,885 rows)
  - Fields: id, customer_id, status, amount, currency, interval, created, current_period_start, current_period_end, cancel_at_period_end, canceled_at, ended_at, cancel_reason, synced_at, site_id, stripe_account_id, source_version, import_run_id

- **stripe_events** (180,478 rows)
  - Event log for webhook and API events

- **stripe_invoices** (239,266 rows)
  - Invoice data for revenue tracking

- **stripe_charges** (244,500 rows)
  - Charge and payment transaction data

#### Content Data
- **posts** (4,907 rows)
  - Fields: id, site_id, title, slug, published_at, url, primary_author_id, is_active, synced_at

- **authors** (288 rows)
  - Author profiles and metadata

- **comments** (19,561 rows)
  - Comment data for engagement metrics

#### Monitoring Data
- **sync_runs** (139 rows)
  - Sync job execution history

- **sync_log** (0 rows)
  - Detailed sync operation logs

- **sync_history** (12 rows)
  - Historical sync data tracking

- **api_errors** (0 rows)
  - API error tracking and debugging

### New Tables Required

#### subscriber_targets
Purpose: Store monthly growth targets for tracking progress.

Fields:
- id (uuid, primary key)
- site_id (text)
- metric_type (text: 'paid', 'free', 'newsletter')
- target_value (integer)
- month (date)
- created_at (timestamp)
- updated_at (timestamp)

#### post_metrics
Purpose: Store article performance analytics for top stories dashboard.

Fields:
- id (uuid, primary key)
- post_id (uuid, references posts.id)
- views (integer)
- free_signups (integer)
- paid_signups (integer)
- comments (integer)
- recorded_date (date)
- created_at (timestamp)

## 4. Dashboard Pages

### Page 1 - Paid Subscribers Dashboard

**Data Sources:**
- `paying_members` table for current subscriber counts
- `stripe_subscriptions` for subscription status and revenue
- `subscriber_targets` for monthly targets
- `members` table for growth tracking via created_at

**Features:**
- Rolling 12 month subscriber chart
- Current paying subscribers (from paying_members count)
- Monthly target (from subscriber_targets)
- Progress percentage (current/target * 100)
- New paid subscribers this month (members created in current month with paid status)
- Last 30 day growth (members created in last 30 days)
- Pace-to-target reference line
- All company rollup (aggregated across all site_ids)

**Supported Publications:**
- The Mill, The Tribune, The Post, The Dispatch, The Bell, The Londoner, The Exchange (filtered by site_id)

### Page 2 - Free Subscribers Dashboard

**Data Sources:**
- `newsletter_subscribers` for current free subscriber counts
- `members` table for growth tracking (non-paid members)
- `subscriber_targets` for monthly targets

**Features:**
- Newsletter subscriber growth chart
- Monthly targets
- Current free subscribers
- New subscribers this month
- Last 30 day growth
- Pace-to-target line
- Company-wide rollup

**Filtering:**
- Free subscribers = members without paid subscriptions
- Newsletter data specifically from newsletter_subscribers table

### Page 3 - Top Performing Stories

**Data Sources:**
- `posts` table for article metadata
- `authors` table for author information
- `comments` table for engagement metrics
- `post_metrics` table for performance analytics
- `ghost_signup_events` for attribution tracking

**Columns:**
- Headline (posts.title)
- Publication (site_id)
- Author (authors.name via primary_author_id)
- Free subscriber growth (from post_metrics.free_signups)
- Paid subscriber growth (from post_metrics.paid_signups)
- Comments (comments.count or post_metrics.comments)
- Page views (from post_metrics.views)
- Publish date (posts.published_at)

**Features:**
- Sorting by any column
- Search by headline
- Publication filtering by site_id
- Date range filtering

## 5. Data Synchronization

### Daily Automated Sync

**Ghost Data:**
- Members (full sync + incremental)
- Posts (new and updated)
- Authors (profile updates)
- Newsletter subscriber counts
- Comments (engagement metrics)

**Stripe Data:**
- Subscriptions (status changes, new, cancelled)
- Revenue data (invoices, charges)
- MRR calculations
- Cancellations and refunds
- Customer updates

**Sync Strategy:**
- Use existing `sync_runs` table for job tracking
- Log detailed operations to `sync_log`
- Maintain historical data in `sync_history`
- Capture API errors in `api_errors`

## 6. Analytics Calculations

### Paid Subscriber Metrics
- Current paid subscribers: COUNT(*) FROM paying_members WHERE is_active = true
- New this month: COUNT(*) FROM members WHERE status = 'paid' AND created_at >= start_of_month
- 30-day growth: COUNT(*) FROM members WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '30 days'
- MRR: SUM(amount) FROM stripe_subscriptions WHERE status = 'active'

### Free Subscriber Metrics
- Current free subscribers: COUNT(*) FROM newsletter_subscribers
- New this month: COUNT(*) FROM members WHERE status != 'paid' AND created_at >= start_of_month
- Growth rate: (new_subscribers / total_subscribers) * 100

### Content Performance
- Post engagement: Aggregate views, signups, comments from post_metrics
- Author performance: Group by primary_author_id
- Attribution tracking: Use ghost_signup_events.attribution_id to link posts to signups

## 7. Reliability Requirements

The system must:
- Log every sync execution in sync_runs table
- Handle API failures gracefully with retry logic
- Keep previous valid data when sync fails
- Never show incorrect zero values (use last known good data)
- Provide sync health information via dashboard
- Monitor data freshness timestamps

## 8. Admin Panel

### Target Management
Admin users can:
- Add monthly targets via subscriber_targets table
- Edit existing targets
- Select publication by site_id
- Select metric type (paid, free, newsletter)
- View target achievement progress

### Sync Monitoring
Display:
- Last sync time from sync_runs
- Sync status and duration
- Recent errors from api_errors
- Data freshness indicators
- Manual sync trigger capability

## 9. API Endpoints

### Dashboard Data
- GET /api/dashboard/paid - Paid subscriber analytics
- GET /api/dashboard/free - Free subscriber analytics  
- GET /api/dashboard/stories - Top performing stories
- GET /api/dashboard/summary - Combined overview metrics

### Admin Operations
- GET /api/admin/targets - List all targets
- POST /api/admin/targets - Create new target
- PUT /api/admin/targets/:id - Update target
- DELETE /api/admin/targets/:id - Delete target
- GET /api/admin/sync-status - Current sync health
- POST /api/admin/sync-trigger - Manual sync initiation

### Data Operations
- GET /api/data/publications - List available sites/publications
- GET /api/data/authors - List authors for filtering
- GET /api/data/historical/:metric - Historical data for charts

## 10. Security

Requirements:
- Supabase authentication with Row Level Security
- Protected API routes with proper authorization
- Secure environment variables for database credentials
- Admin panel access restricted to authorized users
- API rate limiting and CORS configuration
- Input validation and sanitization

## 11. Development Phases

### Phase 1: Database Setup & API Layer
- Create new tables (subscriber_targets, post_metrics)
- Set up Supabase client configuration
- Build API endpoints for data retrieval
- Implement basic authentication

### Phase 2: Dashboard UI Development
- Build paid subscribers dashboard
- Build free subscribers dashboard
- Implement charts and visualizations
- Add responsive design

### Phase 3: Content Analytics & Admin
- Build top performing stories page
- Create admin panel for target management
- Implement sync monitoring interface
- Add data filtering and search

### Phase 4: Enhancement & Deployment
- Implement automated sync jobs
- Add error handling and logging
- Performance optimization
- Testing and deployment

## 12. Acceptance Criteria

The system is complete when:
- Google Sheet workflow is replaced with dashboard
- Data updates automatically via scheduled syncs
- Paid dashboard shows accurate subscriber metrics
- Free dashboard displays newsletter growth
- Story analytics page loads top performing content
- Targets are editable via admin panel
- Historical data is preserved and queryable
- Sync failures are logged and visible
- Dashboard is responsive on mobile devices
- All publications (The Mill, The Tribune, etc.) are supported
- Real-time sync status is available