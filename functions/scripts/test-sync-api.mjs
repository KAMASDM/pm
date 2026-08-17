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

const endpoint = `http://127.0.0.1:5001/${projectId}/asia-south1/projectSyncApi/v1/projects/sync`;
const manifest = {
  schemaVersion: 1,
  externalId: "api-integration-test",
  name: "API Integration Test",
  description: "Created by the local Functions emulator test.",
  replace: true,
  milestones: [
    { externalId: "mvp", name: "MVP", status: "in-progress" },
  ],
  tasks: [
    { externalId: "API-01", milestoneExternalId: "mvp", name: "Create sync API", status: "completed" },
    { externalId: "API-02", milestoneExternalId: "mvp", name: "Verify idempotency", status: "pending" },
  ],
  clients: [],
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

process.stdout.write(`Project sync API test passed for ${second.projectId}.\n`);
