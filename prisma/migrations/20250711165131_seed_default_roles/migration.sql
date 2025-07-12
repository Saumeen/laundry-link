-- Seed default roles
INSERT INTO "roles" ("name", "description", "permissions", "createdAt", "updatedAt") VALUES
('SUPER_ADMIN', 'Full system access with all permissions', ARRAY[
  'orders:read', 'orders:write', 'orders:delete',
  'customers:read', 'customers:write', 'customers:delete',
  'staff:read', 'staff:write', 'staff:delete',
  'reports:read', 'reports:write',
  'settings:read', 'settings:write',
  'roles:read', 'roles:write', 'roles:delete'
], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('OPERATION_MANAGER', 'Manages operations, orders, and staff', ARRAY[
  'orders:read', 'orders:write',
  'customers:read', 'customers:write',
  'staff:read', 'staff:write',
  'reports:read', 'reports:write',
  'settings:read'
], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('DRIVER', 'Handles pickup and delivery operations', ARRAY[
  'orders:read',
  'driver_assignments:read', 'driver_assignments:write',
  'customers:read'
], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('FACILITY_TEAM', 'Handles laundry processing and facility operations', ARRAY[
  'orders:read', 'orders:write',
  'facility_operations:read', 'facility_operations:write'
], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert default super admin user (password: admin123)
INSERT INTO "staff" ("email", "firstName", "lastName", "password", "roleId", "isActive", "createdAt", "updatedAt") VALUES
('admin@laundrylink.com', 'Super', 'Admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8O', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 