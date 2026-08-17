#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";

const root = process.cwd();
const orbitDir = join(root, ".orbit");
const manifestPath = join(orbitDir, "project.json");
const statePath = join(orbitDir, "state.json");
const localConfigPath = join(orbitDir, "config.local.json");
const defaultEndpoint = "https://asia-south1-learntospeak-b7404.cloudfunctions.net/projectSyncApi";

const readJson = (path, fallback = null) => {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
};
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const runGit = (args, fallback = "") => {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return fallback;
  }
};
const slug = (value) => String(value || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const task = (externalId, name, milestoneExternalId, extras = {}) => ({
  externalId,
  name,
  milestoneExternalId,
  status: "pending",
  priority: "medium",
  ...extras,
});

const detectProject = () => {
  const packageJson = readJson(join(root, "package.json"), {});
  const readme = existsSync(join(root, "README.md")) ? readFileSync(join(root, "README.md"), "utf8") : "";
  const readmeTitle = readme.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const remoteUrl = runGit(["remote", "get-url", "origin"]);
  const repositoryName = remoteUrl.match(/\/([^/]+?)(?:\.git)?$/)?.[1];
  const name = packageJson.name || readmeTitle || repositoryName || basename(root);
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const stack = Object.keys(dependencies);
  return {
    name,
    description: packageJson.description || readme.split("\n\n").find((part) => part && !part.startsWith("#"))?.slice(0, 500) || "",
    packageJson,
    stack,
    repository: {
      url: remoteUrl,
      branch: runGit(["branch", "--show-current"], "main"),
      provider: remoteUrl.includes("github.com") ? "github" : remoteUrl.includes("gitlab.com") ? "gitlab" : "git",
      lastCommit: runGit(["rev-parse", "HEAD"]),
    },
  };
};

const createTemplate = () => {
  const detected = detectProject();
  const projectId = slug(detected.name);
  const tasks = [
    task("DISC-01", "Define project goals and success metrics", "discovery", { priority: "high", category: "Planning & Analysis" }),
    task("DISC-02", "Document users, stakeholders and requirements", "discovery", { priority: "high", category: "Planning & Analysis" }),
    task("DISC-03", "Identify risks, dependencies and delivery constraints", "discovery", { category: "Planning & Analysis" }),
    task("FOUND-01", "Confirm architecture and technical decisions", "foundation", { priority: "high", category: "Design & Architecture" }),
    task("FOUND-02", "Configure local development environment", "foundation", { category: "Development" }),
    task("FOUND-03", "Define data model and integration contracts", "foundation", { category: "Design & Architecture" }),
    task("BUILD-01", "Implement the primary user workflow", "implementation", { priority: "high", category: "Development" }),
    task("BUILD-02", "Implement navigation, responsive UI and accessibility", "implementation", { category: "Development" }),
    task("BUILD-03", "Implement persistence and external integrations", "implementation", { priority: "high", category: "Development" }),
    task("QA-01", "Add automated unit and integration tests", "quality", { priority: "high", category: "Testing & Quality Assurance" }),
    task("QA-02", "Run security, privacy and dependency review", "quality", { priority: "high", category: "Testing & Quality Assurance" }),
    task("QA-03", "Complete documentation and acceptance testing", "quality", { category: "Testing & Quality Assurance" }),
    task("REL-01", "Configure CI/CD and production environment", "release", { priority: "high", category: "Deployment & Maintenance" }),
    task("REL-02", "Deploy production release and run smoke tests", "release", { priority: "high", category: "Deployment & Maintenance" }),
    task("REL-03", "Configure monitoring and post-release review", "release", { category: "Deployment & Maintenance" }),
  ];
  if (detected.stack.some((item) => /firebase|supabase|auth|passport|oauth/i.test(item))) {
    tasks.splice(8, 0, task("BUILD-AUTH", "Implement authentication and authorization boundaries", "implementation", { priority: "high", category: "Development" }));
  }
  if (detected.stack.some((item) => /react|vue|svelte|angular|next/i.test(item))) {
    tasks.splice(8, 0, task("BUILD-UI", "Build reusable UI components and application states", "implementation", { category: "Development" }));
  }
  return {
    schemaVersion: 1,
    externalId: projectId,
    name: detected.name,
    description: detected.description,
    status: "planning",
    priority: "medium",
    replace: true,
    repository: detected.repository,
    milestones: [
      { externalId: "discovery", name: "Discovery & Scope", status: "upcoming" },
      { externalId: "foundation", name: "Architecture & Foundation", status: "upcoming" },
      { externalId: "implementation", name: "Core Implementation", status: "upcoming" },
      { externalId: "quality", name: "Quality & Acceptance", status: "upcoming" },
      { externalId: "release", name: "Production Release", status: "upcoming" },
    ],
    tasks,
    clients: [],
  };
};

const ensureIgnored = () => {
  const ignorePath = join(root, ".gitignore");
  const localOnlyFiles = [".orbit/config.local.json", ".orbit/state.json"];
  let current = existsSync(ignorePath) ? readFileSync(ignorePath, "utf8") : "";
  const ignored = new Set(current.split(/\r?\n/));
  for (const line of localOnlyFiles) {
    if (!ignored.has(line)) {
      current = `${current}${current && !current.endsWith("\n") ? "\n" : ""}${line}\n`;
      ignored.add(line);
    }
  }
  writeFileSync(ignorePath, current);
};

const init = (force = false) => {
  mkdirSync(orbitDir, { recursive: true });
  if (existsSync(manifestPath) && !force) throw new Error(`${manifestPath} already exists. Use init --force to replace it.`);
  const manifest = createTemplate();
  writeJson(manifestPath, manifest);
  writeJson(statePath, { lastCommit: manifest.repository.lastCommit || null, lastSyncedAt: null });
  ensureIgnored();
  process.stdout.write(`Created ${manifestPath} with ${manifest.milestones.length} milestones and ${manifest.tasks.length} tasks.\nReview it, then run: node .orbit/orbit-pm.mjs configure\n`);
};

const configure = async (providedToken) => {
  mkdirSync(orbitDir, { recursive: true });
  let token = providedToken;
  if (!token) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    token = (await prompt.question("ASC-OS API key: ")).trim();
    prompt.close();
  }
  if (!/^orbit_sk_[a-f0-9]{16}_[A-Za-z0-9_-]{40,}$/.test(token || "")) throw new Error("That does not look like an ASC-OS API key.");
  writeJson(localConfigPath, { apiKey: token, endpoint: defaultEndpoint });
  ensureIgnored();
  process.stdout.write(`Stored the key locally in ${localConfigPath}. This file is excluded from Git.\n`);
};

const completionIdsFromCommits = (lastCommit) => {
  if (!lastCommit) return [];
  const subjects = runGit(["log", `${lastCommit}..HEAD`, "--format=%s"]);
  return [...subjects.matchAll(/\[done:([A-Za-z0-9._-]+)\]/gi)].map((match) => match[1].toLowerCase());
};

const updateCalculatedStatuses = (manifest) => {
  for (const milestone of manifest.milestones || []) {
    const milestoneTasks = (manifest.tasks || []).filter((item) => item.milestoneExternalId === milestone.externalId);
    if (milestoneTasks.length && milestoneTasks.every((item) => item.status === "completed")) milestone.status = "completed";
    else if (milestoneTasks.some((item) => item.status !== "pending")) milestone.status = "in-progress";
    else milestone.status = "upcoming";
  }
  if (manifest.tasks?.length && manifest.tasks.every((item) => item.status === "completed")) manifest.status = "completed";
  else if (manifest.tasks?.some((item) => item.status !== "pending")) manifest.status = "in-progress";
  else manifest.status = "planning";
};

const markComplete = (manifest, ids) => {
  const normalizedIds = new Set(ids.map((id) => id.toLowerCase()));
  let changed = 0;
  for (const item of manifest.tasks || []) {
    if (normalizedIds.has(String(item.externalId).toLowerCase()) && item.status !== "completed") {
      item.status = "completed";
      item.completedAt = new Date().toISOString();
      changed += 1;
    }
  }
  updateCalculatedStatuses(manifest);
  return changed;
};

const sync = async () => {
  const manifest = readJson(manifestPath);
  if (!manifest) throw new Error(`Run init first; ${manifestPath} does not exist.`);
  const localConfig = readJson(localConfigPath, {});
  const apiKey = process.env.ORBIT_API_KEY || localConfig.apiKey;
  const endpoint = process.env.ORBIT_API_ENDPOINT || localConfig.endpoint || defaultEndpoint;
  if (!apiKey) throw new Error("Run configure or set ORBIT_API_KEY before syncing.");
  const state = readJson(statePath, {});
  const completedFromCommits = completionIdsFromCommits(state.lastCommit);
  const changed = markComplete(manifest, completedFromCommits);
  const detected = detectProject();
  manifest.repository = detected.repository;
  writeJson(manifestPath, manifest);

  const response = await fetch(`${endpoint.replace(/\/$/, "")}/v1/projects/sync`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify(manifest),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Sync failed with HTTP ${response.status}.`);
  writeJson(statePath, { lastCommit: detected.repository.lastCommit || state.lastCommit, lastSyncedAt: payload.data.syncedAt, projectId: payload.data.projectId });
  process.stdout.write(`Synced ${manifest.name}: ${payload.data.counts.tasks} tasks, ${payload.data.progress}% complete${changed ? ` (${changed} completed from commits)` : ""}.\n`);
  const newCredentials = (payload.data.clientCredentials || []).filter((item) => item.temporaryPassword);
  if (newCredentials.length) {
    process.stdout.write("New client credentials (shown once):\n");
    newCredentials.forEach((item) => process.stdout.write(`  ${item.email}: ${item.clientId} / ${item.temporaryPassword}\n`));
  }
};

const complete = async (ids) => {
  const manifest = readJson(manifestPath);
  if (!manifest) throw new Error("Run init first.");
  if (!ids.length) throw new Error("Provide one or more task IDs, for example: complete AUTH-01.");
  const changed = markComplete(manifest, ids);
  if (!changed) throw new Error("No matching incomplete tasks were found.");
  writeJson(manifestPath, manifest);
  await sync();
};

const installHook = () => {
  const gitDir = runGit(["rev-parse", "--git-dir"]);
  if (!gitDir) throw new Error("This is not a Git repository.");
  const hookPath = resolve(root, gitDir, "hooks", "pre-push");
  mkdirSync(dirname(hookPath), { recursive: true });
  const marker = "# orbit-project-sync";
  const current = existsSync(hookPath) ? readFileSync(hookPath, "utf8") : "#!/bin/sh\n";
  if (!current.includes(marker)) {
    const block = `\n${marker}\nnode .orbit/orbit-pm.mjs sync || exit 1\n`;
    writeFileSync(hookPath, `${current.replace(/\s*$/, "\n")}${block}`, { mode: 0o755 });
  }
  process.stdout.write(`Installed ASC-OS sync in ${hookPath}. VS Code pushes will now sync before sending commits.\n`);
};

const [command = "help", ...args] = process.argv.slice(2);
try {
  if (command === "init") init(args.includes("--force"));
  else if (command === "configure") await configure(args[0]);
  else if (command === "sync") await sync();
  else if (command === "complete") await complete(args);
  else if (command === "install-hook") installHook();
  else {
    process.stdout.write("ASC-OS PM CLI\n\nCommands:\n  init [--force]       Generate .orbit/project.json\n  configure [api-key]  Store the API key locally\n  sync                 Sync the manifest and commit completion markers\n  complete TASK-ID     Complete tasks and sync immediately\n  install-hook         Sync automatically before Git/VS Code pushes\n");
  }
} catch (error) {
  process.stderr.write(`ASC-OS sync error: ${error.message}\n`);
  process.exitCode = 1;
}
