-- Sample data for FAQ Analytics Dashboard
-- This script populates the database with realistic sample data for testing

-- Insert sample FAQ interactions
INSERT INTO faq_interactions (query_text, status, source_file, reasoning, processing_time, session_id, user_feedback, timestamp) VALUES
-- Successful queries
('How do I reset my password?', 'success', 'account_management.txt', 'Found relevant FAQ about password reset procedures', 245.5, 'session_001', 5, NOW() - INTERVAL '1 hour'),
('What payment methods do you accept?', 'success', 'billing_payments.txt', 'Located payment methods information', 189.2, 'session_002', 4, NOW() - INTERVAL '2 hours'),
('How to upload files to my account?', 'success', 'file_management.txt', 'Found file upload instructions', 156.8, 'session_003', 5, NOW() - INTERVAL '3 hours'),
('Is there a mobile app available?', 'success', 'mobile_app.txt', 'Mobile app information provided', 203.1, 'session_004', 4, NOW() - INTERVAL '4 hours'),
('How do I contact customer support?', 'success', 'customer_support.txt', 'Support contact information found', 134.6, 'session_005', 5, NOW() - INTERVAL '5 hours'),
('Can I share files with team members?', 'success', 'team_collaboration.txt', 'Team sharing features explained', 278.3, 'session_006', 4, NOW() - INTERVAL '6 hours'),
('What are the subscription plans?', 'success', 'subscription_plans.txt', 'Subscription plan details provided', 167.9, 'session_007', 5, NOW() - INTERVAL '7 hours'),
('How secure is my data?', 'success', 'privacy_security.txt', 'Security measures explained', 298.7, 'session_008', 4, NOW() - INTERVAL '8 hours'),
('API integration documentation?', 'success', 'integrations_api.txt', 'API documentation link provided', 223.4, 'session_009', 3, NOW() - INTERVAL '9 hours'),
('App crashes on startup', 'success', 'technical_issues.txt', 'Troubleshooting steps provided', 345.2, 'session_010', 4, NOW() - INTERVAL '10 hours'),

-- More queries from today
('How to change my email address?', 'success', 'account_management.txt', 'Email change procedure found', 198.5, 'session_011', 5, NOW() - INTERVAL '30 minutes'),
('Billing cycle questions', 'success', 'billing_payments.txt', 'Billing cycle information provided', 176.3, 'session_012', 4, NOW() - INTERVAL '45 minutes'),
('File size limits?', 'success', 'file_management.txt', 'File size limit information found', 142.1, 'session_013', 4, NOW() - INTERVAL '1.5 hours'),
('Download mobile app', 'success', 'mobile_app.txt', 'App download links provided', 134.8, 'session_014', 5, NOW() - INTERVAL '2.5 hours'),

-- Some failed queries (no answers found)
('How to integrate with Slack?', 'no_answer', NULL, 'No specific Slack integration information found', 567.8, 'session_015', 2, NOW() - INTERVAL '20 minutes'),
('Custom domain setup', 'no_answer', NULL, 'Custom domain information not available', 445.6, 'session_016', 1, NOW() - INTERVAL '40 minutes'),
('Bulk data import feature', 'no_answer', NULL, 'Bulk import feature not documented', 389.2, 'session_017', 2, NOW() - INTERVAL '1.2 hours'),
('White-label solution', 'no_answer', NULL, 'White-label options not found in FAQ', 423.7, 'session_018', 1, NOW() - INTERVAL '3.5 hours'),

-- Error cases
('', 'error', NULL, 'Empty query provided', 45.2, 'session_019', 1, NOW() - INTERVAL '15 minutes'),
('???', 'error', NULL, 'Invalid query format', 67.8, 'session_020', 1, NOW() - INTERVAL '25 minutes'),

-- Yesterday's data
('Password reset not working', 'success', 'account_management.txt', 'Alternative password reset methods provided', 334.5, 'session_021', 3, NOW() - INTERVAL '1 day 2 hours'),
('Payment failed', 'success', 'billing_payments.txt', 'Payment troubleshooting steps provided', 267.9, 'session_022', 4, NOW() - INTERVAL '1 day 4 hours'),
('Cannot upload large files', 'success', 'file_management.txt', 'Large file upload solutions provided', 456.3, 'session_023', 4, NOW() - INTERVAL '1 day 6 hours'),
('Mobile app login issues', 'success', 'mobile_app.txt', 'Mobile login troubleshooting provided', 378.1, 'session_024', 3, NOW() - INTERVAL '1 day 8 hours'),
('Team invitation not received', 'success', 'team_collaboration.txt', 'Team invitation troubleshooting provided', 289.6, 'session_025', 4, NOW() - INTERVAL '1 day 10 hours'),

-- Last week's data
('Upgrade subscription plan', 'success', 'subscription_plans.txt', 'Upgrade process explained', 234.7, 'session_026', 5, NOW() - INTERVAL '3 days'),
('Data export options', 'success', 'file_management.txt', 'Data export methods explained', 198.3, 'session_027', 4, NOW() - INTERVAL '4 days'),
('Privacy policy details', 'success', 'privacy_security.txt', 'Privacy policy information provided', 167.8, 'session_028', 4, NOW() - INTERVAL '5 days'),
('API rate limits', 'success', 'integrations_api.txt', 'API rate limit information provided', 234.5, 'session_029', 3, NOW() - INTERVAL '6 days'),
('Account deletion process', 'success', 'account_management.txt', 'Account deletion steps provided', 345.6, 'session_030', 4, NOW() - INTERVAL '7 days'),

-- Popular queries (multiple times)
('How do I reset my password?', 'success', 'account_management.txt', 'Found relevant FAQ about password reset procedures', 198.7, 'session_031', 5, NOW() - INTERVAL '2 days'),
('How do I reset my password?', 'success', 'account_management.txt', 'Found relevant FAQ about password reset procedures', 234.2, 'session_032', 4, NOW() - INTERVAL '3 days'),
('What payment methods do you accept?', 'success', 'billing_payments.txt', 'Located payment methods information', 167.3, 'session_033', 5, NOW() - INTERVAL '2 days'),
('What payment methods do you accept?', 'success', 'billing_payments.txt', 'Located payment methods information', 189.8, 'session_034', 4, NOW() - INTERVAL '4 days'),
('How to upload files to my account?', 'success', 'file_management.txt', 'Found file upload instructions', 145.6, 'session_035', 5, NOW() - INTERVAL '3 days');

-- Insert system performance metrics
INSERT INTO system_metrics (metric_name, metric_value, metric_unit, timestamp) VALUES
-- Response time metrics
('avg_response_time', 234.5, 'ms', NOW() - INTERVAL '1 hour'),
('avg_response_time', 198.7, 'ms', NOW() - INTERVAL '2 hours'),
('avg_response_time', 267.3, 'ms', NOW() - INTERVAL '3 hours'),
('avg_response_time', 189.2, 'ms', NOW() - INTERVAL '4 hours'),
('avg_response_time', 245.8, 'ms', NOW() - INTERVAL '5 hours'),

-- Database performance
('db_connection_time', 45.2, 'ms', NOW() - INTERVAL '1 hour'),
('db_query_time', 23.7, 'ms', NOW() - INTERVAL '1 hour'),
('memory_usage', 67.8, 'percent', NOW() - INTERVAL '1 hour'),
('cpu_usage', 34.5, 'percent', NOW() - INTERVAL '1 hour'),

-- Daily metrics
('total_queries', 156, 'count', NOW() - INTERVAL '1 day'),
('successful_queries', 142, 'count', NOW() - INTERVAL '1 day'),
('failed_queries', 14, 'count', NOW() - INTERVAL '1 day'),

-- Weekly metrics
('total_queries', 987, 'count', NOW() - INTERVAL '1 week'),
('successful_queries', 856, 'count', NOW() - INTERVAL '1 week'),
('failed_queries', 131, 'count', NOW() - INTERVAL '1 week');

-- Update FAQ file statistics
INSERT INTO faq_file_stats (file_name, total_queries, successful_queries, success_rate, last_updated) VALUES
('account_management.txt', 145, 138, 95.17, NOW()),
('billing_payments.txt', 123, 119, 96.75, NOW()),
('file_management.txt', 98, 94, 95.92, NOW()),
('mobile_app.txt', 87, 83, 95.40, NOW()),
('customer_support.txt', 76, 74, 97.37, NOW()),
('team_collaboration.txt', 65, 62, 95.38, NOW()),
('subscription_plans.txt', 54, 52, 96.30, NOW()),
('privacy_security.txt', 43, 41, 95.35, NOW()),
('integrations_api.txt', 32, 29, 90.63, NOW()),
('technical_issues.txt', 28, 25, 89.29, NOW())
ON CONFLICT (file_name) DO UPDATE SET
  total_queries = EXCLUDED.total_queries,
  successful_queries = EXCLUDED.successful_queries,
  success_rate = EXCLUDED.success_rate,
  last_updated = EXCLUDED.last_updated;
