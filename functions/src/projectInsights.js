const DAY = 86_400_000;
const toDate = (value) => value?.toDate?.() || (value ? new Date(value) : null);
const iso = (value) => toDate(value)?.toISOString?.() || null;
const daysBetween = (start, end) => Math.max(0, Math.ceil((end - start) / DAY));

export const calculateProjectInsights = ({ project, tasks, milestones }) => {
  const now = new Date();
  const counts = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === "pending").length,
    inProgress: tasks.filter((task) => task.status === "in-progress").length,
    blocked: tasks.filter((task) => task.status === "blocked").length,
    completed: tasks.filter((task) => task.status === "completed").length,
  };
  const progress = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;
  const active = tasks.filter((task) => task.status !== "completed");
  const overdueTasks = active.filter((task) => {
    const dueDate = toDate(task.dueDate);
    return dueDate && dueDate < now;
  });
  const milestoneHealth = milestones.map((milestone) => {
    const milestoneTasks = tasks.filter((task) => task.milestoneId === milestone.id);
    const completed = milestoneTasks.filter((task) => task.status === "completed").length;
    const milestoneProgress = milestoneTasks.length
      ? Math.round((completed / milestoneTasks.length) * 100)
      : 0;
    const dueDate = toDate(milestone.dueDate);
    return {
      id: milestone.id,
      externalId: milestone.integration?.externalId || null,
      name: milestone.name,
      dueDate: iso(dueDate),
      progress: milestoneProgress,
      taskCount: milestoneTasks.length,
      completedTasks: completed,
      overdue: Boolean(dueDate && dueDate < now && milestoneProgress < 100),
    };
  });
  const overdueMilestones = milestoneHealth.filter((milestone) => milestone.overdue);
  const unassigned = active.filter((task) => !task.assignedTo && !task.assignedToEmail).length;
  const missingEstimates = active.filter((task) => !Number(task.estimatedHours)).length;
  const missingDeadlines = active.filter((task) => !toDate(task.dueDate)).length;

  const projectStart = toDate(project.createdAt);
  const projectDue = toDate(project.dueDate);
  let expectedProgress = null;
  let scheduleVariance = null;
  if (projectStart && projectDue && projectDue > projectStart) {
    expectedProgress = Math.max(0, Math.min(100, Math.round(((now - projectStart) / (projectDue - projectStart)) * 100)));
    scheduleVariance = progress - expectedProgress;
  }

  const completionDates = tasks
    .filter((task) => task.status === "completed")
    .map((task) => toDate(task.completedAt || task.updatedAt))
    .filter(Boolean);
  const completedLast14Days = completionDates.filter((date) => now - date <= 14 * DAY).length;
  let velocityPerWeek = completedLast14Days / 2;
  if (!velocityPerWeek && counts.completed && projectStart) {
    velocityPerWeek = counts.completed / Math.max(1, daysBetween(projectStart, now) / 7);
  }
  const remaining = counts.total - counts.completed;
  const forecastDays = velocityPerWeek ? Math.ceil((remaining / velocityPerWeek) * 7) : null;
  const forecastDate = remaining === 0
    ? now
    : forecastDays !== null
      ? new Date(now.getTime() + forecastDays * DAY)
      : null;

  const riskPenalty =
    Math.min(30, overdueTasks.length * 6) +
    Math.min(24, overdueMilestones.length * 12) +
    Math.min(20, counts.blocked * 8) +
    Math.min(10, counts.total ? (unassigned / counts.total) * 10 : 0) +
    Math.min(8, scheduleVariance !== null && scheduleVariance < 0 ? Math.abs(scheduleVariance) / 2 : 0);
  const healthScore = Math.max(0, Math.round(100 - riskPenalty));
  const health = healthScore >= 85 ? "on-track" : healthScore >= 65 ? "needs-attention" : "at-risk";

  const workload = new Map();
  tasks.forEach((task) => {
    const key = task.assignedTo || task.assignedToEmail || "unassigned";
    const row = workload.get(key) || {
      id: key,
      name: task.assignedToName || (key === "unassigned" ? "Unassigned" : task.assignedToEmail || "Team member"),
      active: 0,
      completed: 0,
      overdue: 0,
      estimatedHours: 0,
    };
    if (task.status === "completed") row.completed += 1;
    else row.active += 1;
    if (overdueTasks.some((item) => item.id === task.id)) row.overdue += 1;
    row.estimatedHours += Number(task.estimatedHours) || 0;
    workload.set(key, row);
  });

  const categoryMap = new Map();
  tasks.forEach((task) => {
    const name = task.category || "Uncategorised";
    const row = categoryMap.get(name) || { name, total: 0, completed: 0 };
    row.total += 1;
    if (task.status === "completed") row.completed += 1;
    categoryMap.set(name, row);
  });

  const risks = [];
  if (overdueMilestones.length) risks.push({ severity: "critical", code: "overdue_milestones", count: overdueMilestones.length });
  if (overdueTasks.length) risks.push({ severity: "critical", code: "overdue_tasks", count: overdueTasks.length });
  if (counts.blocked) risks.push({ severity: "critical", code: "blocked_tasks", count: counts.blocked });
  if (scheduleVariance !== null && scheduleVariance < -10) risks.push({ severity: "warning", code: "schedule_variance", value: scheduleVariance });
  if (unassigned) risks.push({ severity: "warning", code: "unassigned_tasks", count: unassigned });
  if (missingDeadlines) risks.push({ severity: "info", code: "missing_deadlines", count: missingDeadlines });
  if (missingEstimates) risks.push({ severity: "info", code: "missing_estimates", count: missingEstimates });

  return {
    generatedAt: now.toISOString(),
    health: { score: healthScore, status: health },
    progress,
    expectedProgress,
    scheduleVariance,
    velocity: { tasksPerWeek: Number(velocityPerWeek.toFixed(2)), completedLast14Days },
    forecast: { date: forecastDate?.toISOString() || null, remainingTasks: remaining },
    tasks: {
      counts,
      overdue: overdueTasks.map((task) => ({ id: task.id, externalId: task.integration?.externalId || null, name: task.name, dueDate: iso(task.dueDate) })),
      unassigned,
      missingDeadlines,
      missingEstimates,
    },
    milestones: milestoneHealth,
    workload: [...workload.values()].sort((a, b) => b.active - a.active),
    categories: [...categoryMap.values()].map((row) => ({ ...row, progress: Math.round((row.completed / row.total) * 100) })),
    risks,
  };
};
