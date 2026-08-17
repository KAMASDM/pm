# ASC-OS Project API v2

The API connects Git repositories, VS Code, CI pipelines, and trusted automation to ASC-OS. Version 2 is backward compatible with the original project-sync manifest while adding delivery templates, reads, partial updates, resource CRUD, team-member management, and project insights.

## Authentication

Create a key from **API & VS Code** in ASC-OS and send it as a Bearer token:

```http
Authorization: Bearer orbit_sk_<key-id>_<secret>
```

Only the SHA-256 hash is stored. The secret is returned once, and revocation takes effect on the next request. API-managed records are isolated by API key.

Base URL:

```text
https://asia-south1-learntospeak-b7404.cloudfunctions.net/projectSyncApi
```

All request and response bodies use JSON. Successful responses use `{ "ok": true, "data": ... }`; errors use `{ "ok": false, "error": { "code", "message", "details" } }`.

## Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/v1/health` | Public service health and API version |
| `GET` | `/v1/templates` | Discover website, CRM, ERP, mobile, and custom-software templates |
| `GET` | `/v1/categories` | Read workspace categories and subcategories |
| `GET` | `/v1/projects` | List projects owned by the API key |
| `POST` | `/v1/projects/sync` | Idempotently reconcile an entire project manifest |
| `GET` | `/v1/projects/:externalId` | Read a project with its milestones and tasks |
| `PATCH` | `/v1/projects/:externalId` | Partially update project metadata or template |
| `GET` | `/v1/projects/:externalId/insights` | Get server-calculated delivery intelligence |
| `PUT` | `/v1/projects/:externalId/milestones/:milestoneExternalId` | Create or update one milestone |
| `DELETE` | `/v1/projects/:externalId/milestones/:milestoneExternalId` | Delete a milestone and its linked tasks |
| `PUT` | `/v1/projects/:externalId/tasks/:taskExternalId` | Create or update one task |
| `DELETE` | `/v1/projects/:externalId/tasks/:taskExternalId` | Delete one task |
| `GET` | `/v1/team-members` | List team-member records owned by the API key |
| `PUT` | `/v1/team-members/:externalId` | Create or update a team-member record |
| `DELETE` | `/v1/team-members/:externalId` | Delete an API-managed team-member record |

## Delivery templates

Allowed `projectType` values are:

- `website`
- `crm`
- `erp`
- `mobile-app`
- `custom-software`

Setting a project type links the correct ASC-OS category and makes its subcategories and milestone suggestions available in the UI. Use `GET /v1/templates` to discover the current definitions instead of hard-coding them.

## Full project sync

```http
POST /v1/projects/sync
```

```json
{
  "schemaVersion": 2,
  "externalId": "customer-portal",
  "projectType": "website",
  "name": "Customer Portal",
  "description": "Self-service customer application",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-12-15",
  "replace": true,
  "repository": {
    "url": "https://github.com/example/customer-portal.git",
    "branch": "main",
    "provider": "github",
    "lastCommit": "abc123"
  },
  "milestones": [
    {
      "externalId": "mvp",
      "name": "MVP",
      "status": "in-progress",
      "dueDate": "2026-10-01"
    }
  ],
  "tasks": [
    {
      "externalId": "AUTH-01",
      "milestoneExternalId": "mvp",
      "name": "Implement authentication",
      "status": "completed",
      "completedAt": "2026-09-12T10:30:00Z",
      "priority": "high",
      "category": "Website Delivery",
      "subcategory": "Forms, APIs & Integrations",
      "dueDate": "2026-09-15",
      "estimatedHours": 12,
      "assignedToName": "Anita Developer",
      "assignedToEmail": "anita@example.com",
      "checklist": [
        { "text": "Google sign-in", "completed": true },
        { "text": "Route protection", "completed": true }
      ]
    }
  ],
  "clients": [
    {
      "name": "Project Sponsor",
      "email": "sponsor@example.com",
      "company": "Example Ltd"
    }
  ]
}
```

Projects, milestones, and tasks use deterministic Firestore IDs derived from the API key and external IDs. Repeating the request updates the same records. Set `replace: true` to remove integration-managed tasks and milestones omitted from the next manifest. Client provisioning is idempotent by normalized contact email; credentials are returned only when a new client account is created.

Limits per sync are 250 tasks, 50 milestones, and 25 clients. Dates must be ISO-compatible. Project statuses are `planning`, `in-progress`, `on-hold`, and `completed`; milestone statuses are `upcoming`, `in-progress`, and `completed`; task statuses are `pending`, `in-progress`, `blocked`, and `completed`.

## Partial resource updates

Update project metadata without resending its plan:

```http
PATCH /v1/projects/customer-portal
Content-Type: application/json

{
  "priority": "high",
  "dueDate": "2026-12-31",
  "projectType": "website"
}
```

Create or update a milestone:

```http
PUT /v1/projects/customer-portal/milestones/production-launch
Content-Type: application/json

{
  "name": "Production launch",
  "status": "upcoming",
  "dueDate": "2026-12-15"
}
```

Create or update a task:

```http
PUT /v1/projects/customer-portal/tasks/REL-01
Content-Type: application/json

{
  "name": "Deploy production release",
  "milestoneExternalId": "production-launch",
  "status": "in-progress",
  "priority": "high",
  "category": "Website Delivery",
  "subcategory": "Launch & Handover",
  "dueDate": "2026-12-14",
  "estimatedHours": 6
}
```

`PUT` is an upsert: omitted properties retain their existing value. `DELETE` permanently removes the addressed API-managed record. Deleting a milestone also deletes tasks linked to it.

## Project insights

```http
GET /v1/projects/customer-portal/insights
```

The response includes:

- delivery health score and status;
- actual versus expected progress and schedule variance;
- completion velocity and forecast finish date;
- task counts, overdue work, missing deadlines, and missing estimates;
- milestone progress and overdue state;
- workload by assignee;
- category progress;
- machine-readable delivery risks.

Insights are calculated from current project data at request time, so they reflect both UI changes and VS Code/API pushes.

## Team members

```http
PUT /v1/team-members/dev-42
Content-Type: application/json

{
  "name": "Anita Developer",
  "email": "anita@example.com",
  "phone": "+91 90000 00000",
  "role": "developer",
  "department": "Engineering",
  "skills": ["React", "Node.js", "Firebase"]
}
```

This creates a planning and assignment record. It does not create a Firebase Authentication login or grant a production role; login access remains an administrator-controlled action.

## Repository CLI

The hosted `orbit-pm.mjs` CLI supports:

```text
init [--template TYPE] [--force]  Generate a schema-v2 project manifest
configure [api-key]               Save the key to ignored local configuration
sync                              Reconcile the manifest and commit completion markers
complete TASK-ID                  Complete tasks and sync immediately
install-hook                      Add automatic pre-push synchronization
```

Example:

```bash
node orbit-pm.mjs init --template mobile-app
node .orbit/orbit-pm.mjs configure
node .orbit/orbit-pm.mjs install-hook
```

The CLI records the last synchronized commit in ignored `.orbit/state.json`. Commit subjects containing `[done:TASK-ID]` mark matching tasks complete before the next push.

Never place API keys in `project.json`, VS Code settings, shell scripts, commit messages, or CI logs. Use ignored `.orbit/config.local.json`, an environment secret, or the CI platform's secret manager.
