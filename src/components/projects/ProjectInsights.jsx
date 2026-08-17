import React, { useMemo } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AnalyticsOutlined,
  AssignmentTurnedInOutlined,
  CalendarMonthOutlined,
  CheckCircleOutline,
  ErrorOutline,
  FlagOutlined,
  GroupsOutlined,
  InsightsOutlined,
  SpeedOutlined,
  TrendingUp,
  WarningAmber,
} from "@mui/icons-material";

const DAY = 86_400_000;
const statusMeta = [
  { key: "completed", label: "Completed", color: "#43A047" },
  { key: "in-progress", label: "In progress", color: "#FB8C00" },
  { key: "pending", label: "Pending", color: "#5C6BC0" },
  { key: "blocked", label: "Blocked", color: "#E53935" },
];

const toDate = (value) => {
  if (!value) return null;
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not set";
};

const daysBetween = (start, end) =>
  Math.max(0, Math.ceil((end.getTime() - start.getTime()) / DAY));

const metricCard = (label, value, detail, icon, color) => (
  <Card variant="outlined" sx={{ height: "100%", boxShadow: "none" }}>
    <CardContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={750} sx={{ mt: 0.5 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {detail}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            bgcolor: `${color}16`,
            color,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const ProjectInsights = ({ project, tasks = [], milestones = [] }) => {
  const insights = useMemo(() => {
    const now = new Date();
    const counts = Object.fromEntries(
      statusMeta.map(({ key }) => [
        key,
        tasks.filter((task) => task.status === key).length,
      ])
    );
    const completed = counts.completed || 0;
    const remaining = Math.max(0, tasks.length - completed);
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const activeTasks = tasks.filter((task) => task.status !== "completed");
    const overdueTasks = activeTasks.filter((task) => {
      const dueDate = toDate(task.dueDate);
      return dueDate && dueDate < now;
    });
    const dueSoonTasks = activeTasks.filter((task) => {
      const dueDate = toDate(task.dueDate);
      return dueDate && dueDate >= now && daysBetween(now, dueDate) <= 14;
    });
    const milestoneRows = milestones
      .map((milestone) => {
        const milestoneTasks = tasks.filter(
          (task) => task.milestoneId === milestone.id
        );
        const milestoneCompleted = milestoneTasks.filter(
          (task) => task.status === "completed"
        ).length;
        const milestoneProgress = milestoneTasks.length
          ? Math.round((milestoneCompleted / milestoneTasks.length) * 100)
          : 0;
        const dueDate = toDate(milestone.dueDate);
        return {
          ...milestone,
          dueDate,
          taskCount: milestoneTasks.length,
          completed: milestoneCompleted,
          progress: milestoneProgress,
          overdue: Boolean(dueDate && dueDate < now && milestoneProgress < 100),
        };
      })
      .sort((a, b) => (a.dueDate?.getTime() || Infinity) - (b.dueDate?.getTime() || Infinity));
    const overdueMilestones = milestoneRows.filter((milestone) => milestone.overdue);
    const unassigned = activeTasks.filter((task) => !task.assignedTo).length;
    const missingEstimates = activeTasks.filter(
      (task) => !Number(task.estimatedHours)
    ).length;
    const missingDeadlines = activeTasks.filter((task) => !toDate(task.dueDate)).length;

    const projectStart = toDate(project.createdAt);
    const projectDue = toDate(project.dueDate);
    let expectedProgress = null;
    let scheduleVariance = null;
    if (projectStart && projectDue && projectDue > projectStart) {
      const totalDuration = projectDue.getTime() - projectStart.getTime();
      expectedProgress = Math.max(
        0,
        Math.min(100, Math.round(((now.getTime() - projectStart.getTime()) / totalDuration) * 100))
      );
      scheduleVariance = progress - expectedProgress;
    }

    const completionDates = tasks
      .filter((task) => task.status === "completed")
      .map((task) => toDate(task.completedAt || task.updatedAt))
      .filter(Boolean);
    const completedLast14 = completionDates.filter(
      (date) => now.getTime() - date.getTime() <= 14 * DAY
    ).length;
    let velocityPerWeek = completedLast14 / 2;
    if (!velocityPerWeek && completed > 0 && projectStart) {
      velocityPerWeek = completed / Math.max(1, daysBetween(projectStart, now) / 7);
    }
    const forecastDays = velocityPerWeek > 0 ? Math.ceil((remaining / velocityPerWeek) * 7) : null;
    const forecastDate =
      remaining === 0
        ? now
        : forecastDays !== null
        ? new Date(now.getTime() + forecastDays * DAY)
        : null;

    const riskPenalty =
      Math.min(30, overdueTasks.length * 6) +
      Math.min(24, overdueMilestones.length * 12) +
      Math.min(20, counts.blocked * 8) +
      Math.min(10, tasks.length ? (unassigned / tasks.length) * 10 : 0) +
      Math.min(8, scheduleVariance !== null && scheduleVariance < 0 ? Math.abs(scheduleVariance) / 2 : 0);
    const healthScore = Math.max(0, Math.round(100 - riskPenalty));
    const health =
      healthScore >= 85
        ? { label: "On track", color: "#2E7D32" }
        : healthScore >= 65
        ? { label: "Needs attention", color: "#ED6C02" }
        : { label: "At risk", color: "#D32F2F" };

    const workloadMap = new Map();
    tasks.forEach((task) => {
      const key = task.assignedTo || "unassigned";
      const name = task.assignedToName || (key === "unassigned" ? "Unassigned" : "Team member");
      const current = workloadMap.get(key) || {
        key,
        name,
        active: 0,
        completed: 0,
        overdue: 0,
        hours: 0,
      };
      if (task.status === "completed") current.completed += 1;
      else current.active += 1;
      if (overdueTasks.some((overdue) => overdue.id === task.id)) current.overdue += 1;
      current.hours += Number(task.estimatedHours) || 0;
      workloadMap.set(key, current);
    });
    const workload = [...workloadMap.values()].sort(
      (a, b) => b.active - a.active || b.hours - a.hours
    );

    const categoryMap = new Map();
    tasks.forEach((task) => {
      const name = task.category || "Uncategorised";
      const current = categoryMap.get(name) || { name, total: 0, completed: 0 };
      current.total += 1;
      if (task.status === "completed") current.completed += 1;
      categoryMap.set(name, current);
    });
    const categoryProgress = [...categoryMap.values()]
      .map((item) => ({
        ...item,
        progress: Math.round((item.completed / item.total) * 100),
      }))
      .sort((a, b) => a.progress - b.progress);

    const upcoming = [
      ...dueSoonTasks.map((task) => ({
        id: `task-${task.id}`,
        type: "Task",
        name: task.name,
        dueDate: toDate(task.dueDate),
      })),
      ...milestoneRows
        .filter(
          (milestone) =>
            milestone.dueDate &&
            milestone.dueDate >= now &&
            daysBetween(now, milestone.dueDate) <= 30 &&
            milestone.progress < 100
        )
        .map((milestone) => ({
          id: `milestone-${milestone.id}`,
          type: "Milestone",
          name: milestone.name,
          dueDate: milestone.dueDate,
        })),
    ].sort((a, b) => a.dueDate - b.dueDate);

    const risks = [];
    if (overdueMilestones.length)
      risks.push({ severity: "critical", text: `${overdueMilestones.length} overdue milestone${overdueMilestones.length > 1 ? "s" : ""}` });
    if (overdueTasks.length)
      risks.push({ severity: "critical", text: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}` });
    if (counts.blocked)
      risks.push({ severity: "critical", text: `${counts.blocked} blocked task${counts.blocked > 1 ? "s" : ""}` });
    if (scheduleVariance !== null && scheduleVariance < -10)
      risks.push({ severity: "warning", text: `${Math.abs(scheduleVariance)} points behind planned progress` });
    if (unassigned)
      risks.push({ severity: "warning", text: `${unassigned} active task${unassigned > 1 ? "s are" : " is"} unassigned` });
    if (missingDeadlines)
      risks.push({ severity: "info", text: `${missingDeadlines} active task${missingDeadlines > 1 ? "s have" : " has"} no deadline` });
    if (missingEstimates)
      risks.push({ severity: "info", text: `${missingEstimates} active task${missingEstimates > 1 ? "s have" : " has"} no effort estimate` });

    return {
      counts,
      progress,
      remaining,
      overdueTasks,
      dueSoonTasks,
      milestoneRows,
      expectedProgress,
      scheduleVariance,
      velocityPerWeek,
      forecastDate,
      healthScore,
      health,
      workload,
      categoryProgress,
      upcoming,
      risks,
    };
  }, [project, tasks, milestones]);

  return (
    <Stack spacing={3}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 3 },
          background: "linear-gradient(135deg, rgba(107,91,149,.10), rgba(33,150,243,.05))",
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1 }}>
              <InsightsOutlined color="primary" />
              <Typography variant="h6">Delivery intelligence</Typography>
              <Chip
                size="small"
                label={insights.health.label}
                sx={{ bgcolor: `${insights.health.color}18`, color: insights.health.color, fontWeight: 700 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Health combines schedule variance, overdue and blocked work, milestone
              slippage, and assignment coverage. It updates whenever project data changes.
            </Typography>
          </Grid>
          <Grid item xs={6} md={2.5}>
            <Typography variant="caption" color="text.secondary">Health score</Typography>
            <Typography variant="h3" fontWeight={800} sx={{ color: insights.health.color }}>
              {insights.healthScore}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={insights.healthScore}
              sx={{ mt: 0.75, "& .MuiLinearProgress-bar": { bgcolor: insights.health.color } }}
            />
          </Grid>
          <Grid item xs={6} md={2.5}>
            <Typography variant="caption" color="text.secondary">Forecast finish</Typography>
            <Typography variant="h6" fontWeight={750} sx={{ mt: 0.5 }}>
              {insights.forecastDate ? formatDate(insights.forecastDate) : "Awaiting velocity"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Based on recorded completion pace
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          {metricCard("Overall progress", `${insights.progress}%`, `${insights.counts.completed} of ${tasks.length} tasks complete`, <AssignmentTurnedInOutlined />, "#5B67D6")}
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          {metricCard("Delivery velocity", `${insights.velocityPerWeek.toFixed(1)}/wk`, "Completed tasks per week", <TrendingUp />, "#00897B")}
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          {metricCard("Overdue work", insights.overdueTasks.length, `${insights.dueSoonTasks.length} more due within 14 days`, <WarningAmber />, insights.overdueTasks.length ? "#D32F2F" : "#2E7D32")}
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          {metricCard("Schedule variance", insights.scheduleVariance === null ? "—" : `${insights.scheduleVariance > 0 ? "+" : ""}${insights.scheduleVariance} pts`, insights.expectedProgress === null ? "Set project start/due dates to calculate" : `${insights.expectedProgress}% expected today`, <SpeedOutlined />, insights.scheduleVariance !== null && insights.scheduleVariance < -10 ? "#D32F2F" : "#1565C0")}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, height: "100%" }}>
            <Typography variant="h6" gutterBottom>Task flow</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current work distribution across delivery states.
            </Typography>
            <Box sx={{ display: "flex", height: 16, borderRadius: 8, overflow: "hidden", bgcolor: "grey.100", mb: 2 }}>
              {statusMeta.map((status) => {
                const count = insights.counts[status.key] || 0;
                return count ? (
                  <Tooltip key={status.key} title={`${status.label}: ${count}`}>
                    <Box sx={{ width: `${(count / Math.max(1, tasks.length)) * 100}%`, bgcolor: status.color }} />
                  </Tooltip>
                ) : null;
              })}
            </Box>
            <Grid container spacing={1.5}>
              {statusMeta.map((status) => (
                <Grid item xs={6} sm={3} key={status.key}>
                  <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={750}>{insights.counts[status.key] || 0}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: status.color }} />
                      <Typography variant="caption" color="text.secondary">{status.label}</Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, height: "100%" }}>
            <Typography variant="h6">Risk radar</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Actionable delivery risks ordered by severity.
            </Typography>
            {insights.risks.length === 0 ? (
              <Alert severity="success" icon={<CheckCircleOutline />}>No active delivery risks detected.</Alert>
            ) : (
              <Stack spacing={1}>
                {insights.risks.slice(0, 6).map((risk) => (
                  <Alert
                    key={risk.text}
                    severity={risk.severity === "critical" ? "error" : risk.severity}
                    icon={risk.severity === "critical" ? <ErrorOutline /> : undefined}
                    sx={{ py: 0.25 }}
                  >
                    {risk.text}
                  </Alert>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <FlagOutlined color="primary" />
          <Typography variant="h6">Milestone health</Typography>
        </Box>
        {insights.milestoneRows.length === 0 ? (
          <Alert severity="info">Add milestones and expected deadlines to activate schedule intelligence.</Alert>
        ) : (
          <Grid container spacing={2}>
            {insights.milestoneRows.map((milestone) => (
              <Grid item xs={12} md={6} key={milestone.id}>
                <Box sx={{ p: 2, border: "1px solid", borderColor: milestone.overdue ? "error.light" : "divider", borderRadius: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1 }}>
                    <Box>
                      <Typography fontWeight={700}>{milestone.name}</Typography>
                      <Typography variant="caption" color={milestone.overdue ? "error.main" : "text.secondary"}>
                        {milestone.overdue ? "Overdue · " : ""}{formatDate(milestone.dueDate)} · {milestone.completed}/{milestone.taskCount} tasks
                      </Typography>
                    </Box>
                    <Typography fontWeight={750}>{milestone.progress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={milestone.progress} color={milestone.overdue ? "error" : "primary"} />
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <GroupsOutlined color="primary" />
              <Typography variant="h6">Team workload</Typography>
            </Box>
            {insights.workload.length === 0 ? (
              <Typography color="text.secondary">No tasks have been assigned yet.</Typography>
            ) : (
              <Stack divider={<Divider flexItem />}>
                {insights.workload.slice(0, 8).map((person) => (
                  <Box key={person.key} sx={{ py: 1.5, display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Box>
                      <Typography fontWeight={650}>{person.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {person.hours ? `${person.hours} estimated hours · ` : ""}{person.completed} completed
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Chip size="small" label={`${person.active} active`} variant="outlined" />
                      {person.overdue > 0 && <Chip size="small" label={`${person.overdue} overdue`} color="error" />}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <CalendarMonthOutlined color="primary" />
              <Typography variant="h6">Upcoming deadlines</Typography>
            </Box>
            {insights.upcoming.length === 0 ? (
              <Typography color="text.secondary">No task or milestone deadlines in the next 30 days.</Typography>
            ) : (
              <List disablePadding>
                {insights.upcoming.slice(0, 7).map((item) => (
                  <ListItem key={item.id} disableGutters secondaryAction={<Chip size="small" label={item.type} variant="outlined" />}>
                    <ListItemText
                      primary={item.name}
                      secondary={`${formatDate(item.dueDate)} · ${daysBetween(new Date(), item.dueDate)} days`}
                      primaryTypographyProps={{ fontWeight: 600, noWrap: true, sx: { pr: 9 } }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <AnalyticsOutlined color="primary" />
          <Typography variant="h6">Category progress</Typography>
        </Box>
        {insights.categoryProgress.length === 0 ? (
          <Typography color="text.secondary">Categorised tasks will appear here.</Typography>
        ) : (
          <Grid container spacing={2}>
            {insights.categoryProgress.map((category) => (
              <Grid item xs={12} md={6} key={category.name}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                    <Typography variant="body2" fontWeight={650}>{category.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{category.completed}/{category.total} · {category.progress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={category.progress} />
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Stack>
  );
};

export default ProjectInsights;
