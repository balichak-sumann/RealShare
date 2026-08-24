-- RealShare Properties Database Schema (PostgreSQL / Supabase)
-- Full Domain Model supporting Investors, Agents, Builders, Employees, and Admins

-- Enable PostGIS for geospatial property mapping
create extension if not exists postgis;

-- 1. Profiles Table (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  full_name text not null,
  email text,
  phone_number text,
  role text check (role in (
    'investor',
    'agent',
    'builder',
    'employee_sales',
    'employee_support',
    'employee_accounts',
    'admin'
  )) default 'investor',
  avatar_url text,
  wallet_balance numeric(15, 2) default 0.00,
  kyc_status text check (kyc_status in ('not_submitted', 'pending', 'verified', 'rejected')) default 'not_submitted',
  kyc_rejection_reason text,
  referral_code text unique,
  referred_by_code text,
  is_active boolean default true,
  is_banned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Public profiles viewable by authenticated users" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins have full profile access" on profiles for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- 2. KYC Documents Table (Aadhaar, PAN, Passport)
create table if not exists public.kyc_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  document_type text check (document_type in ('aadhaar', 'pan', 'passport')) not null,
  document_number text not null,
  document_front_url text not null,
  document_back_url text,
  verification_status text check (verification_status in ('pending', 'verified', 'rejected')) default 'pending',
  rejection_reason text,
  verified_by uuid references public.profiles(id),
  verified_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.kyc_documents enable row level security;
create policy "Users can view their own KYC docs" on kyc_documents for select using (auth.uid() = user_id);
create policy "Users can upload their own KYC docs" on kyc_documents for insert with check (auth.uid() = user_id);
create policy "Admins can view and verify all KYC docs" on kyc_documents for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- 3. Properties Table
create table if not exists public.properties (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  property_type text check (property_type in ('commercial', 'holiday', 'residential', 'international')) not null,
  total_fractions integer not null check (total_fractions > 0),
  available_fractions integer not null check (available_fractions >= 0),
  sold_fractions integer default 0 check (sold_fractions >= 0),
  price_per_fraction numeric(12, 2) not null,
  booking_amount numeric(12, 2) default 50000.00,
  assured_yield numeric(5, 2), -- e.g. 9.5%
  target_irr numeric(5, 2),     -- e.g. 16.8%
  state text not null,
  district text not null,
  locality text not null,
  full_address text,
  lat numeric(10, 6),
  lng numeric(10, 6),
  location geometry(Point, 4326),
  video_url text,
  brochure_url text,
  posted_by uuid references public.profiles(id),
  approval_status text check (approval_status in ('draft', 'pending_approval', 'approved', 'rejected', 'sold_out')) default 'pending_approval',
  rejection_notes text,
  featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to maintain location coordinates geometry
create or replace function update_location_geometry()
returns trigger as $$
begin
  if new.lat is not null and new.lng is not null then
    new.location = st_setsrid(st_makepoint(new.lng, new.lat), 4326);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_update_location_geometry
  before insert or update on public.properties
  for each row
  execute function update_location_geometry();

alter table public.properties enable row level security;
create policy "Approved properties are viewable by everyone" on properties for select using (approval_status = 'approved');
create policy "Builders can view their own submitted properties" on properties for select using (auth.uid() = posted_by);
create policy "Builders can insert properties" on properties for insert with check (auth.uid() = posted_by);
create policy "Builders can update their own unapproved properties" on properties for update using (auth.uid() = posted_by and approval_status in ('draft', 'pending_approval'));
create policy "Admins have full access to manage properties" on properties for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- 4. Property Images Table
create table if not exists public.property_images (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  image_url text not null,
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.property_images enable row level security;
create policy "Property images viewable by all" on property_images for select using (true);
create policy "Admins & post builders can manage images" on property_images for all using (
  exists (
    select 1 from public.properties
    where properties.id = property_images.property_id
    and (properties.posted_by = auth.uid() or exists (
      select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'
    ))
  )
);

-- 5. Investments Table (Fractional Ownership)
create table if not exists public.investments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  property_id uuid references public.properties(id) not null,
  fractions_bought integer not null check (fractions_bought > 0),
  total_amount numeric(15, 2) not null,
  booking_amount_paid numeric(15, 2) not null,
  ownership_percentage numeric(6, 3) not null,
  certificate_number text unique,
  status text check (status in ('booked', 'completed', 'cancelled')) default 'completed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.investments enable row level security;
create policy "Users can view their own investments" on investments for select using (auth.uid() = user_id);
create policy "Admins can view all investments" on investments for select using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- 6. Financial Transactions & Ledger Table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  property_id uuid references public.properties(id),
  investment_id uuid references public.investments(id),
  transaction_type text check (transaction_type in (
    'booking_payment',
    'fraction_purchase',
    'rental_yield_payout',
    'agent_commission_payout',
    'wallet_topup',
    'refund'
  )) not null,
  amount numeric(15, 2) not null,
  currency text default 'INR',
  payment_gateway text default 'Razorpay', -- Razorpay / PayU / Cashfree
  gateway_txn_id text,
  payment_method text check (payment_method in ('upi', 'credit_card', 'debit_card', 'net_banking', 'wallet')),
  payment_status text check (payment_status in ('initiated', 'pending', 'success', 'failed', 'refunded')) default 'pending',
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;
create policy "Users can view own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Admins and Accounts team can view all transactions" on transactions for select using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'employee_accounts')
  )
);

-- 7. Agent Commissions & Referral Tracking
create table if not exists public.agent_commissions (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references public.profiles(id) not null,
  investor_id uuid references public.profiles(id) not null,
  property_id uuid references public.properties(id) not null,
  investment_id uuid references public.investments(id) not null,
  commission_percentage numeric(5, 2) default 2.00, -- e.g. 2%
  commission_amount numeric(12, 2) not null,
  payout_status text check (payout_status in ('accrued', 'approved', 'paid', 'cancelled')) default 'accrued',
  payout_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.agent_commissions enable row level security;
create policy "Agents can view their own commissions" on agent_commissions for select using (auth.uid() = agent_id);
create policy "Admins can view and manage all commissions" on agent_commissions for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- 8. Employee & Team Management
create table if not exists public.employee_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  department text check (department in ('sales', 'support', 'accounts')) not null,
  employee_code text unique not null,
  incentive_rate_pct numeric(5, 2) default 0.50,
  monthly_target numeric(15, 2) default 0.00,
  current_month_sales numeric(15, 2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.employee_profiles enable row level security;
create policy "Admins can manage employee profiles" on employee_profiles for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- 9. Additional Services Inquiries (Home Loans, Interior Works, Insurance, Property Mgmt)
create table if not exists public.service_inquiries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  service_type text check (service_type in (
    'home_loan',
    'interior_works',
    'insurance_home',
    'insurance_auto',
    'insurance_personal',
    'insurance_health',
    'property_management'
  )) not null,
  full_name text not null,
  phone_number text not null,
  email text,
  property_preference text,
  estimated_budget numeric(15, 2),
  notes text,
  status text check (status in ('new', 'in_review', 'assigned', 'contacted', 'closed', 'rejected')) default 'new',
  assigned_to uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.service_inquiries enable row level security;
create policy "Users can view their own service requests" on service_inquiries for select using (auth.uid() = user_id);
create policy "Users can create service requests" on service_inquiries for insert with check (auth.uid() = user_id);
create policy "Admins and assigned employees can view and manage requests" on service_inquiries for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'employee_sales', 'employee_support')
  )
);

-- 10. Notifications Hub
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references public.profiles(id),
  channel text check (channel in ('in_app', 'sms', 'email', 'push', 'broadcast')) default 'in_app',
  title text not null,
  message text not null,
  is_read boolean default false,
  action_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;
create policy "Users can view their own notifications or broadcasts" on notifications for select using (
  auth.uid() = recipient_id or channel = 'broadcast'
);
create policy "Admins can manage all notifications" on notifications for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- 11. Promotional Banners & CMS
create table if not exists public.promotional_banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text,
  image_url text not null,
  target_link text,
  badge_text text,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.promotional_banners enable row level security;
create policy "Promotional banners viewable by all" on promotional_banners for select using (is_active = true);
create policy "Admins can manage banners" on promotional_banners for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
