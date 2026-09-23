-- =====================================================================
-- CIPHER — About page photo collage
-- Run this ONCE in the Supabase dashboard: SQL Editor -> New query -> Run
-- =====================================================================

-- 1) Table that stores the photo links
create table if not exists public.about_photos (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  created_at  timestamptz not null default now()
);

alter table public.about_photos enable row level security;

-- everyone can see the photos on the website
drop policy if exists "about_photos public read" on public.about_photos;
create policy "about_photos public read"
  on public.about_photos for select
  using (true);

-- only logged-in admins can add / remove photos
drop policy if exists "about_photos admin write" on public.about_photos;
create policy "about_photos admin write"
  on public.about_photos for all
  to authenticated
  using (true)
  with check (true);

-- 2) Storage bucket that holds the image files
insert into storage.buckets (id, name, public)
values ('about-photos', 'about-photos', true)
on conflict (id) do nothing;

drop policy if exists "about-photos public read" on storage.objects;
create policy "about-photos public read"
  on storage.objects for select
  using (bucket_id = 'about-photos');

drop policy if exists "about-photos admin upload" on storage.objects;
create policy "about-photos admin upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'about-photos');

drop policy if exists "about-photos admin delete" on storage.objects;
create policy "about-photos admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'about-photos');
