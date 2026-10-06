INSERT INTO daily_colors (color_hex, date)
VALUES
  ('#FFC0CB', '2000-01-01 00:00:00+00'),
  ('#4AB7D8', '2026-10-06 00:00:00+00')
ON CONFLICT (date) DO NOTHING;
