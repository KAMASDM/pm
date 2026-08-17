import { randomBytes } from "node:crypto";
import process from "node:process";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

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

export const provisionClientAccount = onCall({ region }, async (request) => {
  const { uid: actorId } = await requireTeam(request);
  const projectId = String(request.data?.projectId || "");
  const name = String(request.data?.name || "").trim();
  const contactEmail = normalizeContactEmail(request.data?.email);
  const company = String(request.data?.company || "").trim();

  if (!projectId || !name || !contactEmail.includes("@")) {
    throw new HttpsError("invalid-argument", "Project, client name, and email are required.");
  }

  const projectRef = db.doc(`projects/${projectId}`);
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
    if (userRecord.displayName !== name) {
      userRecord = await auth.updateUser(userRecord.uid, { displayName: name });
    }
  } else {
    clientId = await createUniqueClientId();
    temporaryPassword = createTemporaryPassword();
    userRecord = await auth.createUser({
      email: `${clientId.toLowerCase()}@${clientAuthDomain}`,
      password: temporaryPassword,
      displayName: name,
      emailVerified: true,
    });
    await auth.setCustomUserClaims(userRecord.uid, { role: "client" });
    isNewAccount = true;
  }

  const now = Timestamp.now();
  const clientRecord = {
    uid: userRecord.uid,
    id: clientId,
    clientId,
    name,
    company,
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
        displayName: name,
        contactEmail,
        company,
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
        db.doc(`projects/${projectId}/clients/${userRecord.uid}`),
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

  await queueNotification({
    recipientIds: [userRecord.uid],
    title: `Welcome to ${projectSnapshot.data().name}`,
    body: "Your private client workspace is ready.",
    type: "client_provisioned",
    projectId,
  });

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
        subject: "Your Orbit Projects access was reset",
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
