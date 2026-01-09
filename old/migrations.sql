CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('manager', 'test-analyst', 'tester'))
);

CREATE TABLE IF NOT EXISTS projects  (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    json_data JSONB
);

CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    json_data JSONB,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requirement_id VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_entities_project_id ON entities(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_entity_id ON test_cases(entity_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_requirement_id ON test_cases(requirement_id);

CREATE INDEX IF NOT EXISTS idx_entities_json_data ON entities USING GIN (json_data);
CREATE INDEX IF NOT EXISTS idx_test_cases_json_data ON test_cases USING GIN (json_data);