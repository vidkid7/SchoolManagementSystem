-- Manual SQL to link student1 user to student record
-- Run this if the PowerShell script doesn't work

-- First, check if user exists
SELECT user_id, username, email, role FROM users WHERE username = 'student1';

-- Get the user_id from above query (should be 10128)
-- Then check if student record already exists
SELECT * FROM students WHERE user_id = 10128;

-- If no student record exists, create one
-- First, get a class and section ID
SELECT class_id, class_name FROM classes LIMIT 1;
SELECT section_id, section_name FROM sections LIMIT 1;

-- Create student record (replace class_id and section_id with actual values from above)
INSERT INTO students (
    user_id,
    first_name,
    last_name,
    date_of_birth,
    gender,
    class_id,
    section_id,
    roll_number,
    admission_number,
    admission_date,
    student_code,
    blood_group,
    address,
    guardian_name,
    guardian_phone,
    guardian_email,
    guardian_relation,
    status,
    created_at,
    updated_at
) VALUES (
    10128,                          -- user_id from student1 user
    'Test',                         -- first_name
    'Student',                      -- last_name
    '2010-01-01',                   -- date_of_birth
    'male',                         -- gender
    1,                              -- class_id (replace with actual)
    1,                              -- section_id (replace with actual)
    1,                              -- roll_number
    'ADM2024001',                   -- admission_number
    NOW(),                          -- admission_date
    'STU001',                       -- student_code
    'O+',                           -- blood_group
    'Kathmandu, Nepal',             -- address
    'Parent Name',                  -- guardian_name
    '+977-9841234567',              -- guardian_phone
    'parent@example.com',           -- guardian_email
    'father',                       -- guardian_relation
    'active',                       -- status
    NOW(),                          -- created_at
    NOW()                           -- updated_at
);

-- Verify the student was created
SELECT 
    s.student_id,
    s.user_id,
    s.first_name,
    s.last_name,
    u.username,
    c.class_name,
    sec.section_name
FROM students s
JOIN users u ON s.user_id = u.user_id
LEFT JOIN classes c ON s.class_id = c.class_id
LEFT JOIN sections sec ON s.section_id = sec.section_id
WHERE u.username = 'student1';
