-- Run once in Supabase > SQL Editor
create extension if not exists vector;

create table tools(name text primary key, category text not null, description text, url text not null,
  quality numeric not null default 7, ease numeric not null default 7, value numeric not null default 7, features numeric not null default 7,
  embedding vector(384));
create table news(id bigint generated always as identity primary key, date date not null default current_date, title text not null, summary text, link text, tag text);
create table reviews(id uuid primary key default gen_random_uuid(), tool text not null, rating int check(rating between 1 and 5),
  body text check(char_length(body)<=500), status text not null default 'pending' check(status in('pending','approved','rejected')), created_at timestamptz default now());
create table events(id bigint generated always as identity primary key, type text not null, tool text, created_at timestamptz default now());
create table admins(email text primary key);

-- 1) Create your admin user in Authentication > Users, then add the same email here:
-- insert into admins values('you@example.com');

create function is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from admins where email = auth.jwt()->>'email') $$;

alter table tools enable row level security;  alter table news enable row level security;
alter table reviews enable row level security; alter table events enable row level security;
alter table admins enable row level security;

create policy tools_r on tools for select using(true);
create policy tools_w on tools for all using(is_admin()) with check(is_admin());
create policy news_r on news for select using(true);
create policy news_w on news for all using(is_admin()) with check(is_admin());
create policy rev_r on reviews for select using(status='approved' or is_admin());
create policy rev_i on reviews for insert with check(status='pending');
create policy rev_w on reviews for update using(is_admin()) with check(is_admin());
create policy rev_d on reviews for delete using(is_admin());
create policy ev_i on events for insert with check(type in('page','view_tool','stack'));
create policy ev_r on events for select using(is_admin());

-- Similar Tools (pgvector). Needs tools.embedding filled; the site falls back to local matching until then.
create function similar_tools(tool_name text, k int default 4)
returns table(name text, score float) language sql stable as
$$ select t.name, 1-(t.embedding <=> s.embedding) from tools t, tools s
   where s.name=tool_name and t.name<>s.name and t.embedding is not null and s.embedding is not null
   order by t.embedding <=> s.embedding limit k $$;
create index on tools using hnsw (embedding vector_cosine_ops);
