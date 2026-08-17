import { createHash } from "node:crypto";
import process from "node:process";
import { initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";

const projectId = process.env.GCLOUD_PROJECT || "demo-orbit-projects";
initializeApp({ projectId });
const db = getFirestore();
const keyId = "0123456789abcdef";
const token = `orbit_sk_${keyId}_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop`;
const tokenHash = createHash("sha256").update(token).digest("hex");

await Promise.all([
  db.doc("users/api-test-owner").set({ role: "admin", displayName: "API Test" }),
  db.doc(`apiKeys/${keyId}`).set({
    name: "Integration test",
    keyId,
    tokenHash,
    prefix: `orbit_sk_${keyId}`,
    active: true,
    scopes: ["projects:sync"],
    createdBy: "api-test-owner",
    createdAt: Timestamp.now(),
  }),
]);

const baseEndpoint = `http://127.0.0.1:5001/${projectId}/asia-south1/projectSyncApi`;
const endpoint = `${baseEndpoint}/v1/projects/sync`;
const manifest = {
  schemaVersion: 1,
  externalId: "api-integration-test",
  name: "API Integration Test",
  description: "Created by the local Functions emulator test.",
  projectType: "custom-software",
  dueDate: "2026-12-31",
  replace: true,
  milestones: [
    { externalId: "mvp", name: "MVP", status: "in-progress", dueDate: "2026-10-01" },
  ],
  tasks: [
    { externalId: "API-01", milestoneExternalId: "mvp", name: "Create sync API", status: "completed", category: "Custom Software Delivery", subcategory: "APIs, Integrations & Automation", completedAt: "2026-08-17" },
    { externalId: "API-02", milestoneExternalId: "mvp", name: "Verify idempotency", status: "pending", dueDate: "2026-09-01", estimatedHours: 4 },
  ],
  clients: [],
};

const callApi = async (path, { method = "GET", body, authenticated = true } = {}) => {
  const response = await fetch(`${baseEndpoint}${path}`, {
    method,
    headers: {
      ...(authenticated ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
};

const callSync = async () => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(manifest),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(`Sync failed: ${JSON.stringify(payload)}`);
  return payload.data;
};

const unauthorizedResponse = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(manifest),
});
if (unauthorizedResponse.status !== 401) {
  throw new Error(`Expected an unauthorized request to return 401, got ${unauthorizedResponse.status}.`);
}

const invalidResponse = await fetch(endpoint, {
  method: "POST",
  headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  body: JSON.stringify({ name: "Missing external ID" }),
});
if (invalidResponse.status !== 400) {
  throw new Error(`Expected an invalid manifest to return 400, got ${invalidResponse.status}.`);
}

const first = await callSync();
const second = await callSync();
if (first.projectId !== second.projectId || second.counts.tasks !== 2 || second.progress !== 50) {
  throw new Error(`Unexpected idempotent sync result: ${JSON.stringify(second)}`);
}

const [projectSnapshot, tasksSnapshot, milestonesSnapshot] = await Promise.all([
  db.doc(`projects/${second.projectId}`).get(),
  db.collection("tasks").where("projectId", "==", second.projectId).get(),
  db.collection("milestones").where("projectId", "==", second.projectId).get(),
]);
if (!projectSnapshot.exists || tasksSnapshot.size !== 2 || milestonesSnapshot.size !== 1) {
  throw new Error("Synced Firestore records do not match the manifest.");
}

if (
  projectSnapshot.data().projectType !== "custom-software" ||
  projectSnapshot.data().selectedCategories?.[0] !== "template-custom-software"
) {
  throw new Error("Template-aware project fields were not synchronized.");
}

const templates = await callApi("/v1/templates");
if (!templates.response.ok || templates.payload.data.templates.length !== 5) {
  throw new Error("Template discovery endpoint failed.");
}

const categories = await callApi("/v1/categories");
if (
  !categories.response.ok ||
  !categories.payload.data.categories.some((category) => category.name === "Custom Software Delivery")
) {
  throw new Error("Category discovery endpoint failed.");
}

const projectRead = await callApi(`/v1/projects/${manifest.externalId}`);
if (
  !projectRead.response.ok ||
  projectRead.payload.data.tasks.length !== 2 ||
  projectRead.payload.data.milestones.length !== 1
) {
  throw new Error("Project graph endpoint failed.");
}

const patchProject = await callApi(`/v1/projects/${manifest.externalId}`, {
  method: "PATCH",
  body: { priority: "high", projectType: "website" },
});
if (!patchProject.response.ok) throw new Error("Project patch endpoint failed.");

const milestonePut = await callApi(
  `/v1/projects/${manifest.externalId}/milestones/release`,
  { method: "PUT", body: { name: "Release", dueDate: "2026-11-30" } }
);
if (milestonePut.response.status !== 201) throw new Error("Milestone upsert endpoint failed.");

const taskPut = await callApi(`/v1/projects/${manifest.externalId}/tasks/API-03`, {
  method: "PUT",
  body: {
    name: "Deploy API v2",
    milestoneExternalId: "release",
    status: "in-progress",
    category: "Website Delivery",
    subcategory: "Forms, APIs & Integrations",
    dueDate: "2026-11-20",
    estimatedHours: 6,
  },
});
if (taskPut.response.status !== 201) throw new Error("Task upsert endpoint failed.");

const insights = await callApi(`/v1/projects/${manifest.externalId}/insights`);
if (
  !insights.response.ok ||
  insights.payload.data.tasks.counts.total !== 3 ||
  typeof insights.payload.data.health.score !== "number"
) {
  throw new Error("Project insights endpoint failed.");
}

const memberPut = await callApi("/v1/team-members/dev-1", {
  method: "PUT",
  body: {
    name: "API Developer",
    email: "developer@example.com",
    role: "developer",
    department: "Engineering",
    skills: ["Node.js", "Firebase"],
  },
});
if (memberPut.response.status !== 201) throw new Error("Team member upsert endpoint failed.");
const members = await callApi("/v1/team-members");
if (!members.response.ok || members.payload.data.teamMembers.length !== 1) {
  throw new Error("Team member list endpoint failed.");
}

for (const [path, label] of [
  [`/v1/projects/${manifest.externalId}/tasks/API-03`, "Task delete"],
  [`/v1/projects/${manifest.externalId}/milestones/release`, "Milestone delete"],
  ["/v1/team-members/dev-1", "Team member delete"],
]) {
  const deleted = await callApi(path, { method: "DELETE" });
  if (!deleted.response.ok || !deleted.payload.data.deleted) {
    throw new Error(`${label} endpoint failed.`);
  }
}

process.stdout.write(`Project API v2 integration test passed for ${second.projectId}.\n`);
