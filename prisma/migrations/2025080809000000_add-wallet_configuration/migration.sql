-- Add wallet top-up reward configuration
INSERT INTO "configurations" ("key", "value", "description", "category", "isActive", "createdAt", "updatedAt") VALUES
('wallet_topup_reward_enabled', 'true', 'Enable/disable wallet top-up reward feature', 'wallet_rewards', true, NOW(), NOW()),
('wallet_topup_reward_amount', '10', 'Reward amount given on wallet top-up (in BHD)', 'wallet_rewards', true, NOW(), NOW());
