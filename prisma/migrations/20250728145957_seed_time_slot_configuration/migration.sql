-- Seed time slot configuration data
INSERT INTO "configurations" ("key", "value", "description", "category", "isActive", "createdAt", "updatedAt") VALUES
('time_slot_duration', '3', 'Duration of each time slot in hours', 'time_slots', true, NOW(), NOW()),
('business_start_time', '09:00', 'Business start time for time slots', 'time_slots', true, NOW(), NOW()),
('business_end_time', '21:00', 'Business end time for time slots', 'time_slots', true, NOW(), NOW()); 