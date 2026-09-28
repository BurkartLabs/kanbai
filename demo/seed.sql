-- Demo content for the local database. Ids are explicit and inserts are
-- IGNOREd so the seed can be re-run. Tracker-linked rows use real product
-- slugs from Azure DevOps; their progress comes from there. The copy and the
-- images are placeholders to be edited in /manage.

INSERT IGNORE INTO columns (id, project_id, title, `order`) VALUES
  (1, 0, 'To Do', 1),
  (2, 0, 'In Progress', 2),
  (3, 0, 'Done', 3);

INSERT IGNORE INTO projects (id, name, description, image_url, external_url, repo_url, ado_slug, featured, sort_order) VALUES
  -- Featured: the big card with the bar and recent milestones.
  (1, 'Interstellar Settlement Protocol',
      'ISP is a browser-based, multiplayer, text-heavy sci-fi strategy game set in the year 2147.',
      '/demo/isp.jpg', NULL, NULL, 'interstellar-settlement-protocol', 1, 10),
  (2, 'Orchestrata',
      'The operations desk behind every project here: one tracker, one work queue, and a dashboard per product that says what shipped and what is stuck.',
      NULL, NULL, NULL, 'orchestrata', 1, 20),
  (3, 'Job Hunt',
      'A private job-search desk: tracks every application and tailors each cover letter and resume to the ad it answers.',
      NULL, NULL, NULL, 'job-hunt', 1, 30),
  (4, 'Beatbranch',
      'GitHub for music producers: branches, merges and playback for arrangements.',
      '/demo/beatbranch.png', NULL, NULL, 'beatbranch', 1, 40),
  -- Compact: name, stage and the bar.
  (5, 'Stonewake',
      'A first-person colony simulation with a simulated world history.',
      NULL, NULL, NULL, 'stonewake', 0, 50),
  (6, 'Cold Harvest',
      'A first-person zombie scavenging run in the browser. One sitting, no servers, no multiplayer.',
      '/demo/cold-harvest.jpg', NULL, NULL, 'cold-harvest', 0, 60),
  (7, 'Relic Vault',
      'A collection game for Android, heading for Google Play.',
      NULL, NULL, NULL, 'relic-vault', 0, 70),
  -- Not in the tracker: cards here, or none yet.
  (8, 'Typetrack',
      'A bare-bones typing test in the spirit of Monkeytype, with one addition: every result is kept, so you can watch your speed change over time.',
      NULL, NULL, NULL, NULL, 0, 80),
  (9, 'Kiln',
      'A small 3D game engine and editor in a warm, chunky look, where every asset is made by a program: no modelled meshes, no painted textures, just recipes the engine fires into geometry.',
      NULL, NULL, NULL, NULL, 0, 90),
  -- Shipped.
  (10, 'Burkart.dev',
      'A Kanban board intended for personal use, and as a way to show others what I''m working on',
      'https://i.ibb.co/1JTmh8Rj/image.png', 'https://burkart.dev', 'https://github.com/pburkart/kanbai', NULL, 0, 100),
  (11, 'Paulburkart.ca',
      'This website will serve as my main digital business card',
      'https://i.ibb.co/7xbWkFVX/image.png', 'https://paulburkart.ca', NULL, NULL, 0, 110),
  (12, 'Burkart.blog',
      'Somewhere to journal progress on the various projects I''m working on: a simple WordPress blog.',
      'https://i.ibb.co/wZvTFYpz/image.png', 'https://burkart.blog', NULL, NULL, 0, 120);

INSERT IGNORE INTO cards (id, project_id, column_id, title, description, `order`) VALUES
  (1, 1, 3, 'Account Registration', 'Implement account registration with session/JWT authentication', 1),
  (2, 1, 3, 'Implement Silicate Mining', 'A basic silicate mining proof of concept', 2),
  (3, 1, 2, 'Bug Sweep', 'A sweep through the application for open bugs', 1),
  (4, 1, 1, 'R&D Tree', 'Finish implementation of Tier 1 and Tier 2 research', 1),
  (5, 9, 3, 'Recipe language', 'Lua recipes that fire into geometry and materials', 1),
  (6, 9, 2, 'Room editor', 'Place and light recipe pieces in a room', 1),
  (7, 9, 1, 'First game', 'A playable room with a goal', 1),
  (8, 10, 3, 'Launch', NULL, 1),
  (9, 11, 3, 'Launch', NULL, 1),
  (10, 12, 3, 'Launch', NULL, 1);
