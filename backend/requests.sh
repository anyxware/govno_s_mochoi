curl -X POST http://localhost:8080/projects \
  -H "Content-Type: application/json" \
  -d '{"id": "deadbeef-1488-a0a0-baba-24ed6463dc28", "name":"Project", "description":"Some description"}'

curl -X POST http://localhost:8080/entities \
  -H "Content-Type: application/json" \
  -d '{
	"id": "deadbeef-1488-a0a0-baba-24ed6463dc28",
    "name":"User",
    "description":"Description of User",
    "project_id":"deadbeef-1488-a0a0-baba-24ed6463dc28",
    "json_data":{
      "fields":["id","name","email"],
      "type":"user"
    }
  }'

curl -X POST http://localhost:8080/testcases/batch \
  -H "Content-Type: application/json" \
  -d '[
  {
	"id": "17ef9c34-5f3b-436c-8bac-3e6159a3b0bc",
    "name":"User name",
    "description":"Test User Name",
    "json_data": {"kek": "lol"},
    "entity_id":"deadbeef-1488-a0a0-baba-24ed6463dc28",
    "project_id":"deadbeef-1488-a0a0-baba-24ed6463dc28",
    "requirement_id":"zis_is_the_best_subject_evereverever"
  },
  {
	"id": "48d5d033-891c-4d89-8248-0559e9cfc40e",
    "name":"User email",
    "description":"Test User email",
    "json_data": {"dogovornyachok": "blizko"},
    "entity_id":"deadbeef-1488-a0a0-baba-24ed6463dc28",
    "project_id":"deadbeef-1488-a0a0-baba-24ed6463dc28",
    "requirement_id":"zis_is_the_best_subject_evereverever"
  }
]'


curl -X POST http://localhost:8080/testcases/run \
  -H "Content-Type: application/json" \
  -d '{"test_case_ids":[
  		"17ef9c34-5f3b-436c-8bac-3e6159a3b0bc",
		"48d5d033-891c-4d89-8248-0559e9cfc40e"
		]}'

curl http://localhost:8080/projects/deadbeef-1488-a0a0-baba-24ed6463dc28/entities/deadbeef-1488-a0a0-baba-24ed6463dc28/requirements
