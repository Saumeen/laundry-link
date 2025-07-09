-- Initialize database tables for laundry service

-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'driver', 'admin'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'pickup_assigned', 'picked_up', 'processing', 'delivery_assigned', 'out_for_delivery', 'delivered', 'cancelled'
  pickup_date DATE NOT NULL,
  pickup_time_slot TEXT NOT NULL, -- e.g., '09:00-12:00'
  delivery_date DATE NOT NULL,
  delivery_time_slot TEXT NOT NULL, -- e.g., '13:00-16:00'
  pickup_address TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  pickup_state TEXT NOT NULL,
  pickup_zip_code TEXT NOT NULL,
  special_instructions TEXT,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order Items table
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  service_type TEXT NOT NULL, -- 'wash_fold', 'dry_clean', 'ironing', etc.
  item_description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_item DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Drivers table
CREATE TABLE drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  vehicle_type TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  current_status TEXT NOT NULL DEFAULT 'available', -- 'available', 'on_pickup', 'on_delivery', 'offline'
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  last_location_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Driver Assignments table
CREATE TABLE driver_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  assignment_type TEXT NOT NULL, -- 'pickup', 'delivery'
  status TEXT NOT NULL DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed'
  estimated_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- Order Status History table
CREATE TABLE order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  updated_by INTEGER NOT NULL, -- user_id of admin or system
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Services table
CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL, -- 'per_lb', 'per_item', 'per_service'
  estimated_turnaround TEXT NOT NULL, -- e.g., '24 hours', '48 hours'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time Slots table
CREATE TABLE time_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time TEXT NOT NULL, -- e.g., '09:00'
  end_time TEXT NOT NULL, -- e.g., '12:00'
  slot_type TEXT NOT NULL, -- 'pickup', 'delivery', 'both'
  max_orders INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for services
INSERT INTO services (name, description, price, unit, estimated_turnaround)
VALUES 
  ('Wash & Fold', 'Regular laundry service with washing, drying, and folding', 2.50, 'per_lb', '24 hours'),
  ('Dry Cleaning', 'Professional dry cleaning for delicate garments', 6.00, 'per_item', '48 hours'),
  ('Ironing', 'Professional ironing service', 3.00, 'per_item', '24 hours'),
  ('Express Service', 'Same-day turnaround for urgent needs', 4.00, 'per_lb', '8 hours');

-- Insert sample time slots
INSERT INTO time_slots (start_time, end_time, slot_type, max_orders)
VALUES 
  ('09:00', '12:00', 'both', 10),
  ('12:00', '15:00', 'both', 10),
  ('15:00', '18:00', 'both', 10),
  ('18:00', '21:00', 'pickup', 5);

-- Insert sample admin user
INSERT INTO users (email, password_hash, first_name, last_name, phone, address, city, state, zip_code, role)
VALUES 
  ('admin@laundryservice.com', '$2a$12$1234567890123456789012', 'Admin', 'User', '555-123-4567', '123 Admin St', 'Laundry City', 'LS', '12345', 'admin');
