import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import {
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { getApp } from "firebase/app";

const tokenId = async (token) => {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const registerPushDevice = async (userId) => {
  if (!(await isSupported()) || !("serviceWorker" in navigator)) {
    throw new Error("Push notifications are not supported in this browser.");
  }
  if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
    throw new Error("Push notifications have not been configured yet.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { permission, token: null };

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );
  const messaging = getMessaging(getApp());
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("The browser did not return a push token.");

  const deviceId = await tokenId(token);
  await setDoc(
    doc(db, "users", userId, "devices", deviceId),
    {
      token,
      platform: navigator.platform || "web",
      userAgent: navigator.userAgent,
      enabled: true,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    },
    { merge: true }
  );
  return { permission, token };
};

export const listenForForegroundMessages = async (callback) => {
  if (!(await isSupported())) return () => {};
  return onMessage(getMessaging(getApp()), callback);
};

export const subscribeToNotifications = (userId, callback, onError) => {
  const notificationsQuery = query(
    collection(db, "notifications"),
    where("recipientIds", "array-contains", userId),
    orderBy("createdAt", "desc"),
    limit(30)
  );
  return onSnapshot(
    notificationsQuery,
    (snapshot) =>
      callback(
        snapshot.docs.map((notification) => ({
          id: notification.id,
          ...notification.data(),
        }))
      ),
    onError
  );
};

export const markNotificationRead = async (notificationId, userId) => {
  await updateDoc(doc(db, "notifications", notificationId), {
    readBy: arrayUnion(userId),
  });
};
