# Legacy client-login notes

> This Google-email login flow has been replaced. Production clients now receive a portal client ID and temporary password and must change the password on first login. Follow `README.md` for the current workflow.

# Client Login & Access Guide

## How Clients Login

### 1. **Registration Process**
Clients are added to projects by team members in two ways:

#### Option A: During Project Creation
- Navigate to "Create Project"
- Complete steps 1-2 (Basic Info & Categories)
- Step 3 is "Add Clients"
- Click "Add Client" button
- Fill in the dialog with:
  - Client Name (required)
  - Email Address (required) - **This is the key for login**
  - Company (optional)
- Click "Add Client" to save

#### Option B: In Existing Project
- Open any project details page
- Click on the "Clients" tab (second tab after Milestones)
- Click "Add Client" button
- Fill in the same information as above
- Click "Add Client" to save

### 2. **How Clients Actually Login**

Clients login using **Google Sign-In** with the email address you registered for them:

1. **Client visits the application URL**
2. **Clicks "Sign in with Google"** on the login page
3. **Must sign in with the exact email** that was registered in the project
4. **System automatically detects** they are a client (by checking their email against all project client lists)
5. **Redirected to Client Dashboard** - a simplified, read-only view

### 3. **Important Notes**

- ✅ **Email is the identifier**: The email address you enter when adding a client MUST match their Google account email
- ✅ **No separate registration**: Clients don't need to "sign up" - they just login with Google
- ✅ **Automatic role detection**: When they login, the system checks if their email exists in any project's client list
- ✅ **Read-only access**: Clients can only view projects they're assigned to, not edit anything
- ✅ **Email notifications**: Clients will receive email notifications about project updates (if email service is configured)

### 4. **What Clients Can See**

After logging in, clients have access to:
- **Client Dashboard**: Overview of all projects they're assigned to
- **Project Details**: View project progress, milestones, and status
- **Task Updates**: See task completions and progress
- **Recent Activity**: Track what's happening in their projects

### 5. **What Clients CANNOT Do**

Clients have restricted access:
- ❌ Cannot create or edit projects
- ❌ Cannot create or edit tasks
- ❌ Cannot add/remove team members
- ❌ Cannot access team dashboard or admin features
- ❌ Cannot see projects they're not assigned to

### 6. **Troubleshooting**

**Problem**: Client can't login
- ✅ Verify they're using the exact email address registered in the project
- ✅ Confirm they're using Google Sign-In (not email/password)
- ✅ Check that their email was saved correctly in the project's client list

**Problem**: Client doesn't see their project
- ✅ Verify they were added to that specific project
- ✅ Check that the email matches exactly (case-insensitive)
- ✅ Try logging out and back in

**Problem**: Client sees team member features
- ✅ Check if their email also exists in the employees/team list
- ✅ Team member emails take precedence over client emails

## Technical Details

### Role Detection Logic (AuthProvider.jsx)
```javascript
// System checks all projects for the user's email
const clientProjects = allProjects.filter((project) =>
  (project.clients || []).some(
    (client) => client.email?.toLowerCase() === userEmail.toLowerCase()
  )
);

// If found in any project's client list → isClient = true
// This automatically gives them client dashboard access
```

### Security
- Firebase Authentication handles login security
- Role-based routing prevents unauthorized access
- Client emails are stored in Firestore with the project document
- Future: Update Firebase Security Rules to enforce client read-only access at database level

## Summary

**For Team Members**: Add clients by entering their Google account email address
**For Clients**: Just sign in with Google using the email your project manager registered
**System**: Automatically detects role and provides appropriate access level
