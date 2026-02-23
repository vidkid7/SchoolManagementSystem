-- Seed Leave Applications Data
-- This script creates sample leave application data for testing

-- Insert leave applications with various statuses and dates
INSERT INTO leave_applications (
    student_id, start_date, end_date, reason, applied_by, applied_at,
    status, approved_by, approved_at, rejection_reason, remarks,
    created_at, updated_at
)
SELECT 
    s.student_id,
    DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 60) - 30 DAY) as start_date,
    DATE_ADD(DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 60) - 30 DAY), INTERVAL FLOOR(RAND() * 4) + 1 DAY) as end_date,
    CASE FLOOR(RAND() * 10)
        WHEN 0 THEN 'Medical appointment with family doctor'
        WHEN 1 THEN 'Family emergency - need to travel to hometown'
        WHEN 2 THEN 'Fever and cold - doctor advised rest'
        WHEN 3 THEN 'Attending family wedding ceremony'
        WHEN 4 THEN 'Religious festival celebration'
        WHEN 5 THEN 'Stomach infection - need bed rest'
        WHEN 6 THEN 'Dental treatment scheduled'
        WHEN 7 THEN 'Participating in district sports competition'
        WHEN 8 THEN 'Grandfather health condition - need to visit'
        ELSE 'Severe headache and body pain'
    END as reason,
    u.user_id as applied_by,
    DATE_SUB(DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 60) - 30 DAY), INTERVAL FLOOR(RAND() * 7) + 1 DAY) as applied_at,
    CASE 
        WHEN RAND() > 0.7 THEN 'pending'
        WHEN RAND() > 0.3 THEN 'approved'
        ELSE 'rejected'
    END as status,
    CASE 
        WHEN RAND() > 0.3 THEN (SELECT user_id FROM users WHERE role IN ('admin', 'teacher') ORDER BY RAND() LIMIT 1)
        ELSE NULL
    END as approved_by,
    CASE 
        WHEN RAND() > 0.3 THEN DATE_ADD(DATE_SUB(DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 60) - 30 DAY), INTERVAL FLOOR(RAND() * 7) + 1 DAY), INTERVAL FLOOR(RAND() * 48) HOUR)
        ELSE NULL
    END as approved_at,
    CASE 
        WHEN RAND() > 0.8 THEN 'Insufficient notice period provided'
        ELSE NULL
    END as rejection_reason,
    CASE FLOOR(RAND() * 3)
        WHEN 0 THEN 'Medical certificate attached'
        WHEN 1 THEN 'Will complete missed assignments'
        ELSE NULL
    END as remarks,
    NOW() as created_at,
    NOW() as updated_at
FROM 
    students s
    CROSS JOIN users u
WHERE 
    u.role IN ('student', 'parent')
    AND s.student_id <= 10
LIMIT 30;

-- Show summary
SELECT 
    status,
    COUNT(*) as count,
    MIN(start_date) as earliest_date,
    MAX(end_date) as latest_date
FROM leave_applications
GROUP BY status;

SELECT 'Leave applications seeded successfully!' as message;
