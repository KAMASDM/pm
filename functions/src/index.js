import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import process from "node:process";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  getProjectTemplate,
  projectTemplates,
  templateCategoryDocument,
} from "./projectTemplates.js";
import { calculateProjectInsights } from "./projectInsights.js";

initializeApp();

const db = getFirestore();
const auth = getAuth();
const messaging = getMessaging();
const region = "asia-south1";
const clientAuthDomain = process.env.CLIENT_AUTH_DOMAIN || "clients.pm.local";

const requireAuth = (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in first.");
  return request.auth.uid;
};

const getProfile = async (uid) => {
  const snapshot = await db.doc(`users/${uid}`).get();
  return snapshot.exists ? snapshot.data() : null;
};

const requireTeam = async (request) => {
  const uid = requireAuth(request);
  const profile = await getProfile(uid);
  if (!profile || !["admin", "team"].includes(profile.role)) {
    throw new HttpsError("permission-denied", "Team access is required.");
  }
  return { uid, profile };
};

const normalizeContactEmail = (email) => String(email || "").trim().toLowerCase();
const createTemporaryPassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(18);
  const password = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `A9!${password}`;
};

const createUniqueClientId = async () => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = randomBytes(5).toString("hex").toUpperCase();
    const clientId = `CL-${token}`;
    const existing = await db
      .collection("users")
      .where("clientId", "==", clientId)
      .limit(1)
      .get();
    if (existing.empty) return clientId;
  }
  throw new HttpsError("resource-exhausted", "Could not allocate a client ID.");
};

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const queueNotification = async ({ recipientIds, title, body, type, projectId, taskId, route }) => {
  const uniqueRecipients = [...new Set((recipientIds || []).filter(Boolean))];
  if (!uniqueRecipients.length) return null;
  return db.collection("notifications").add({
    recipientIds: uniqueRecipients,
    title,
    body,
    type,
    projectId: projectId || null,
    taskId: taskId || null,
    route: route || (projectId ? `/client/projects/${projectId}` : "/client/dashboard"),
    readBy: [],
    createdAt: FieldValue.serverTimestamp(),
  });
};

const provisionClientForProject = async ({ actorId, projectId, name, email, company }) => {
  const normalizedProjectId = String(projectId || "");
  const normalizedName = String(name || "").trim();
  const contactEmail = normalizeContactEmail(email);
  const normalizedCompany = String(company || "").trim();

  if (!normalizedProjectId || !normalizedName || !contactEmail.includes("@")) {
    throw new HttpsError("invalid-argument", "Project, client name, and email are required.");
  }

  const projectRef = db.doc(`projects/${normalizedProjectId}`);
  const projectSnapshot = await projectRef.get();
  if (!projectSnapshot.exists) throw new HttpsError("not-found", "Project not found.");

  const existingProfiles = await db
    .collection("users")
    .where("contactEmail", "==", contactEmail)
    .limit(1)
    .get();

  let userRecord;
  let clientId;
  let temporaryPassword = null;
  let isNewAccount = false;

  if (!existingProfiles.empty) {
    const profileDoc = existingProfiles.docs[0];
    const profile = profileDoc.data();
    if (profile.role !== "client") {
      throw new HttpsError("already-exists", "That email belongs to a team account.");
    }
    clientId = profile.clientId;
    userRecord = await auth.getUser(profileDoc.id);
    if (userRecord.displayName !== normalizedName) {
      userRecord = await auth.updateUser(userRecord.uid, { displayName: normalizedName });
    }
  } else {
    clientId = await createUniqueClientId();
    temporaryPassword = createTemporaryPassword();
    userRecord = await auth.createUser({
      email: `${clientId.toLowerCase()}@${clientAuthDomain}`,
      password: temporaryPassword,
      displayName: normalizedName,
      emailVerified: true,
    });
    await auth.setCustomUserClaims(userRecord.uid, { role: "client" });
    isNewAccount = true;
  }

  const now = Timestamp.now();
  const wasAlreadyMember = (projectSnapshot.data().clientUserIds || []).includes(userRecord.uid);
  const clientRecord = {
    uid: userRecord.uid,
    id: clientId,
    clientId,
    name: normalizedName,
    company: normalizedCompany,
    role: "client",
    addedAt: now,
  };

  try {
    await db.runTransaction(async (transaction) => {
      const latestProject = await transaction.get(projectRef);
      if (!latestProject.exists) {
        throw new HttpsError("not-found", "Project not found.");
      }
      const project = latestProject.data();
      const clients = (project.clients || []).filter(
        (client) => client.uid !== userRecord.uid && normalizeContactEmail(client.email) !== contactEmail
      );

      const profileData = {
        role: "client",
        clientId,
        displayName: normalizedName,
        contactEmail,
        company: normalizedCompany,
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: actorId,
      };
      if (isNewAccount) {
        profileData.createdAt = now;
        profileData.mustChangePassword = true;
      }

      transaction.set(
        db.doc(`users/${userRecord.uid}`),
        profileData,
        { merge: true }
      );
      transaction.update(projectRef, {
        clients: [...clients, clientRecord],
        clientUserIds: FieldValue.arrayUnion(userRecord.uid),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(
        db.doc(`projects/${normalizedProjectId}/clients/${userRecord.uid}`),
        {
          ...clientRecord,
          contactEmail,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch (error) {
    if (isNewAccount) {
      await auth.deleteUser(userRecord.uid).catch((cleanupError) => {
        console.error("Unable to roll back client Auth account:", cleanupError);
      });
    }
    throw error;
  }

  if (!wasAlreadyMember) {
    await queueNotification({
      recipientIds: [userRecord.uid],
      title: `Welcome to ${projectSnapshot.data().name}`,
      body: "Your private client workspace is ready.",
      type: "client_provisioned",
      projectId: normalizedProjectId,
    });
  }

  if (isNewAccount) {
    await db.collection("mail").add({
      to: [contactEmail],
      message: {
        subject: `Your client portal access for ${projectSnapshot.data().name}`,
        text: `Your client ID is ${clientId}. Your temporary password is ${temporaryPassword}. You will be asked to change it after signing in.`,
        html: `<h2>Your private project portal is ready</h2><p>Project: <strong>${escapeHtml(projectSnapshot.data().name)}</strong></p><p>Client ID: <strong>${clientId}</strong></p><p>Temporary password: <strong>${escapeHtml(temporaryPassword)}</strong></p><p>You will be asked to create a private password after signing in.</p>`,
      },
    });
  }

  return { uid: userRecord.uid, clientId, temporaryPassword, isNewAccount };
};

export const provisionClientAccount = onCall({ region }, async (request) => {
  const { uid: actorId } = await requireTeam(request);
  return provisionClientForProject({
    actorId,
    projectId: request.data?.projectId,
    name: request.data?.name,
    email: request.data?.email,
    company: request.data?.company,
  });
});

export const resetClientAccess = onCall({ region }, async (request) => {
  await requireTeam(request);
  const uid = String(request.data?.uid || "");
  const profile = await getProfile(uid);
  if (!profile || profile.role !== "client") {
    throw new HttpsError("not-found", "Client account not found.");
  }
  const temporaryPassword = createTemporaryPassword();
  await auth.updateUser(uid, { password: temporaryPassword, disabled: false });
  await db.doc(`users/${uid}`).update({
    mustChangePassword: true,
    updatedAt: FieldValue.serverTimestamp(),
  });
  if (profile.contactEmail) {
    await db.collection("mail").add({
      to: [profile.contactEmail],
      message: {
        subject: "Your ASC-OS access was reset",
        text: `Client ID: ${profile.clientId}. Temporary password: ${temporaryPassword}.`,
        html: `<h2>Your portal access was reset</h2><p>Client ID: <strong>${profile.clientId}</strong></p><p>Temporary password: <strong>${escapeHtml(temporaryPassword)}</strong></p>`,
      },
    });
  }
  return { clientId: profile.clientId, temporaryPassword };
});

export const completePasswordChange = onCall({ region }, async (request) => {
  const uid = requireAuth(request);
  const profile = await getProfile(uid);
  if (!profile || profile.role !== "client") {
    throw new HttpsError("permission-denied", "Client access is required.");
  }
  await db.doc(`users/${uid}`).update({
    mustChangePassword: false,
    passwordChangedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { completed: true };
});

const hashValue = (value) => createHash("sha256").update(String(value)).digest("hex");
const stableDocumentId = (scope, externalId) =>
  `sync_${hashValue(`${scope}:${externalId}`).slice(0, 32)}`;
const cleanText = (value, maxLength = 500) =>
  String(value || "").trim().slice(0, maxLength);
const toOptionalTimestamp = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpsError("invalid-argument", `Invalid date: ${value}`);
  }
  return Timestamp.fromDate(date);
};

const projectStatuses = new Set(["planning", "in-progress", "on-hold", "completed"]);
const taskStatuses = new Set(["pending", "in-progress", "blocked", "completed"]);
const milestoneStatuses = new Set(["upcoming", "in-progress", "completed"]);
const priorities = new Set(["low", "medium", "high"]);
const projectTypes = new Set(projectTemplates.map((template) => template.id));
const normalizeChoice = (value, allowed, fallback) =>
  allowed.has(value) ? value : fallback;

const getApiEndpoint = () =>
  `https://${region}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/projectSyncApi`;

export const createProjectApiKey = onCall({ region }, async (request) => {
  const { uid } = await requireTeam(request);
  const name = cleanText(request.data?.name, 80);
  if (!name) throw new HttpsError("invalid-argument", "Give this API key a name.");

  const keyId = randomBytes(8).toString("hex");
  const secret = randomBytes(32).toString("base64url");
  const token = `orbit_sk_${keyId}_${secret}`;
  await db.doc(`apiKeys/${keyId}`).set({
    name,
    keyId,
    tokenHash: hashValue(token),
    prefix: `orbit_sk_${keyId}`,
    active: true,
    scopes: [
      "templates:read",
      "categories:read",
      "projects:read",
      "projects:write",
      "insights:read",
      "team:read",
      "team:write",
    ],
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastUsedAt: null,
  });
  return { keyId, token, prefix: `orbit_sk_${keyId}`, endpoint: getApiEndpoint() };
});

export const listProjectApiKeys = onCall({ region }, async (request) => {
  await requireTeam(request);
  const snapshot = await db.collection("apiKeys").orderBy("createdAt", "desc").limit(100).get();
  return {
    endpoint: getApiEndpoint(),
    keys: snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        name: data.name,
        prefix: data.prefix,
        active: data.active !== false,
        scopes: data.scopes || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        lastUsedAt: data.lastUsedAt?.toDate?.()?.toISOString() || null,
      };
    }),
  };
});

export const revokeProjectApiKey = onCall({ region }, async (request) => {
  await requireTeam(request);
  const keyId = cleanText(request.data?.keyId, 80);
  if (!keyId) throw new HttpsError("invalid-argument", "API key ID is required.");
  const keyRef = db.doc(`apiKeys/${keyId}`);
  if (!(await keyRef.get()).exists) throw new HttpsError("not-found", "API key not found.");
  await keyRef.update({ active: false, revokedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return { revoked: true };
});

const authenticateApiRequest = async (request) => {
  const authorization = String(request.get("authorization") || "");
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const match = /^orbit_sk_([a-f0-9]{16})_([A-Za-z0-9_-]{40,})$/.exec(token);
  if (!match) return null;
  const keySnapshot = await db.doc(`apiKeys/${match[1]}`).get();
  if (!keySnapshot.exists || keySnapshot.data().active === false) return null;
  const expected = Buffer.from(keySnapshot.data().tokenHash, "hex");
  const actual = Buffer.from(hashValue(token), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  await keySnapshot.ref.update({ lastUsedAt: FieldValue.serverTimestamp() });
  return { keyId: keySnapshot.id, ...keySnapshot.data() };
};

const sendApiError = (response, status, code, message, details = null) =>
  response.status(status).json({ ok: false, error: { code, message, details } });

const ensureTemplateCategory = async (projectType) => {
  const template = getProjectTemplate(projectType);
  if (!template) return null;
  const categoryRef = db.doc(`categories/template-${template.id}`);
  const snapshot = await categoryRef.get();
  if (!snapshot.exists) {
    await categoryRef.set({
      ...templateCategoryDocument(template),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  return categoryRef.id;
};

const validateSyncManifest = (body) => {
  const externalId = cleanText(body?.externalId, 160);
  const name = cleanText(body?.name, 160);
  if (!externalId || !name) {
    throw new HttpsError("invalid-argument", "externalId and name are required.");
  }
  const tasks = Array.isArray(body.tasks) ? body.tasks : [];
  const milestones = Array.isArray(body.milestones) ? body.milestones : [];
  const clients = Array.isArray(body.clients) ? body.clients : [];
  if (tasks.length > 250 || milestones.length > 50 || clients.length > 25) {
    throw new HttpsError("invalid-argument", "A sync supports up to 250 tasks, 50 milestones, and 25 clients.");
  }
  const requireUniqueIds = (items, label) => {
    const ids = items.map((item) => cleanText(item?.externalId, 160));
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
      throw new HttpsError("invalid-argument", `${label} require unique externalId values.`);
    }
  };
  requireUniqueIds(tasks, "Tasks");
  requireUniqueIds(milestones, "Milestones");
  return { externalId, name, tasks, milestones, clients };
};

const syncProjectManifest = async (apiKey, body) => {
  const { externalId, name, tasks, milestones, clients } = validateSyncManifest(body);
  const projectId = stableDocumentId(apiKey.keyId, externalId);
  const projectRef = db.doc(`projects/${projectId}`);
  const projectSnapshot = await projectRef.get();
  const existingProject = projectSnapshot.data() || {};
  if (existingProject.integration?.apiKeyId && existingProject.integration.apiKeyId !== apiKey.keyId) {
    throw new HttpsError("permission-denied", "This project belongs to another integration key.");
  }

  const requestedProjectType = body.projectType || existingProject.projectType || null;
  if (requestedProjectType && !projectTypes.has(requestedProjectType)) {
    throw new HttpsError(
      "invalid-argument",
      `projectType must be one of: ${[...projectTypes].join(", ")}.`
    );
  }
  const template = getProjectTemplate(requestedProjectType);
  const templateCategoryId = template
    ? await ensureTemplateCategory(template.id)
    : null;

  const now = Timestamp.now();
  const completedTaskCount = tasks.filter((task) => task.status === "completed").length;
  const inferredStatus = tasks.length > 0 && completedTaskCount === tasks.length
    ? "completed"
    : tasks.some((task) => task.status && task.status !== "pending")
      ? "in-progress"
      : "planning";
  await projectRef.set({
    name,
    description: cleanText(body.description, 4000),
    status: normalizeChoice(body.status, projectStatuses, inferredStatus),
    priority: normalizeChoice(body.priority, priorities, "medium"),
    dueDate: toOptionalTimestamp(body.dueDate),
    projectType: template?.id || existingProject.projectType || null,
    templateName: template?.name || existingProject.templateName || "",
    selectedCategories: templateCategoryId
      ? [templateCategoryId]
      : existingProject.selectedCategories || [],
    assignedTo: existingProject.assignedTo || [],
    teamMembers: existingProject.teamMembers || [],
    clients: existingProject.clients || [],
    clientUserIds: existingProject.clientUserIds || [],
    createdBy: existingProject.createdBy || apiKey.createdBy,
    createdByName: existingProject.createdByName || "VS Code integration",
    createdAt: existingProject.createdAt || now,
    updatedAt: now,
    integration: {
      provider: "orbit-vscode",
      apiKeyId: apiKey.keyId,
      externalId,
      repository: {
        url: cleanText(body.repository?.url, 500),
        branch: cleanText(body.repository?.branch, 160),
        provider: cleanText(body.repository?.provider, 80),
      },
      lastCommit: cleanText(body.repository?.lastCommit, 160),
      lastSyncedAt: now,
    },
  }, { merge: true });

  const milestoneIdByExternalId = new Map();
  const milestoneRefs = milestones.map((milestone) => {
    const milestoneExternalId = cleanText(milestone.externalId, 160);
    const ref = db.doc(`milestones/${stableDocumentId(projectId, `milestone:${milestoneExternalId}`)}`);
    milestoneIdByExternalId.set(milestoneExternalId, ref.id);
    return ref;
  });
  const taskRefs = tasks.map((task) =>
    db.doc(`tasks/${stableDocumentId(projectId, `task:${cleanText(task.externalId, 160)}`)}`)
  );
  const syncRefs = [...milestoneRefs, ...taskRefs];
  const existingDocuments = syncRefs.length ? await db.getAll(...syncRefs) : [];
  const existingByPath = new Map(existingDocuments.map((snapshot) => [snapshot.ref.path, snapshot.data()]));
  const writer = db.bulkWriter();

  milestones.forEach((milestone, index) => {
    const ref = milestoneRefs[index];
    const existing = existingByPath.get(ref.path) || {};
    writer.set(ref, {
      projectId,
      name: cleanText(milestone.name, 200) || cleanText(milestone.externalId, 160),
      description: cleanText(milestone.description, 2000),
      status: normalizeChoice(milestone.status, milestoneStatuses, "upcoming"),
      dueDate: toOptionalTimestamp(milestone.dueDate),
      createdBy: existing.createdBy || apiKey.createdBy,
      createdAt: existing.createdAt || now,
      updatedAt: now,
      integration: { apiKeyId: apiKey.keyId, externalId: cleanText(milestone.externalId, 160) },
    }, { merge: true });
  });
  tasks.forEach((task, index) => {
    const ref = taskRefs[index];
    const existing = existingByPath.get(ref.path) || {};
    writer.set(ref, {
      projectId,
      milestoneId: task.milestoneExternalId
        ? milestoneIdByExternalId.get(cleanText(task.milestoneExternalId, 160)) || null
        : null,
      name: cleanText(task.name, 240) || cleanText(task.externalId, 160),
      description: cleanText(task.description, 4000),
      status: normalizeChoice(task.status, taskStatuses, "pending"),
      priority: normalizeChoice(task.priority, priorities, "medium"),
      category: cleanText(task.category, 120) || template?.categoryName || "",
      subcategory: cleanText(task.subcategory, 120),
      assignedTo: existing.assignedTo || null,
      assignedToName: cleanText(task.assignedToName, 160) || existing.assignedToName || "",
      assignedToEmail: normalizeContactEmail(task.assignedToEmail) || existing.assignedToEmail || "",
      dueDate: toOptionalTimestamp(task.dueDate),
      estimatedHours: task.estimatedHours !== undefined
        && task.estimatedHours !== null
        && task.estimatedHours !== ""
        && Number.isFinite(Number(task.estimatedHours))
        ? Number(task.estimatedHours)
        : existing.estimatedHours || "",
      checklist: Array.isArray(task.checklist)
        ? task.checklist.slice(0, 100).map((item) => ({
          text: cleanText(item?.text, 500),
          completed: Boolean(item?.completed),
        }))
        : existing.checklist || [],
      completedAt: task.status === "completed"
        ? toOptionalTimestamp(task.completedAt) || existing.completedAt || now
        : null,
      createdBy: existing.createdBy || apiKey.createdBy,
      createdByName: existing.createdByName || "VS Code integration",
      createdAt: existing.createdAt || now,
      updatedAt: now,
      integration: { apiKeyId: apiKey.keyId, externalId: cleanText(task.externalId, 160) },
    }, { merge: true });
  });

  if (body.replace === true) {
    const [existingMilestones, existingTasks] = await Promise.all([
      db.collection("milestones").where("projectId", "==", projectId).get(),
      db.collection("tasks").where("projectId", "==", projectId).get(),
    ]);
    const retainedPaths = new Set([...milestoneRefs, ...taskRefs].map((ref) => ref.path));
    [...existingMilestones.docs, ...existingTasks.docs]
      .filter((document) =>
        document.data().integration?.apiKeyId === apiKey.keyId && !retainedPaths.has(document.ref.path)
      )
      .forEach((document) => writer.delete(document.ref));
  }
  await writer.close();

  const credentials = [];
  for (const client of clients) {
    const result = await provisionClientForProject({
      actorId: apiKey.createdBy,
      projectId,
      name: client.name,
      email: client.email,
      company: client.company,
    });
    credentials.push({
      email: normalizeContactEmail(client.email),
      clientId: result.clientId,
      temporaryPassword: result.temporaryPassword,
      isNewAccount: result.isNewAccount,
    });
  }

  return {
    projectId,
    externalId,
    projectUrl: `/projects/${projectId}`,
    counts: { tasks: tasks.length, milestones: milestones.length, clients: clients.length },
    progress: tasks.length ? Math.round((completedTaskCount / tasks.length) * 100) : 0,
    clientCredentials: credentials,
    syncedAt: now.toDate().toISOString(),
  };
};

const serializeApiValue = (value) => {
  if (value === null || value === undefined) return value ?? null;
  if (value?.toDate) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeApiValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeApiValue(item)])
    );
  }
  return value;
};

const requireApiProject = async (apiKey, externalId) => {
  const normalizedExternalId = cleanText(externalId, 160);
  if (!normalizedExternalId) {
    throw new HttpsError("invalid-argument", "Project external ID is required.");
  }
  const projectId = stableDocumentId(apiKey.keyId, normalizedExternalId);
  const ref = db.doc(`projects/${projectId}`);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Project not found.");
  const project = snapshot.data();
  if (
    project.integration?.apiKeyId !== apiKey.keyId ||
    project.integration?.externalId !== normalizedExternalId
  ) {
    throw new HttpsError("permission-denied", "This project belongs to another integration key.");
  }
  return { projectId, ref, snapshot, project, externalId: normalizedExternalId };
};

const getApiProjectGraph = async (apiKey, externalId) => {
  const context = await requireApiProject(apiKey, externalId);
  const [milestoneSnapshot, taskSnapshot] = await Promise.all([
    db.collection("milestones").where("projectId", "==", context.projectId).get(),
    db.collection("tasks").where("projectId", "==", context.projectId).get(),
  ]);
  const milestones = milestoneSnapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
  const tasks = taskSnapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
  return { ...context, milestones, tasks };
};

const patchApiProject = async (apiKey, externalId, body) => {
  const context = await requireApiProject(apiKey, externalId);
  const update = { updatedAt: Timestamp.now() };
  if (body.name !== undefined) {
    const name = cleanText(body.name, 160);
    if (!name) throw new HttpsError("invalid-argument", "Project name cannot be empty.");
    update.name = name;
  }
  if (body.description !== undefined) update.description = cleanText(body.description, 4000);
  if (body.status !== undefined) {
    if (!projectStatuses.has(body.status)) throw new HttpsError("invalid-argument", "Invalid project status.");
    update.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!priorities.has(body.priority)) throw new HttpsError("invalid-argument", "Invalid project priority.");
    update.priority = body.priority;
  }
  if (body.dueDate !== undefined) update.dueDate = toOptionalTimestamp(body.dueDate);
  if (body.projectType !== undefined) {
    if (!projectTypes.has(body.projectType)) {
      throw new HttpsError("invalid-argument", `projectType must be one of: ${[...projectTypes].join(", ")}.`);
    }
    const template = getProjectTemplate(body.projectType);
    update.projectType = template.id;
    update.templateName = template.name;
    update.selectedCategories = [await ensureTemplateCategory(template.id)];
  }
  await context.ref.update(update);
  return { projectId: context.projectId, externalId: context.externalId, updated: true };
};

const upsertApiMilestone = async (apiKey, projectExternalId, milestoneExternalId, body) => {
  const context = await requireApiProject(apiKey, projectExternalId);
  const externalId = cleanText(milestoneExternalId, 160);
  if (!externalId) throw new HttpsError("invalid-argument", "Milestone external ID is required.");
  const ref = db.doc(`milestones/${stableDocumentId(context.projectId, `milestone:${externalId}`)}`);
  const snapshot = await ref.get();
  const existing = snapshot.data() || {};
  const name = cleanText(body.name, 200) || existing.name || externalId;
  const status = body.status === undefined
    ? existing.status || "upcoming"
    : normalizeChoice(body.status, milestoneStatuses, null);
  if (!status) throw new HttpsError("invalid-argument", "Invalid milestone status.");
  await ref.set({
    projectId: context.projectId,
    name,
    description: body.description === undefined
      ? existing.description || ""
      : cleanText(body.description, 2000),
    status,
    dueDate: body.dueDate === undefined ? existing.dueDate || null : toOptionalTimestamp(body.dueDate),
    createdBy: existing.createdBy || apiKey.createdBy,
    createdAt: existing.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now(),
    integration: { apiKeyId: apiKey.keyId, externalId },
  }, { merge: true });
  return { id: ref.id, externalId, created: !snapshot.exists };
};

const deleteApiMilestone = async (apiKey, projectExternalId, milestoneExternalId) => {
  const context = await requireApiProject(apiKey, projectExternalId);
  const externalId = cleanText(milestoneExternalId, 160);
  const ref = db.doc(`milestones/${stableDocumentId(context.projectId, `milestone:${externalId}`)}`);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data().integration?.apiKeyId !== apiKey.keyId) {
    throw new HttpsError("not-found", "Milestone not found.");
  }
  const linkedTasks = await db.collection("tasks").where("milestoneId", "==", ref.id).get();
  const writer = db.bulkWriter();
  linkedTasks.docs.forEach((task) => writer.delete(task.ref));
  writer.delete(ref);
  await writer.close();
  return { deleted: true, externalId, deletedTasks: linkedTasks.size };
};

const upsertApiTask = async (apiKey, projectExternalId, taskExternalId, body) => {
  const context = await requireApiProject(apiKey, projectExternalId);
  const externalId = cleanText(taskExternalId, 160);
  if (!externalId) throw new HttpsError("invalid-argument", "Task external ID is required.");
  const ref = db.doc(`tasks/${stableDocumentId(context.projectId, `task:${externalId}`)}`);
  const snapshot = await ref.get();
  const existing = snapshot.data() || {};
  let milestoneId = existing.milestoneId || null;
  if (body.milestoneExternalId !== undefined) {
    milestoneId = body.milestoneExternalId
      ? stableDocumentId(
          context.projectId,
          `milestone:${cleanText(body.milestoneExternalId, 160)}`
        )
      : null;
    if (milestoneId && !(await db.doc(`milestones/${milestoneId}`).get()).exists) {
      throw new HttpsError("not-found", "The requested milestone does not exist.");
    }
  }
  const status = body.status === undefined
    ? existing.status || "pending"
    : normalizeChoice(body.status, taskStatuses, null);
  const priority = body.priority === undefined
    ? existing.priority || "medium"
    : normalizeChoice(body.priority, priorities, null);
  if (!status) throw new HttpsError("invalid-argument", "Invalid task status.");
  if (!priority) throw new HttpsError("invalid-argument", "Invalid task priority.");
  const template = getProjectTemplate(context.project.projectType);
  const estimatedHours = body.estimatedHours === undefined
    ? existing.estimatedHours || ""
    : body.estimatedHours === null || body.estimatedHours === ""
      ? ""
      : Number(body.estimatedHours);
  if (estimatedHours !== "" && !Number.isFinite(estimatedHours)) {
    throw new HttpsError("invalid-argument", "estimatedHours must be numeric.");
  }
  await ref.set({
    projectId: context.projectId,
    milestoneId,
    name: cleanText(body.name, 240) || existing.name || externalId,
    description: body.description === undefined
      ? existing.description || ""
      : cleanText(body.description, 4000),
    status,
    priority,
    category: body.category === undefined
      ? existing.category || template?.categoryName || ""
      : cleanText(body.category, 120),
    subcategory: body.subcategory === undefined
      ? existing.subcategory || ""
      : cleanText(body.subcategory, 120),
    assignedTo: existing.assignedTo || null,
    assignedToName: body.assignedToName === undefined
      ? existing.assignedToName || ""
      : cleanText(body.assignedToName, 160),
    assignedToEmail: body.assignedToEmail === undefined
      ? existing.assignedToEmail || ""
      : normalizeContactEmail(body.assignedToEmail),
    dueDate: body.dueDate === undefined ? existing.dueDate || null : toOptionalTimestamp(body.dueDate),
    estimatedHours,
    checklist: body.checklist === undefined
      ? existing.checklist || []
      : (Array.isArray(body.checklist) ? body.checklist : []).slice(0, 100).map((item) => ({
          text: cleanText(item?.text, 500),
          completed: Boolean(item?.completed),
        })),
    completedAt: status === "completed"
      ? toOptionalTimestamp(body.completedAt) || existing.completedAt || Timestamp.now()
      : null,
    createdBy: existing.createdBy || apiKey.createdBy,
    createdByName: existing.createdByName || "VS Code integration",
    createdAt: existing.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now(),
    integration: { apiKeyId: apiKey.keyId, externalId },
  }, { merge: true });
  return { id: ref.id, externalId, created: !snapshot.exists };
};

const deleteApiTask = async (apiKey, projectExternalId, taskExternalId) => {
  const context = await requireApiProject(apiKey, projectExternalId);
  const externalId = cleanText(taskExternalId, 160);
  const ref = db.doc(`tasks/${stableDocumentId(context.projectId, `task:${externalId}`)}`);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data().integration?.apiKeyId !== apiKey.keyId) {
    throw new HttpsError("not-found", "Task not found.");
  }
  await ref.delete();
  return { deleted: true, externalId };
};

const upsertApiTeamMember = async (apiKey, externalIdValue, body) => {
  const externalId = cleanText(externalIdValue, 160);
  const name = cleanText(body.name, 160);
  const email = normalizeContactEmail(body.email);
  if (!externalId || !name || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "External ID, name, and a valid email are required.");
  }
  const ref = db.doc(`employees/${stableDocumentId(apiKey.keyId, `team:${externalId}`)}`);
  const snapshot = await ref.get();
  const existing = snapshot.data() || {};
  await ref.set({
    name,
    email,
    phone: cleanText(body.phone, 40),
    role: cleanText(body.role, 80),
    department: cleanText(body.department, 120),
    skills: Array.isArray(body.skills)
      ? body.skills.slice(0, 100).map((skill) => cleanText(skill, 120)).filter(Boolean)
      : existing.skills || [],
    createdBy: existing.createdBy || apiKey.createdBy,
    createdAt: existing.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now(),
    integration: { apiKeyId: apiKey.keyId, externalId },
  }, { merge: true });
  return {
    id: ref.id,
    externalId,
    created: !snapshot.exists,
    workspaceLoginCreated: false,
  };
};

const deleteApiTeamMember = async (apiKey, externalIdValue) => {
  const externalId = cleanText(externalIdValue, 160);
  const ref = db.doc(`employees/${stableDocumentId(apiKey.keyId, `team:${externalId}`)}`);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data().integration?.apiKeyId !== apiKey.keyId) {
    throw new HttpsError("not-found", "Team member not found.");
  }
  await ref.delete();
  return { deleted: true, externalId };
};

export const projectSyncApi = onRequest(
  { region, cors: true, timeoutSeconds: 120, maxInstances: 10 },
  async (request, response) => {
    if (request.method === "OPTIONS") return response.status(204).send("");
    if (request.method === "GET" && request.path === "/v1/health") {
      return response.json({ ok: true, service: "asc-os-project-api", version: 2 });
    }
    const apiKey = await authenticateApiRequest(request);
    if (!apiKey) return sendApiError(response, 401, "unauthorized", "A valid Bearer API key is required.");
    try {
      const segments = request.path
        .split("/")
        .filter(Boolean)
        .map((segment) => decodeURIComponent(segment));

      if (request.method === "GET" && request.path === "/v1/templates") {
        return response.json({ ok: true, data: { templates: projectTemplates } });
      }
      if (request.method === "GET" && request.path === "/v1/categories") {
        const snapshot = await db.collection("categories").orderBy("name").get();
        return response.json({
          ok: true,
          data: {
            categories: snapshot.docs.map((document) =>
              serializeApiValue({ id: document.id, ...document.data() })
            ),
          },
        });
      }
      if (request.method === "GET" && request.path === "/v1/team-members") {
        const snapshot = await db
          .collection("employees")
          .where("integration.apiKeyId", "==", apiKey.keyId)
          .get();
        return response.json({
          ok: true,
          data: {
            teamMembers: snapshot.docs.map((document) =>
              serializeApiValue({ id: document.id, ...document.data() })
            ),
          },
        });
      }
      if (
        ["PUT", "DELETE"].includes(request.method) &&
        segments.length === 3 &&
        segments[0] === "v1" &&
        segments[1] === "team-members"
      ) {
        const result = request.method === "PUT"
          ? await upsertApiTeamMember(apiKey, segments[2], request.body || {})
          : await deleteApiTeamMember(apiKey, segments[2]);
        return response.status(result.created ? 201 : 200).json({ ok: true, data: result });
      }
      if (request.method === "GET" && request.path === "/v1/projects") {
        const snapshot = await db
          .collection("projects")
          .where("integration.apiKeyId", "==", apiKey.keyId)
          .get();
        return response.json({
          ok: true,
          data: {
            projects: snapshot.docs.map((document) =>
              serializeApiValue({ id: document.id, ...document.data() })
            ),
          },
        });
      }
      if (request.method === "POST" && request.path === "/v1/projects/sync") {
        const result = await syncProjectManifest(apiKey, request.body || {});
        return response.status(200).json({ ok: true, data: result });
      }
      if (
        segments.length >= 3 &&
        segments[0] === "v1" &&
        segments[1] === "projects"
      ) {
        const projectExternalId = segments[2];
        if (segments.length === 3 && request.method === "GET") {
          const graph = await getApiProjectGraph(apiKey, projectExternalId);
          return response.json({
            ok: true,
            data: serializeApiValue({
              project: { id: graph.projectId, ...graph.project },
              milestones: graph.milestones,
              tasks: graph.tasks,
            }),
          });
        }
        if (segments.length === 3 && request.method === "PATCH") {
          return response.json({
            ok: true,
            data: await patchApiProject(apiKey, projectExternalId, request.body || {}),
          });
        }
        if (
          segments.length === 4 &&
          segments[3] === "insights" &&
          request.method === "GET"
        ) {
          const graph = await getApiProjectGraph(apiKey, projectExternalId);
          return response.json({
            ok: true,
            data: calculateProjectInsights({
              project: graph.project,
              milestones: graph.milestones,
              tasks: graph.tasks,
            }),
          });
        }
        if (
          segments.length === 5 &&
          segments[3] === "milestones" &&
          ["PUT", "DELETE"].includes(request.method)
        ) {
          const result = request.method === "PUT"
            ? await upsertApiMilestone(
                apiKey,
                projectExternalId,
                segments[4],
                request.body || {}
              )
            : await deleteApiMilestone(apiKey, projectExternalId, segments[4]);
          return response.status(result.created ? 201 : 200).json({ ok: true, data: result });
        }
        if (
          segments.length === 5 &&
          segments[3] === "tasks" &&
          ["PUT", "DELETE"].includes(request.method)
        ) {
          const result = request.method === "PUT"
            ? await upsertApiTask(
                apiKey,
                projectExternalId,
                segments[4],
                request.body || {}
              )
            : await deleteApiTask(apiKey, projectExternalId, segments[4]);
          return response.status(result.created ? 201 : 200).json({ ok: true, data: result });
        }
      }
      return sendApiError(response, 404, "not_found", "API route not found.");
    } catch (error) {
      console.error("Project sync failed:", error);
      const invalid = error instanceof HttpsError && error.code === "invalid-argument";
      const forbidden = error instanceof HttpsError && error.code === "permission-denied";
      const missing = error instanceof HttpsError && error.code === "not-found";
      const conflict = error instanceof HttpsError && error.code === "already-exists";
      return sendApiError(
        response,
        invalid ? 400 : forbidden ? 403 : missing ? 404 : conflict ? 409 : 500,
        error.code || "internal",
        invalid || forbidden || missing || conflict
          ? error.message
          : "Project API request failed."
      );
    }
  }
);

export const removeClientFromProject = onCall({ region }, async (request) => {
  await requireTeam(request);
  const projectId = String(request.data?.projectId || "");
  const clientUid = String(request.data?.clientUid || "");
  if (!projectId || !clientUid) {
    throw new HttpsError("invalid-argument", "Project and client are required.");
  }
  const projectRef = db.doc(`projects/${projectId}`);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(projectRef);
    if (!snapshot.exists) throw new HttpsError("not-found", "Project not found.");
    const project = snapshot.data();
    transaction.update(projectRef, {
      clients: (project.clients || []).filter((client) => client.uid !== clientUid),
      clientUserIds: (project.clientUserIds || []).filter((uid) => uid !== clientUid),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.delete(db.doc(`projects/${projectId}/clients/${clientUid}`));
  });
  return { removed: true };
});

export const addTaskComment = onCall({ region }, async (request) => {
  const uid = requireAuth(request);
  const taskId = String(request.data?.taskId || "");
  const text = String(request.data?.text || "").trim();
  const parentId = request.data?.parentId ? String(request.data.parentId) : null;
  if (!taskId || !text || text.length > 4000) {
    throw new HttpsError("invalid-argument", "Enter a comment up to 4,000 characters.");
  }

  const [profile, taskSnapshot] = await Promise.all([
    getProfile(uid),
    db.doc(`tasks/${taskId}`).get(),
  ]);
  if (!profile || !taskSnapshot.exists) throw new HttpsError("not-found", "Task not found.");
  const task = taskSnapshot.data();
  const projectSnapshot = await db.doc(`projects/${task.projectId}`).get();
  const project = projectSnapshot.data();
  const canComment = ["admin", "team"].includes(profile.role)
    || (project?.clientUserIds || []).includes(uid);
  if (!canComment) throw new HttpsError("permission-denied", "Project access is required.");

  const comment = {
    id: db.collection("_ids").doc().id,
    text,
    userId: uid,
    userName: profile.displayName || profile.contactEmail || "Portal user",
    role: profile.role,
    parentId,
    createdAt: new Date().toISOString(),
  };

  await db.runTransaction(async (transaction) => {
    const latestTask = await transaction.get(taskSnapshot.ref);
    const comments = latestTask.data().comments || [];
    transaction.update(taskSnapshot.ref, {
      comments: [...comments.slice(-199), comment],
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  const clientRecipients = (project?.clientUserIds || []).filter(
    (recipientId) => recipientId !== uid
  );
  await queueNotification({
    recipientIds: clientRecipients,
    title: `New comment on ${task.name}`,
    body: `${comment.userName}: ${text.slice(0, 140)}`,
    type: "task_comment",
    projectId: task.projectId,
    taskId,
  });
  await queueNotification({
    recipientIds: task.createdBy && task.createdBy !== uid ? [task.createdBy] : [],
    title: `New comment on ${task.name}`,
    body: `${comment.userName}: ${text.slice(0, 140)}`,
    type: "task_comment",
    projectId: task.projectId,
    taskId,
    route: `/projects/${task.projectId}`,
  });
  return { comment };
});

export const deleteProjectCascade = onCall({ region, timeoutSeconds: 120 }, async (request) => {
  await requireTeam(request);
  const projectId = String(request.data?.projectId || "");
  if (!projectId) throw new HttpsError("invalid-argument", "Project ID is required.");

  const collections = ["tasks", "milestones", "notifications"];
  for (const collectionName of collections) {
    const field = collectionName === "notifications" ? "projectId" : "projectId";
    const snapshot = await db.collection(collectionName).where(field, "==", projectId).get();
    for (let offset = 0; offset < snapshot.docs.length; offset += 450) {
      const batch = db.batch();
      snapshot.docs.slice(offset, offset + 450).forEach((document) => batch.delete(document.ref));
      await batch.commit();
    }
  }
  const clientMemberships = await db.collection(`projects/${projectId}/clients`).get();
  for (let offset = 0; offset < clientMemberships.docs.length; offset += 450) {
    const batch = db.batch();
    clientMemberships.docs.slice(offset, offset + 450)
      .forEach((membership) => batch.delete(membership.ref));
    await batch.commit();
  }
  await db.doc(`projects/${projectId}`).delete();
  return { deleted: true };
});

export const onTaskUpdated = onDocumentUpdated(
  { document: "tasks/{taskId}", region },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (before.status === after.status && before.assignedTo === after.assignedTo) return;
    const project = (await db.doc(`projects/${after.projectId}`).get()).data();
    const statusChanged = before.status !== after.status;
    await queueNotification({
      recipientIds: project?.clientUserIds || [],
      title: statusChanged ? `Task moved to ${after.status}` : "Task assignment updated",
      body: `${after.name} · ${project?.name || "Project"}`,
      type: statusChanged ? "task_status_changed" : "task_assigned",
      projectId: after.projectId,
      taskId: event.params.taskId,
    });
    const teamRecipients = new Set([after.createdBy].filter(Boolean));
    if (after.assignedToEmail) {
      try {
        const assignee = await auth.getUserByEmail(after.assignedToEmail.toLowerCase());
        teamRecipients.add(assignee.uid);
      } catch (error) {
        if (error.code !== "auth/user-not-found") throw error;
      }
    }
    await queueNotification({
      recipientIds: [...teamRecipients],
      title: statusChanged ? `Task moved to ${after.status}` : "Task assignment updated",
      body: `${after.name} · ${project?.name || "Project"}`,
      type: statusChanged ? "task_status_changed" : "task_assigned",
      projectId: after.projectId,
      taskId: event.params.taskId,
      route: `/projects/${after.projectId}`,
    });
  }
);

export const onProjectUpdated = onDocumentUpdated(
  { document: "projects/{projectId}", region },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (before.status === after.status) return;
    await queueNotification({
      recipientIds: after.clientUserIds || [],
      title: `${after.name} is now ${after.status}`,
      body: "Open your portal for the latest project progress.",
      type: "project_status_changed",
      projectId: event.params.projectId,
    });
  }
);

export const deliverNotification = onDocumentCreated(
  { document: "notifications/{notificationId}", region },
  async (event) => {
    const notification = event.data.data();
    const recipientIds = notification.recipientIds || [];
    const tokenDocuments = [];
    const profiles = [];

    for (const recipientId of recipientIds) {
      const [devices, profile] = await Promise.all([
        db.collection(`users/${recipientId}/devices`).get(),
        db.doc(`users/${recipientId}`).get(),
      ]);
      devices.docs.forEach((device) => tokenDocuments.push(device));
      if (profile.exists) profiles.push(profile.data());
    }

    const tokens = tokenDocuments.map((device) => device.data().token).filter(Boolean);
    for (let offset = 0; offset < tokens.length; offset += 500) {
      const tokenChunk = tokens.slice(offset, offset + 500);
      const response = await messaging.sendEachForMulticast({
        tokens: tokenChunk,
        notification: { title: notification.title, body: notification.body },
        data: {
          route: notification.route || "/",
          notificationId: event.params.notificationId,
          type: notification.type || "update",
        },
        webpush: { fcmOptions: { link: notification.route || "/" } },
      });
      const invalid = new Set(["messaging/invalid-registration-token", "messaging/registration-token-not-registered"]);
      const cleanup = db.batch();
      let cleanupCount = 0;
      response.responses.forEach((result, index) => {
        if (!result.success && invalid.has(result.error?.code)) {
          const token = tokenChunk[index];
          tokenDocuments.filter((document) => document.data().token === token)
            .forEach((document) => {
              cleanup.delete(document.ref);
              cleanupCount += 1;
            });
        }
      });
      if (cleanupCount > 0) await cleanup.commit();
    }

    const emailRecipients = profiles
      .filter((profile) => profile.notificationPreferences?.email !== false)
      .map((profile) => profile.contactEmail || profile.email)
      .filter(Boolean);
    if (emailRecipients.length) {
      await db.collection("mail").add({
        to: emailRecipients,
        message: {
          subject: notification.title,
          text: notification.body,
          html: `<h2>${escapeHtml(notification.title)}</h2><p>${escapeHtml(notification.body)}</p>`,
        },
      });
    }
  }
);

export const sendDueDateReminders = onSchedule(
  { schedule: "every day 09:00", timeZone: "Asia/Kolkata", region },
  async () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    const tasks = await db
      .collection("tasks")
      .where("dueDate", "<=", Timestamp.fromDate(tomorrow))
      .get();

    for (const taskDocument of tasks.docs) {
      const task = taskDocument.data();
      if (task.status === "completed") continue;
      const dueDate = task.dueDate?.toDate?.();
      if (!dueDate) continue;
      const project = (await db.doc(`projects/${task.projectId}`).get()).data();
      const dayKey = now.toISOString().slice(0, 10);
      const notificationId = `${taskDocument.id}_due_${dayKey}`;
      const commonNotification = {
        title: dueDate < now ? `Overdue: ${task.name}` : `Due soon: ${task.name}`,
        body: `${project?.name || "Project"} · due ${dueDate.toLocaleDateString("en-IN")}`,
        type: dueDate < now ? "task_overdue" : "task_due_soon",
        projectId: task.projectId,
        taskId: taskDocument.id,
        readBy: [],
        createdAt: FieldValue.serverTimestamp(),
      };
      if (project?.clientUserIds?.length) {
        await db.doc(`notifications/${notificationId}_clients`).set(
          {
            ...commonNotification,
            recipientIds: project.clientUserIds,
            route: `/client/projects/${task.projectId}`,
          },
          { merge: false }
        );
      }
      if (task.createdBy) {
        await db.doc(`notifications/${notificationId}_team`).set(
          {
            ...commonNotification,
            recipientIds: [task.createdBy],
            route: `/projects/${task.projectId}`,
          },
          { merge: false }
        );
      }
    }
  }
);
