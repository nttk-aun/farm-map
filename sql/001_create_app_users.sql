begin;

create extension if not exists pgcrypto;

create table if not exists farm.app_users (
  id bigserial primary key,
  username varchar(100) not null unique,
  password_hash text not null,
  role varchar(20) not null check (role in ('user', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_users_role on farm.app_users (role);
create index if not exists idx_app_users_active on farm.app_users (is_active);

insert into farm.app_users (username, password_hash, role, is_active)
values ('admin', crypt('ChangeMe123!', gen_salt('bf', 12)), 'admin', true)
on conflict (username) do update
set
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = now();

commit;
