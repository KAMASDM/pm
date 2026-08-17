# Orbit Projects

Orbit Projects is a secure, multi-tenant project-delivery workspace for internal teams and external clients. Team members manage projects, tasks, milestones, templates, employees, and client access. Clients receive a private portal ID and temporary password, change that password on first use, and can access only projects explicitly assigned to their Firebase UID.

## Production architecture

- React 19, Vite, Material UI, and route-level code splitting
- Firebase Authentication: Google for team accounts; portal ID/password for clients
- Cloud Firestore with deny-by-default tenant security rules
- Cloud Functions using the Admin SDK for privileged account and cascade operations
- Firebase Cloud Messaging for foreground/background web push
- In-app notification center backed by Firestore
- Scheduled due-date reminders
- Optional email delivery through Firebase's Trigger Email extension
- Firestore emulator security tests

Client passwords are never stored in Firestore. A synthetic Firebase Auth email is derived from the client ID internally; the client's real contact email is stored only in their private user/project membership documents.

## Local setup

1. Copy `.env.example` to `.env` and fill in the Firebase web configuration.
2. In Firebase Authentication, enable **Google** and **Email/Password** providers.
3. In Firebase Cloud Messaging, create a Web Push certificate and set `VITE_FIREBASE_VAPID_KEY`.
4. Install and run:

   ```bash
   npm ci
   npm run dev
   ```

The frontend requires Node 22 for parity with the production Functions runtime.

## Firebase deployment

Select the correct Firebase project explicitly before deploying:

```bash
npx firebase-tools use --add
npm --prefix functions ci
npm run test
npm run build
npx firebase-tools deploy --only firestore:rules,firestore:indexes,functions,hosting
```

Set the same client auth domain for Functions and the frontend. Copy `functions/.env.example` to `functions/.env.<firebase-project-id>` before deployment.

Cloud Functions and scheduled reminders require a billing-enabled Firebase project. Push notifications require HTTPS outside localhost.

## Bootstrap the first administrator

1. Sign in once with the intended administrator's Google account. The access-pending screen is expected.
2. Authenticate Application Default Credentials locally:

   ```bash
   gcloud auth application-default login
   ```

3. Grant the account administrator access:

   ```bash
   npm --prefix functions run set-admin -- admin@example.com
   ```

4. Sign out and back in so refreshed claims/profile state are loaded.

Unknown Google accounts fail closed and cannot read or modify workspace data.

## Existing-data migration

The migration normalizes dates, assignment IDs, team-member display snapshots, and existing client memberships. It is a dry run unless `--apply` is supplied:

```bash
npm --prefix functions run migrate
npm --prefix functions run migrate -- --apply
```

Back up Firestore before applying a production migration. Legacy client records without a provisioned user account must be opened by a team administrator and provisioned from the project's Clients tab.

## Client onboarding

1. A team member adds a client while creating a project or from the Clients tab.
2. The callable Function creates or reuses the client's Auth account and updates project membership atomically.
3. A client ID and one-time temporary password are displayed once to the team member.
4. If the Trigger Email extension is installed, the same credentials are sent to the contact email.
5. The client signs in through **Client portal** and must create a 12+ character private password.
6. Firestore rules and membership-scoped queries restrict the client to assigned projects and their tasks/milestones.

Removing a client from a project immediately removes that project's UID membership. Their account remains available if it belongs to another project.

## Notifications

The app stores browser device tokens under each user's private `devices` subcollection. Notification documents are delivered by FCM and appear in the navbar notification center. Triggers cover:

- Project status changes
- Task status and assignment changes
- Task comments
- Client onboarding
- Due-soon and overdue reminders

Users are asked for browser notification permission only after interacting with the notification bell. Granted tokens are refreshed on later sessions, and invalid tokens are removed by the delivery Function.

For email, install Firebase's **Trigger Email** extension and configure it to watch the `mail` collection. Client applications cannot read or write that collection.

## Quality gates

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev
node --check functions/src/index.js
```

Security-rule tests prove that clients cannot read another client's project/task, cannot mutate project/task data, and can modify only the `readBy` field of their own notifications.

## Important collections

- `users/{uid}` — role, client ID, private contact profile, password-change state
- `users/{uid}/devices/{deviceId}` — private FCM registration tokens
- `projects/{projectId}` — project and authorized `clientUserIds`
- `projects/{projectId}/clients/{uid}` — private client membership/contact record
- `tasks/{taskId}` and `milestones/{milestoneId}` — project-linked delivery data
- `notifications/{id}` — user-targeted in-app/push events
- `mail/{id}` — server-only Trigger Email queue

Never weaken `firestore.rules` to work around a query. Queries and data models must satisfy the tenant boundary, not bypass it.
