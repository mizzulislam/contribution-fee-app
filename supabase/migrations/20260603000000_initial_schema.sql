-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users_profile
CREATE TABLE users_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- linked to auth.users
    full_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    role TEXT CHECK (role IN ('admin', 'bendahara', 'koordinator', 'penghuni')) NOT NULL DEFAULT 'penghuni',
    room_id UUID, -- Will add foreign key later after rooms is created
    resident_status TEXT CHECK (resident_status IN ('active', 'inactive')) DEFAULT 'active',
    joined_at DATE DEFAULT CURRENT_DATE,
    left_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. rooms
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number TEXT NOT NULL UNIQUE,
    capacity INTEGER DEFAULT 1,
    status TEXT CHECK (status IN ('available', 'occupied', 'inactive')) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add foreign key to users_profile
ALTER TABLE users_profile ADD CONSTRAINT fk_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;

-- 3. contribution_types
CREATE TABLE contribution_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. contributions
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contribution_type_id UUID REFERENCES contribution_types(id),
    title TEXT NOT NULL,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('draft', 'active', 'closed', 'cancelled')) DEFAULT 'draft',
    created_by UUID REFERENCES users_profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. bills
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contribution_id UUID REFERENCES contributions(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    status TEXT CHECK (status IN ('unpaid', 'pending_verification', 'paid', 'rejected', 'cancelled')) DEFAULT 'unpaid',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES users_profile(id),
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    proof_url TEXT,
    note TEXT,
    status TEXT CHECK (status IN ('pending_verification', 'verified', 'rejected')) DEFAULT 'pending_verification',
    verified_by UUID REFERENCES users_profile(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. expense_categories
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_category_id UUID REFERENCES expense_categories(id),
    title TEXT NOT NULL,
    expense_date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    proof_url TEXT,
    paid_by UUID REFERENCES users_profile(id),
    source TEXT CHECK (source IN ('cash', 'advance')) NOT NULL,
    related_gallon_purchase_id UUID, -- Will be linked later
    created_by UUID REFERENCES users_profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. treasurer_advances
CREATE TABLE treasurer_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treasurer_id UUID REFERENCES users_profile(id),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    advance_date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    proof_url TEXT,
    status TEXT CHECK (status IN ('unreimbursed', 'partially_reimbursed', 'reimbursed', 'cancelled')) DEFAULT 'unreimbursed',
    reimbursed_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. advance_reimbursements
CREATE TABLE advance_reimbursements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advance_id UUID REFERENCES treasurer_advances(id) ON DELETE CASCADE,
    reimbursement_date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    note TEXT,
    created_by UUID REFERENCES users_profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. cash_mutations
CREATE TABLE cash_mutations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mutation_date DATE NOT NULL,
    type TEXT CHECK (type IN ('inflow', 'outflow', 'adjustment')) NOT NULL,
    source_table TEXT,
    source_id UUID,
    amount NUMERIC NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users_profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 12. financial_reports
CREATE TABLE financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    total_income NUMERIC DEFAULT 0,
    total_expense NUMERIC DEFAULT 0,
    total_advance NUMERIC DEFAULT 0,
    ending_balance NUMERIC DEFAULT 0,
    generated_by UUID REFERENCES users_profile(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 13. gallon_vendors
CREATE TABLE gallon_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_name TEXT NOT NULL,
    phone_number TEXT,
    address TEXT,
    default_price NUMERIC,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 14. gallon_purchases
CREATE TABLE gallon_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_date DATE NOT NULL,
    vendor_id UUID REFERENCES gallon_vendors(id),
    quantity INTEGER NOT NULL,
    price_per_gallon NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    purchased_by UUID REFERENCES users_profile(id),
    proof_url TEXT,
    payment_source TEXT CHECK (payment_source IN ('cash', 'advance')) NOT NULL,
    expense_id UUID REFERENCES expenses(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE expenses ADD CONSTRAINT fk_gallon_purchase FOREIGN KEY (related_gallon_purchase_id) REFERENCES gallon_purchases(id) ON DELETE SET NULL;

-- 15. gallon_consumption_records
CREATE TABLE gallon_consumption_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallon_purchase_id UUID REFERENCES gallon_purchases(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    quantity_used INTEGER NOT NULL,
    active_resident_count INTEGER,
    daily_average NUMERIC,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 16. gallon_predictions
CREATE TABLE gallon_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    active_resident_count INTEGER NOT NULL,
    average_daily_consumption NUMERIC NOT NULL,
    estimated_needed_quantity NUMERIC NOT NULL,
    estimated_empty_date DATE,
    method TEXT DEFAULT 'moving_average',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 17. duty_schedules
CREATE TABLE duty_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES users_profile(id),
    duty_date DATE NOT NULL,
    duty_type TEXT DEFAULT 'gallon_purchase',
    status TEXT CHECK (status IN ('scheduled', 'completed', 'missed', 'rescheduled', 'cancelled')) DEFAULT 'scheduled',
    note TEXT,
    created_by UUID REFERENCES users_profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 18. duty_confirmations
CREATE TABLE duty_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duty_schedule_id UUID REFERENCES duty_schedules(id) ON DELETE CASCADE,
    confirmed_by UUID REFERENCES users_profile(id),
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT CHECK (status IN ('completed', 'failed', 'rescheduled')) DEFAULT 'completed',
    note TEXT,
    proof_url TEXT
);

-- 19. notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_table TEXT,
    related_id UUID,
    status TEXT CHECK (status IN ('unread', 'read', 'archived')) DEFAULT 'unread',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 20. notification_preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    channel TEXT CHECK (channel IN ('in_app', 'email', 'whatsapp')) DEFAULT 'in_app',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 21. audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_profile(id),
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 22. data_corrections
CREATE TABLE data_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_name TEXT NOT NULL,
    entity_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT CHECK (status IN ('submitted', 'approved', 'rejected', 'completed')) DEFAULT 'submitted',
    submitted_by UUID REFERENCES users_profile(id),
    reviewed_by UUID REFERENCES users_profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Basic Policies (More complex logic should be handled via backend/middleware or advanced RLS)
CREATE POLICY "Users can view their own profile and basic others info" 
ON users_profile FOR SELECT USING (true); -- simplified for MVP

CREATE POLICY "Admins can update profiles" 
ON users_profile FOR ALL USING (
    (SELECT role FROM users_profile WHERE auth_user_id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can update their own non-role fields"
ON users_profile FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Everyone can view rooms"
ON rooms FOR SELECT USING (true);

-- End of schema
