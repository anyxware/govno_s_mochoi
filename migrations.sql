CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    rodik_project_id UUID,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    responsible_name VARCHAR(200) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    completion_date DATE,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requirements (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_plans (
    id SERIAL PRIMARY KEY,
    project_id INTEGER,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    goal TEXT,
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_cases (
    id SERIAL PRIMARY KEY,
    project_id INTEGER,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'not_run',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB
);

CREATE TABLE IF NOT EXISTS test_case_requirements (
    test_case_id INTEGER,
    requirement_id UUID,
    PRIMARY KEY (test_case_id, requirement_id)
);

CREATE TABLE IF NOT EXISTS test_suites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    project_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_case_suites (
    test_case_id INTEGER,
    test_suite_id INTEGER,
    PRIMARY KEY (test_case_id, test_suite_id)
);

CREATE TABLE IF NOT EXISTS test_reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    test_plan_id INTEGER REFERENCES test_plans(id) ON DELETE SET NULL,
    test_suite_id INTEGER REFERENCES test_suites(id) ON DELETE SET NULL,
    passed_percent INTEGER DEFAULT 0,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, name, role) 
SELECT 'admin', 'admin123', 'Admin User', 'manager'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');