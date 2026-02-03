BEGIN;

-- Create Enums
DO $$ BEGIN
    CREATE TYPE worker_status AS ENUM ('active', 'inactive', 'on_leave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'completed', 'on_hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_status AS ENUM ('available', 'in_use', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Workers Table
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    status worker_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    status project_status DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    license_plate TEXT UNIQUE,
    status asset_status DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    serial_number TEXT UNIQUE,
    status asset_status DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Allocations Table
CREATE TABLE IF NOT EXISTS resource_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT at_least_one_resource CHECK (
        (worker_id IS NOT NULL) OR 
        (vehicle_id IS NOT NULL) OR 
        (equipment_id IS NOT NULL)
    )
);

-- Enable RLS on all tables
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;

-- Create basic policies (Allow all for now as we are in development)
CREATE POLICY "Allow all access to workers" ON workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to equipment" ON equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to resource_allocations" ON resource_allocations FOR ALL USING (true) WITH CHECK (true);

COMMIT;