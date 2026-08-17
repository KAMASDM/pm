import process from "node:process";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";

const apply = process.argv.includes("--apply");
initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const toTimestamp = (value) => {
  if (!value || value?.toDate) return value || null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : Timestamp.fromDate(parsed);
};

const employeeSnapshot = await db.collection("employees").get();
const employees = new Map(employeeSnapshot.docs.map((document) => [document.id, document.data()]));
const userSnapshot = await db.collection("users").where("role", "==", "client").get();
const clientsByEmail = new Map(
  userSnapshot.docs.map((document) => [document.data().contactEmail, { uid: document.id, ...document.data() }])
);

let changed = 0;
for (const collectionName of ["projects", "tasks", "milestones"]) {
  const snapshot = await db.collection(collectionName).get();
  for (const document of snapshot.docs) {
    const data = document.data();
    const updates = {};
    if (data.dueDate && !data.dueDate?.toDate) updates.dueDate = toTimestamp(data.dueDate);

    if (collectionName === "projects") {
      const assignedIds = (data.assignedTo || []).map((member) =>
        typeof member === "string" ? member : member.id
      ).filter(Boolean);
      updates.assignedTo = assignedIds;
      updates.teamMembers = assignedIds.map((id) => {
        const employee = employees.get(id) || {};
        return {
          id,
          name: employee.name || "",
          email: employee.email || "",
          role: employee.role || "",
          photoURL: employee.photoURL || "",
        };
      });
      const hydratedClients = (data.clients || []).map((client) => {
        const account = clientsByEmail.get(String(client.email || "").toLowerCase());
        return account
          ? {
              uid: account.uid,
              clientId: account.clientId,
              id: account.clientId,
              name: client.name || account.displayName || "Client",
              company: client.company || account.company || "",
              role: "client",
            }
          : client;
      });
      updates.clients = hydratedClients;
      updates.clientUserIds = hydratedClients.map((client) => client.uid).filter(Boolean);

      if (apply) {
        for (const legacyClient of data.clients || []) {
          const account = clientsByEmail.get(String(legacyClient.email || "").toLowerCase());
          if (account) {
            await db.doc(`projects/${document.id}/clients/${account.uid}`).set({
              uid: account.uid,
              clientId: account.clientId,
              name: legacyClient.name || account.displayName || "Client",
              company: legacyClient.company || account.company || "",
              contactEmail: account.contactEmail,
              role: "client",
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
          }
        }
      }
    }

    if (collectionName === "tasks" && data.assignedTo) {
      const employee = employees.get(data.assignedTo);
      if (employee) {
        updates.assignedToName = employee.name || "";
        updates.assignedToEmail = employee.email || "";
      }
    }

    if (Object.keys(updates).length) {
      changed += 1;
      if (apply) {
        await document.ref.update({ ...updates, migratedAt: FieldValue.serverTimestamp() });
      }
    }
  }
}

process.stdout.write(`${apply ? "Migrated" : "Would migrate"} ${changed} documents.\n`);
if (!apply) process.stdout.write("Run npm run migrate -- --apply after reviewing this dry run.\n");
