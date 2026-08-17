import process from "node:process";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const identifier = process.argv[2];
if (!identifier) {
  throw new Error("Usage: npm run set-admin -- <firebase-uid-or-google-email>");
}

initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();
const user = identifier.includes("@")
  ? await auth.getUserByEmail(identifier.toLowerCase())
  : await auth.getUser(identifier);

await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), role: "admin" });
await db.doc(`users/${user.uid}`).set(
  {
    role: "admin",
    displayName: user.displayName || user.email,
    email: user.email,
    active: true,
    updatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

process.stdout.write(`Admin access granted to ${user.email || user.uid}. Sign out and back in.\n`);
