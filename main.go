package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/julienschmidt/httprouter"
	"github.com/lib/pq"
)

type Project struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
}

type Entity struct {
	ID          uuid.UUID       `json:"id"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	ProjectID   uuid.UUID       `json:"project_id"`
	JSONData    json.RawMessage `json:"json_data"`
}

type TestCase struct {
	ID            uuid.UUID       `json:"id"`
	Name          string          `json:"name"`
	Description   string          `json:"description"`
	JSONData      json.RawMessage `json:"json_data"`
	EntityID      uuid.UUID       `json:"entity_id"`
	ProjectID     uuid.UUID       `json:"project_id"`
	RequirementID string          `json:"requirement_id"`
}

type TestCaseRunRequest struct {
	TestCaseIDs []uuid.UUID `json:"test_case_ids"`
}

type TestCaseRunResult struct {
	TestCaseID uuid.UUID `json:"test_case_id"`
	Status     string    `json:"status"`
	RunTime    time.Time `json:"run_time"`
}

type Requirement struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

var (
	db     *sql.DB
	router *httprouter.Router
)

const (
	dbHost     = "localhost"
	dbPort     = 5432
	dbUser     = "postgres"
	dbPassword = "postgres"
	dbName     = "postgres"
)

func initDB() {
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal(err)
	}

	log.Println("Database connected successfully")
}

func createProject(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var project Project
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if project.ID == uuid.Nil {
		project.ID = uuid.New()
	}

	query := `INSERT INTO projects (id, name, description) VALUES ($1, $2, $3)`
	_, err := db.Exec(query, project.ID, project.Name, project.Description)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(project)
}

func addEntity(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var entity Entity
	if err := json.NewDecoder(r.Body).Decode(&entity); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if entity.ID == uuid.Nil {
		entity.ID = uuid.New()
	}

	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM projects WHERE id = $1)", entity.ProjectID).Scan(&exists)
	if err != nil || !exists {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	query := `INSERT INTO entities (id, name, description, project_id, json_data) VALUES ($1, $2, $3, $4, $5)`
	_, err = db.Exec(query, entity.ID, entity.Name, entity.Description, entity.ProjectID, entity.JSONData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entity)
}

func batchUploadTestCases(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var testCases []TestCase
	if err := json.NewDecoder(r.Body).Decode(&testCases); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tx, err := db.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO test_cases (id, name, description, json_data, entity_id, project_id, requirement_id) 
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	for _, tc := range testCases {
		if tc.ID == uuid.Nil {
			tc.ID = uuid.New()
		}
		_, err := stmt.Exec(tc.ID, tc.Name, tc.Description, tc.JSONData, tc.EntityID, tc.ProjectID, tc.RequirementID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(testCases)
}

func runTestCases(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var req TestCaseRunRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(req.TestCaseIDs) == 0 {
		http.Error(w, "No test case IDs provided", http.StatusBadRequest)
		return
	}

	placeholders := make([]interface{}, len(req.TestCaseIDs))
	for i := range req.TestCaseIDs {
		placeholders[i] = req.TestCaseIDs[i]
	}

	query := `SELECT id, requirement_id FROM test_cases WHERE id = ANY($1)`
	rows, err := db.Query(query, pq.Array(req.TestCaseIDs))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var results []TestCaseRunResult
	for rows.Next() {
		var requirementID, tcID uuid.UUID
		if err := rows.Scan(&tcID, &requirementID); err != nil {
			continue
		}

		status := "passed"
		if time.Now().Unix()%2 == 0 {
			status = "failed"
		}

		result := TestCaseRunResult{
			TestCaseID: tcID,
			Status:     status,
			RunTime:    time.Now(),
		}
		results = append(results, result)

		sendNotification(requirementID, tcID, status)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func getRequirements(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// TODO: integration

	projectID := ps.ByName("projectId")
	entityID := ps.ByName("entityId")

	_ = projectID
	_ = entityID

	requirements := []Requirement{
		{ID: uuid.New(), Name: "Requirement 1"},
		{ID: uuid.New(), Name: "Requirement 2"},
		{ID: uuid.New(), Name: "Requirement 3"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requirements)
}

func sendNotification(requirementID, testCaseID uuid.UUID, status string) {
	// TODO: integration

	log.Printf("Proizvolnyi push 2: requirement=%s, testcase=%s, status=%s\n",
		requirementID, testCaseID, status)

	// client := &http.Client{}
	// req, _ := http.NewRequest("POST", "https://external-system.com/notify", nil)
	// ...
}

func setupRoutes() {
	router = httprouter.New()

	router.POST("/projects", createProject)
	router.POST("/entities", addEntity)
	router.POST("/testcases/batch", batchUploadTestCases)
	router.POST("/testcases/run", runTestCases)
	router.GET("/projects/:projectId/entities/:entityId/requirements", getRequirements)
}

func main() {
	initDB()
	defer db.Close()

	setupRoutes()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server is running on port: %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
