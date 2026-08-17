# ASC-OS Project Sync API

The project sync API turns a Git repository into the source of truth for an ASC-OS delivery plan. It is designed for VS Code, CI pipelines, Git hooks, and other trusted developer automation.

## Authentication

Create a key from **API & VS Code** in the team workspace. Send it as a Bearer token:

```http
Authorization: Bearer orbit_sk_<key-id>_<secret>
```

Only the SHA-256 hash is stored. The secret is returned once. Revocation takes effect on the next request.

## Sync endpoint

```http
POST https://asia-south1-learntospeak-b7404.cloudfunctions.net/projectSyncApi/v1/projects/sync
Content-Type: application/json
Authorization: Bearer orbit_sk_...
```

Example manifest:

```json
{
  "schemaVersion": 1,
  "externalId": "customer-portal",
  "name": "Customer Portal",
  "description": "Self-service customer application",
  "status": "in-progress",
  "priority": "high",
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
      "priority": "high",
      "category": "Development",
      "estimatedHours": 12,
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

Projects, milestones, and tasks use deterministic Firestore IDs derived from the API key and external IDs. Repeating the request updates the same records. Client creation is also idempotent by normalized contact email; credentials are returned only for newly created accounts.

Limits per request are 250 tasks, 50 milestones, and 25 clients. Dates must be values accepted by JavaScript's ISO date parser. Allowed project statuses are `planning`, `in-progress`, `on-hold`, and `completed`; task statuses are `pending`, `in-progress`, `blocked`, and `completed`.

## Repository CLI

The hosted `orbit-pm.mjs` CLI supports:

```text
init [--force]       Generate a complete starting PM template
configure [api-key]  Save the key to ignored local configuration
sync                 Reconcile the manifest with ASC-OS
complete TASK-ID     Complete tasks and sync
install-hook         Add automatic pre-push synchronization
```

The CLI records the last synchronized commit in the ignored local file `.orbit/state.json`. Commit subjects containing `[done:TASK-ID]` mark matching tasks complete before the next push.

Do not put API keys in `project.json`, VS Code settings, shell scripts, commit messages, or CI logs. Use the ignored `.orbit/config.local.json`, an environment secret, or the secret manager provided by the CI platform.
