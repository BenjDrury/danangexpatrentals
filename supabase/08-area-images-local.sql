-- Optional: point area images to local website assets (run after 02-areas-apartments).
-- Use paths relative to your website origin (e.g. /danang-my-khe.jpg).
update public.areas set images = ARRAY['/danang-dragon-bridge.jpg'] where id = 'an-thuong';
update public.areas set images = ARRAY['/danang-my-khe.jpg'] where id = 'my-khe';
update public.areas set images = ARRAY['/danang-hands.jpg'] where id = 'my-an';
update public.areas set images = ARRAY['/danang-bana-hills.jpg'] where id = 'other';
