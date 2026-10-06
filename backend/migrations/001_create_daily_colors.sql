CREATE TABLE IF NOT EXISTS daily_colors (
  color_hex TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL PRIMARY KEY,
  CONSTRAINT daily_colors_color_hex_format CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_colors_color_hex_unique
  ON daily_colors (upper(color_hex));
