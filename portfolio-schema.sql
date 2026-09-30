-- ============================================================
-- Portfolio columns on `projects`: the link to a tracker product and how the
-- public page ranks it.
--
-- Idempotent, like auth-schema.sql. Safe to run against a live database:
--
--   mysql -u <user> -p <db> < portfolio-schema.sql
--
--   ado_slug    the product slug in Azure DevOps (the `product:<slug>` tag on
--               its epic). NULL for a project that is tracked only here.
--   featured    1 = the big card with the progress bar and recent milestones,
--               0 = a compact row.
--   sort_order  position on the public page, lowest first; ties by id.
--   repo_url    optional source link shown next to the project link.
--   is_completed 1 = marked done by hand. Overrides the tracker stage and the cards: the
--               project sits under Completed whatever those say.
-- ============================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS ado_slug VARCHAR(64) NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_url VARCHAR(500) NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_completed TINYINT(1) NOT NULL DEFAULT 0;
