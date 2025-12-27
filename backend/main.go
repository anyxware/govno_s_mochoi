package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"zis/internal/config"

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

func initDB() {
	cfg := config.GetConfig()
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Password, cfg.Database.DBname)
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

func getStatus(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
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

func corsMiddleware(next httprouter.Handle) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r, ps)
	}
}

func setupRouter() *httprouter.Router {
	router := httprouter.New()

	router.GET("/status", corsMiddleware(getStatus))
	router.POST("/projects", corsMiddleware(createProject))
	router.POST("/entities", corsMiddleware(addEntity))
	router.POST("/testcases/batch", corsMiddleware(batchUploadTestCases))
	router.POST("/testcases/run", corsMiddleware(runTestCases))
	router.GET("/projects/:projectId/entities/:entityId/requirements", corsMiddleware(getRequirements))

	return router
}

func startServer() {
	cfg := config.GetConfig()
	connBackendStr := fmt.Sprintf("%s:%s",
		cfg.BackendServer.Host, cfg.BackendServer.Port)

	router := setupRouter()

	server := &http.Server{
		Addr:    connBackendStr,
		Handler: router,
	}

	log.Printf("Starting server on %s", connBackendStr)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("Server error:", err)
	}
}

func waitForShutdown() {
	sigchan := make(chan os.Signal, 1)
	signal.Notify(sigchan, syscall.SIGINT, syscall.SIGTERM)
	<-sigchan
	log.Println("Shutting down...")
}

func main() {
	initDB()
	defer db.Close()

	go startServer()
	waitForShutdown()
}
