INSERT INTO public.industry_benchmarks
  (metric_name, metric_category, avg_value, percentile_25, percentile_75, sample_size, region, restaurant_type)
VALUES
  ('food_cost_percentage',     'finances',       28.5,  25.0, 33.0, 500, 'LATAM', 'all'),
  ('labor_cost_percentage',    'finances',       22.0,  18.0, 28.0, 500, 'LATAM', 'all'),
  ('gross_margin',             'finances',       65.0,  58.0, 72.0, 500, 'LATAM', 'all'),
  ('average_ticket',           'finances',      285.0, 180.0,420.0, 500, 'LATAM', 'all'),
  ('prime_cost_percentage',    'finances',       55.0,  48.0, 62.0, 500, 'LATAM', 'all'),
  ('avg_order_time_minutes',   'operations',     18.0,  12.0, 25.0, 400, 'LATAM', 'all'),
  ('customer_satisfaction_score','operations',    4.2,   3.8,  4.6, 400, 'LATAM', 'all'),
  ('table_turnover_rate',      'operations',      2.5,   1.8,  3.2, 400, 'LATAM', 'all'),
  ('staff_turnover_rate',      'talent',         45.0,  30.0, 65.0, 300, 'LATAM', 'all'),
  ('absenteeism_rate',         'talent',          5.5,   3.0,  9.0, 300, 'LATAM', 'all'),
  ('food_waste_percentage',    'sustainability', 10.0,   6.0, 15.0, 200, 'LATAM', 'all'),
  ('energy_cost_percentage',   'sustainability',  4.5,   3.0,  6.5, 200, 'LATAM', 'all')
ON CONFLICT DO NOTHING;