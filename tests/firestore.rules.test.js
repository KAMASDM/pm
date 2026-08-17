import { readFileSync } from "node:fs";
import process from "node:process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

let environment;

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: process.env.GCLOUD_PROJECT || "demo-orbit-projects",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => environment.cleanup());

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "users/admin-1"), { role: "admin" }),
      setDoc(doc(db, "users/client-a"), { role: "client", clientId: "CL-A" }),
      setDoc(doc(db, "users/client-b"), { role: "client", clientId: "CL-B" }),
      setDoc(doc(db, "projects/project-a"), {
        name: "Private A",
        clientUserIds: ["client-a"],
      }),
      setDoc(doc(db, "projects/project-b"), {
        name: "Private B",
        clientUserIds: ["client-b"],
      }),
      setDoc(doc(db, "tasks/task-a"), { name: "Task A", projectId: "project-a" }),
      setDoc(doc(db, "tasks/task-b"), { name: "Task B", projectId: "project-b" }),
      setDoc(doc(db, "notifications/n-a"), {
        recipientIds: ["client-a", "client-b"],
        readBy: ["client-b"],
        title: "Update",
      }),
      setDoc(doc(db, "projects/project-a/clients/client-a"), {
        contactEmail: "client-a@example.com",
      }),
      setDoc(doc(db, "projects/project-a/clients/client-b"), {
        contactEmail: "client-b@example.com",
      }),
    ]);
  });
});

describe("tenant isolation", () => {
  it("allows a client to read only assigned projects and tasks", async () => {
    const db = environment.authenticatedContext("client-a").firestore();
    await assertSucceeds(getDoc(doc(db, "projects/project-a")));
    await assertSucceeds(getDoc(doc(db, "tasks/task-a")));
    await assertFails(getDoc(doc(db, "projects/project-b")));
    await assertFails(getDoc(doc(db, "tasks/task-b")));
  });

  it("supports membership-scoped production queries", async () => {
    const db = environment.authenticatedContext("client-a").firestore();
    const projects = await assertSucceeds(
      getDocs(query(collection(db, "projects"), where("clientUserIds", "array-contains", "client-a")))
    );
    const tasks = await assertSucceeds(
      getDocs(query(collection(db, "tasks"), where("projectId", "==", "project-a")))
    );
    expect(projects.docs.map((item) => item.id)).toEqual(["project-a"]);
    expect(tasks.docs.map((item) => item.id)).toEqual(["task-a"]);
  });

  it("prevents clients from modifying project data", async () => {
    const db = environment.authenticatedContext("client-a").firestore();
    await assertFails(updateDoc(doc(db, "projects/project-a"), { name: "Changed" }));
    await assertFails(updateDoc(doc(db, "tasks/task-a"), { status: "completed" }));
  });

  it("allows team administrators to manage projects", async () => {
    const db = environment.authenticatedContext("admin-1").firestore();
    await assertSucceeds(updateDoc(doc(db, "projects/project-a"), { status: "in-progress" }));
    await assertSucceeds(getDoc(doc(db, "projects/project-b")));
  });

  it("allows recipients to mark only their notification read", async () => {
    const db = environment.authenticatedContext("client-a").firestore();
    await assertSucceeds(
      updateDoc(doc(db, "notifications/n-a"), { readBy: arrayUnion("client-a") })
    );
    await assertFails(
      updateDoc(doc(db, "notifications/n-a"), { title: "Tampered", updatedAt: serverTimestamp() })
    );
  });

  it("preserves other recipients' read markers", async () => {
    const db = environment.authenticatedContext("client-a").firestore();
    await assertFails(
      updateDoc(doc(db, "notifications/n-a"), { readBy: ["client-a"] })
    );
    await assertFails(
      updateDoc(doc(db, "notifications/n-a"), {
        readBy: ["client-b", "client-a", "unrelated-user"],
      })
    );
  });

  it("keeps client contact membership records private", async () => {
    const db = environment.authenticatedContext("client-a").firestore();
    await assertSucceeds(getDoc(doc(db, "projects/project-a/clients/client-a")));
    await assertFails(getDoc(doc(db, "projects/project-a/clients/client-b")));
  });

  it("does not let clients bypass first-login password state", async () => {
    const db = environment.authenticatedContext("client-a").firestore();
    await assertFails(
      updateDoc(doc(db, "users/client-a"), { mustChangePassword: false })
    );
  });

  it("rejects unauthenticated access", async () => {
    const db = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "projects/project-a")));
  });
});
