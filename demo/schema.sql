-- Demo schema: the project tables exactly as lib/projects.ts and lib/manage.ts
-- read and write them. The production schema is not in this repository; this
-- file exists so `npm run demo:db` can stand up a throwaway database for
-- local development. Idempotent.

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  external_url VARCHAR(500) NULL
);

-- project_id 0 marks the default columns every board shares.
CREATE TABLE IF NOT EXISTS columns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL DEFAULT 0,
  title VARCHAR(255) NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  KEY idx_project (project_id)
);

-- `order` is fractional: repositionCard() drops a card between its neighbours
-- and only renormalises when the gap gets too small.
CREATE TABLE IF NOT EXISTS cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  column_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  `order` DOUBLE NOT NULL DEFAULT 0,
  KEY idx_project_column (project_id, column_id)
);
