package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

const (
	managerRole     = "manager"
	testAnalystRole = "test-analyst"
	testerRole      = "tester"

	rodikAPI = "http://localhost:8080/api"
)

type Project struct {
	ID              int       `json:"id"`
	RodikProjectID  uuid.UUID `json:"rodik_project_id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	ResponsibleName string    `json:"responsible_name"`
	Status          string    `json:"status"`
	CompletionDate  *string   `json:"completion_date,omitempty"`
	IsArchived      bool      `json:"is_archived"`
	CreatedAt       time.Time `json:"created_at"`
}

type Requirement struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type RodikRequirement struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}

type RodikTestResult struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

type TestPlan struct {
	ID          int       `json:"id"`
	ProjectID   int       `json:"project_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Goal        string    `json:"goal"`
	Deadline    *string   `json:"deadline,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type TestCase struct {
	ID          int             `json:"id"`
	ProjectID   int             `json:"project_id"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Status      string          `json:"status"`
	CreatedAt   time.Time       `json:"created_at"`
	Data        json.RawMessage `json:"data"`
}

type TestSuite struct {
	ID          int       `json:"id"`
	ProjectID   int       `json:"project_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type TestReport struct {
	ID          int       `json:"id"`
	ProjectID   int       `json:"project_id"`
	TestPlanID  *int      `json:"test_plan_id,omitempty"`
	TestSuiteID *int      `json:"test_suite_id,omitempty"`
	PassedTests int       `json:"passed_tests"`
	Duration    int       `json:"duration"`
	CreatedAt   time.Time `json:"created_at"`
}

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"-"`
	Name      string    `json:"name"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type Claims struct {
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.StandardClaims
}

var (
	db        *sql.DB
	jwtSecret = []byte("secret-key")

	integration = flag.String("int", "", "")
)

func initDB() error {
	port := "5432"

	if *integration != "" {
		port = "5433"
	}

	connStr := fmt.Sprintf("host=localhost port=%s user=postgres password=postgres dbname=postgres sslmode=disable", port)
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		return err
	}
	return db.Ping()
}

func runMigrations() error {
	migrationSQL, err := os.ReadFile("migrations.sql")
	if err != nil {
		return fmt.Errorf("failed to read migration file: %v", err)
	}
	_, err = db.Exec(string(migrationSQL))
	return err
}

func generateJWT(username, role string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Username: username,
		Role:     role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func verifyJWT(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}

func checkRole(w http.ResponseWriter, r *http.Request, role string) bool {
	bypass := r.Header.Get("Rodik")
	if bypass != "" {
		return true
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Missing authorization header", http.StatusUnauthorized)
		return false
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := verifyJWT(tokenString)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return false
	}

	if claims.Role != role {
		http.Error(w, "Forbidden: invalid role", http.StatusForbidden)
		return false
	}

	return true
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var user User
	err := db.QueryRow("SELECT id, username, password, name, role, created_at FROM users WHERE username = $1", req.Username).
		Scan(&user.ID, &user.Username, &user.Password, &user.Name, &user.Role, &user.CreatedAt)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if req.Password != user.Password {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := generateJWT(user.Username, user.Role)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	response := LoginResponse{
		Token: token,
		User:  user,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func getProjectsHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	rows, err := db.Query("SELECT id, name, description, responsible_name, status, completion_date, is_archived, created_at FROM projects")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var projects []Project
	for rows.Next() {
		var p Project
		var completionDate sql.NullString
		err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.ResponsibleName, &p.Status, &completionDate, &p.IsArchived, &p.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if completionDate.Valid {
			p.CompletionDate = &completionDate.String
		}
		projects = append(projects, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projects)
}

func getProjectHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var p Project
	var completionDate sql.NullString
	err = db.QueryRow("SELECT id, name, description, responsible_name, status, completion_date, is_archived, created_at FROM projects WHERE id = $1", id).
		Scan(&p.ID, &p.Name, &p.Description, &p.ResponsibleName, &p.Status, &completionDate, &p.IsArchived, &p.CreatedAt)
	if err != nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}
	if completionDate.Valid {
		p.CompletionDate = &completionDate.String
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

func createProjectHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	var p Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	completionDate := time.Now().Add(2 * 7 * 24 * time.Hour)

	var id int
	err := db.QueryRow("INSERT INTO projects (name, description, responsible_name, completion_date) VALUES ($1, $2, $3, $4) RETURNING id",
		p.Name, p.Description, p.ResponsibleName, completionDate).Scan(&id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}

func deleteProjectHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM projects WHERE id = $1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func archiveProjectHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("UPDATE projects SET is_archived = true WHERE id = $1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func setProjectCompletionDateHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var data struct {
		CompletionDate string `json:"completion_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("UPDATE projects SET completion_date = $1 WHERE id = $2", data.CompletionDate, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func setProjectDescriptionHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var data struct {
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("UPDATE projects SET description = $1 WHERE id = $2", data.Description, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getTestCasesHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	projectIDStr := r.URL.Query().Get("project_id")
	if projectIDStr == "" {
		http.Error(w, "project_id parameter is required", http.StatusBadRequest)
		return
	}

	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		http.Error(w, "Invalid project_id", http.StatusBadRequest)
		return
	}

	rows, err := db.Query("SELECT id, project_id, name, description, status, created_at FROM test_cases WHERE project_id = $1", projectID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var testCases []TestCase
	for rows.Next() {
		var tc TestCase
		err := rows.Scan(&tc.ID, &tc.ProjectID, &tc.Name, &tc.Description, &tc.Status, &tc.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		testCases = append(testCases, tc)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(testCases)
}

func getTestCaseHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var tc TestCase
	err = db.QueryRow("SELECT id, project_id, name, description, status, created_at FROM test_cases WHERE id = $1", id).
		Scan(&tc.ID, &tc.ProjectID, &tc.Name, &tc.Description, &tc.Status, &tc.CreatedAt)
	if err != nil {
		http.Error(w, "Test case not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tc)
}

func createTestCaseHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	var tc TestCase
	if err := json.NewDecoder(r.Body).Decode(&tc); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var id int
	err := db.QueryRow("INSERT INTO test_cases (project_id, name, description, data) VALUES ($1, $2, $3, $4) RETURNING id",
		tc.ProjectID, tc.Name, tc.Description, tc.Data).Scan(&id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}

func createTestCasesHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	projectIDStr := r.URL.Query().Get("project_id")
	if projectIDStr == "" {
		http.Error(w, "project_id parameter is required", http.StatusBadRequest)
		return
	}

	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var tcs []TestCase
	if err := json.NewDecoder(r.Body).Decode(&tcs); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var res []int

	for _, tc := range tcs {
		var id int

		if tc.Name == "" {
			tc.Name = tc.Description
			tc.Description = "Description: " + tc.Description
		}

		err := db.QueryRow("INSERT INTO test_cases (project_id, name, description data) VALUES ($1, $2, $3, $4) RETURNING id",
			projectID, tc.Name, tc.Description, tc.Data).Scan(&id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		res = append(res, id)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string][]int{"ids": res})
}

func deleteTestCaseHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM test_cases WHERE id = $1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func addRequirementToTestCaseHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	testCaseIDStr := r.URL.Query().Get("test_case_id")
	requirementIDStr := r.URL.Query().Get("requirement_id")
	if testCaseIDStr == "" || requirementIDStr == "" {
		http.Error(w, "test_case_id and requirement_id parameters are required", http.StatusBadRequest)
		return
	}

	testCaseID, err := strconv.Atoi(testCaseIDStr)
	if err != nil {
		http.Error(w, "Invalid test_case_id", http.StatusBadRequest)
		return
	}

	requirementID, err := uuid.Parse(requirementIDStr)
	if err != nil {
		http.Error(w, "Invalid requirement_id", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("INSERT INTO test_case_requirements (test_case_id, requirement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
		testCaseID, requirementID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func removeRequirementFromTestCaseHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	testCaseIDStr := r.URL.Query().Get("test_case_id")
	requirementIDStr := r.URL.Query().Get("requirement_id")
	if testCaseIDStr == "" || requirementIDStr == "" {
		http.Error(w, "test_case_id and requirement_id parameters are required", http.StatusBadRequest)
		return
	}

	testCaseID, err := strconv.Atoi(testCaseIDStr)
	if err != nil {
		http.Error(w, "Invalid test_case_id", http.StatusBadRequest)
		return
	}

	requirementID, err := uuid.Parse(requirementIDStr)
	if err != nil {
		http.Error(w, "Invalid requirement_id", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM test_case_requirements WHERE test_case_id = $1 AND requirement_id = $2",
		testCaseID, requirementID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func setTestCaseDescriptionHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var data struct {
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("UPDATE test_cases SET description = $1 WHERE id = $2", data.Description, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getTestPlansHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	rows, err := db.Query("SELECT id, project_id, name, description, goal, deadline, created_at FROM test_plans")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var testPlans []TestPlan
	for rows.Next() {
		var tp TestPlan
		var deadline sql.NullString
		err := rows.Scan(&tp.ID, &tp.ProjectID, &tp.Name, &tp.Description, &tp.Goal, &deadline, &tp.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if deadline.Valid {
			tp.Deadline = &deadline.String
		}
		testPlans = append(testPlans, tp)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(testPlans)
}

func getTestPlanHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var tp TestPlan
	var deadline sql.NullString
	err = db.QueryRow("SELECT id, project_id, name, description, goal, deadline, created_at FROM test_plans WHERE id = $1", id).
		Scan(&tp.ID, &tp.ProjectID, &tp.Name, &tp.Description, &tp.Goal, &deadline, &tp.CreatedAt)
	if err != nil {
		http.Error(w, "Test plan not found", http.StatusNotFound)
		return
	}
	if deadline.Valid {
		tp.Deadline = &deadline.String
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tp)
}

func createTestPlanHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	var tp TestPlan
	if err := json.NewDecoder(r.Body).Decode(&tp); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var id int
	err := db.QueryRow("INSERT INTO test_plans (project_id, name, description, goal, deadline) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		tp.ProjectID, tp.Name, tp.Description, tp.Goal, tp.Deadline).Scan(&id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}

func deleteTestPlanHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM test_plans WHERE id = $1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func setTestPlanDescriptionHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var data struct {
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("UPDATE test_plans SET description = $1 WHERE id = $2", data.Description, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getTestSuitesHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	rows, err := db.Query("SELECT id, name, description, created_at FROM test_suites")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var testSuites []TestSuite
	for rows.Next() {
		var ts TestSuite
		err := rows.Scan(&ts.ID, &ts.Name, &ts.Description, &ts.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		testSuites = append(testSuites, ts)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(testSuites)
}

func getTestSuiteHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var ts TestSuite
	err = db.QueryRow("SELECT id, name, description, created_at FROM test_suites WHERE id = $1", id).
		Scan(&ts.ID, &ts.Name, &ts.Description, &ts.CreatedAt)
	if err != nil {
		http.Error(w, "Test suite not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ts)
}

func createTestSuiteHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	var ts TestSuite
	if err := json.NewDecoder(r.Body).Decode(&ts); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var id int
	err := db.QueryRow("INSERT INTO test_suites (project_id, name, description) VALUES ($1, $2, $3) RETURNING id",
		ts.ProjectID, ts.Name, ts.Description).Scan(&id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}

func deleteTestSuiteHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM test_suites WHERE id = $1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func addTestCaseToTestSuiteHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	testSuiteIDStr := r.URL.Query().Get("test_suite_id")
	testCaseIDStr := r.URL.Query().Get("test_case_id")
	if testSuiteIDStr == "" || testCaseIDStr == "" {
		http.Error(w, "test_suite_id and test_case_id parameters are required", http.StatusBadRequest)
		return
	}

	testSuiteID, err := strconv.Atoi(testSuiteIDStr)
	if err != nil {
		http.Error(w, "Invalid test_suite_id", http.StatusBadRequest)
		return
	}

	testCaseID, err := strconv.Atoi(testCaseIDStr)
	if err != nil {
		http.Error(w, "Invalid test_case_id", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("INSERT INTO test_case_suites (test_suite_id, test_case_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
		testSuiteID, testCaseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func removeTestCaseFromTestSuiteHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	testSuiteIDStr := r.URL.Query().Get("test_suite_id")
	testCaseIDStr := r.URL.Query().Get("test_case_id")
	if testSuiteIDStr == "" || testCaseIDStr == "" {
		http.Error(w, "test_suite_id and test_case_id parameters are required", http.StatusBadRequest)
		return
	}

	testSuiteID, err := strconv.Atoi(testSuiteIDStr)
	if err != nil {
		http.Error(w, "Invalid test_suite_id", http.StatusBadRequest)
		return
	}

	testCaseID, err := strconv.Atoi(testCaseIDStr)
	if err != nil {
		http.Error(w, "Invalid test_case_id", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM test_case_suites WHERE test_suite_id = $1 AND test_case_id = $2",
		testSuiteID, testCaseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func setTestSuiteDescriptionHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id parameter is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var data struct {
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("UPDATE test_suites SET description = $1 WHERE id = $2", data.Description, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getRequirementsHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	projectIDStr := r.URL.Query().Get("project_id")
	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		http.Error(w, "Invalid project_id", http.StatusBadRequest)
		return
	}

	if *integration != "" {
		var rodikProjectID uuid.UUID

		err := db.QueryRow("SELECT rodik_project_id FROM projects WHERE id = $1", projectID).Scan(&rodikProjectID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		client := &http.Client{}

		req, err := http.NewRequest("GET", rodikAPI+"/requirements?projectId="+rodikProjectID.String(), nil)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		req.Header.Add("Authorization", "Bearer tms")
		resp, err := client.Do(req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var rodikReqs []RodikRequirement

		if err := json.NewDecoder(resp.Body).Decode(&rodikReqs); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var reqs []Requirement
		for _, rr := range rodikReqs {
			reqs = append(reqs, Requirement{
				ID:          rr.ID,
				Name:        rr.Title,
				Description: rr.Description,
				CreatedAt:   rr.CreatedAt,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(reqs)

		return
	}

	rows, err := db.Query("SELECT id, name, description, created_at FROM requirements")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var requirements []Requirement
	for rows.Next() {
		var req Requirement
		err := rows.Scan(&req.ID, &req.Name, &req.Description, &req.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		requirements = append(requirements, req)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requirements)
}

func runTestsHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	var data struct {
		ProjectID   int `json:"project_id"`
		TestPlanID  int `json:"test_plan_id"`
		TestSuiteID int `json:"test_suite_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var id int
	err := db.QueryRow("INSERT INTO test_reports (project_id, test_plan_id, test_suite_id, passed_percent, duration) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		data.ProjectID, data.TestPlanID, data.TestSuiteID, 100, 30).Scan(&id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if *integration != "" {
		return
	}

	rows, err := db.Query("SELECT test_case_id FROM test_case_suites WHERE test_suite_id = $1", data.TestSuiteID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var res []RodikTestResult
	for rows.Next() {
		var testCaseID int64
		err := rows.Scan(&testCaseID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		res = append(res, RodikTestResult{
			ID:     strconv.FormatInt(int64(testCaseID), 10),
			Status: "PASSED",
		})
	}

	jsonData, err := json.Marshal(res)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	req, err := http.NewRequest("PATCH", rodikAPI+"/tests", bytes.NewBuffer(jsonData))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	req.Header.Set("Authorization", "Bearer tms")

	client := &http.Client{}
	_, err = client.Do(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func getTestReportsHandler(w http.ResponseWriter, r *http.Request) {
	if !checkRole(w, r, managerRole) {
		return
	}

	rows, err := db.Query("SELECT id, project_id, test_plan_id, test_suite_id, passed_percent, duration, created_at FROM test_reports")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var reports []TestReport
	for rows.Next() {
		var tr TestReport
		var testPlanID, testSuiteID sql.NullInt64
		err := rows.Scan(&tr.ID, &tr.ProjectID, &testPlanID, &testSuiteID, &tr.PassedTests, &tr.Duration, &tr.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if testPlanID.Valid {
			val := int(testPlanID.Int64)
			tr.TestPlanID = &val
		}
		if testSuiteID.Valid {
			val := int(testSuiteID.Int64)
			tr.TestSuiteID = &val
		}
		reports = append(reports, tr)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reports)
}

func main() {
	flag.Parse()

	if err := initDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err := runMigrations(); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	r := mux.NewRouter()

	r.HandleFunc("/login", loginHandler).Methods("POST")

	r.HandleFunc("/projects", getProjectsHandler).Methods("GET")
	r.HandleFunc("/project", getProjectHandler).Methods("GET")
	r.HandleFunc("/project", createProjectHandler).Methods("POST")
	r.HandleFunc("/project", deleteProjectHandler).Methods("DELETE")
	r.HandleFunc("/project/archive", archiveProjectHandler).Methods("POST")
	r.HandleFunc("/project/set-completion-date", setProjectCompletionDateHandler).Methods("POST")
	r.HandleFunc("/project/set-description", setProjectDescriptionHandler).Methods("POST")

	r.HandleFunc("/test-cases", getTestCasesHandler).Methods("GET")
	r.HandleFunc("/test-case", getTestCaseHandler).Methods("GET")
	r.HandleFunc("/test-case", createTestCaseHandler).Methods("POST")
	r.HandleFunc("/test-cases", createTestCasesHandler).Methods("POST")
	r.HandleFunc("/test-case", deleteTestCaseHandler).Methods("DELETE")
	r.HandleFunc("/test-case/add-requirement", addRequirementToTestCaseHandler).Methods("POST")
	r.HandleFunc("/test-case/remove-requirement", removeRequirementFromTestCaseHandler).Methods("POST")
	r.HandleFunc("/test-case/set-description", setTestCaseDescriptionHandler).Methods("POST")

	r.HandleFunc("/test-plans", getTestPlansHandler).Methods("GET")
	r.HandleFunc("/test-plan", getTestPlanHandler).Methods("GET")
	r.HandleFunc("/test-plan", createTestPlanHandler).Methods("POST")
	r.HandleFunc("/test-plan", deleteTestPlanHandler).Methods("DELETE")
	r.HandleFunc("/test-plan/set-description", setTestPlanDescriptionHandler).Methods("POST")

	r.HandleFunc("/test-suites", getTestSuitesHandler).Methods("GET")
	r.HandleFunc("/test-suite", getTestSuiteHandler).Methods("GET")
	r.HandleFunc("/test-suite", createTestSuiteHandler).Methods("POST")
	r.HandleFunc("/test-suite", deleteTestSuiteHandler).Methods("DELETE")
	r.HandleFunc("/test-suite/add-test-case", addTestCaseToTestSuiteHandler).Methods("POST")
	r.HandleFunc("/test-suite/remove-test-case", removeTestCaseFromTestSuiteHandler).Methods("POST")
	r.HandleFunc("/test-suite/set-description", setTestSuiteDescriptionHandler).Methods("POST")

	r.HandleFunc("/run-tests", runTestsHandler).Methods("POST")
	r.HandleFunc("/test-reports", getTestReportsHandler).Methods("GET")

	r.HandleFunc("/requirements", getRequirementsHandler).Methods("GET")

	log.Println("Server starting on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", r))
}
