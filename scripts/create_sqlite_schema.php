<?php
require __DIR__ . '/../api/core.php';

$stmts = [
"CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon_url TEXT,
  description TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  last_edited DATETIME DEFAULT (datetime('now')),
  is_deleted INTEGER DEFAULT 0,
  deleted_at DATETIME DEFAULT NULL
);",

"CREATE TABLE IF NOT EXISTS chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  last_edited DATETIME DEFAULT (datetime('now')),
  is_deleted INTEGER DEFAULT 0,
  deleted_at DATETIME DEFAULT NULL,
  FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);",

"CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL,
  chapter_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_type TEXT,
  content TEXT,
  edit_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now')),
  last_edited DATETIME DEFAULT (datetime('now')),
  is_deleted INTEGER DEFAULT 0,
  deleted_at DATETIME DEFAULT NULL,
  FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);",

"CREATE TABLE IF NOT EXISTS note_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  change_description TEXT,
  user_action TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
);",

"CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  expires_at DATETIME DEFAULT NULL,
  is_active INTEGER DEFAULT 1
);"
];

foreach ($stmts as $s) {
    $pdo->exec($s);
}

echo "SQLite schema created/verified at: ".realpath(__DIR__.'/../data/engnote.sqlite')."\n";
?>