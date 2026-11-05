import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Trophy,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { getInterviewReport } from "../services/api";
import "./CareerRoadmap.css";

const STORAGE_KEY = "careercopilot_roadmap_completed";

const CATEGORY_TASKS = {
  correctness: {
    title: "Technical Fundamentals",
    description: "Improve the accuracy of your technical explanations.",
    tasks: [
      "Revise core programming concepts and common interview questions.",
      "Practise explaining solutions with correct terminology.",
      "Solve 5 basic coding problems and explain their time complexity.",
    ],
  },
  technical_depth: {
    title: "Technical Depth",
    description: "Build deeper understanding instead of memorising answers.",
    tasks: [
      "Study the internal working of important technologies in your target role.",
      "Practise explaining concepts with real-world examples.",
      "Prepare answers covering architecture, trade-offs, and limitations.",
    ],
  },
  clarity: {
    title: "Communication and Clarity",
    description: "Make your interview answers structured and easy to understand.",
    tasks: [
      "Practise the STAR method for project and behavioural questions.",
      "Explain one technical concept aloud in under two minutes.",
      "Record and review three mock interview answers.",
    ],
  },
  relevance: {
    title: "Answer Relevance",
    description: "Keep answers focused on the question and job requirements.",
    tasks: [
      "Practise identifying the exact requirement in each interview question.",
      "Answer 10 role-specific questions without unnecessary details.",
      "Connect your project experience to the responsibilities of the target role.",
    ],
  },
  completeness: {
    title: "Answer Completeness",
    description: "Give answers with enough detail, examples, and conclusions.",
    tasks: [
      "Use a structured format: definition, explanation, example, conclusion.",
      "Practise explaining 5 project features from problem to implementation.",
      "Review answers and identify missing steps or examples.",
    ],
  },
};

const ROLE_TOPICS = {
  python: [
    "Revise Python data types, loops, functions, and exception handling.",
    "Practise Python lists, dictionaries, strings, and file handling.",
    "Revise OOP concepts, decorators, generators, and common coding problems.",
  ],
  developer: [
    "Revise REST APIs, HTTP methods, status codes, and JSON.",
    "Practise SQL joins, subqueries, indexes, and database design.",
    "Build a small CRUD application and explain its architecture.",
  ],
  ai: [
    "Revise supervised and unsupervised machine learning algorithms.",
    "Practise data preprocessing, feature selection, and model evaluation.",
    "Explain one end-to-end ML project, including metrics and limitations.",
  ],
  data: [
    "Practise SQL queries, joins, grouping, and window functions.",
    "Revise Pandas, NumPy, data cleaning, and exploratory data analysis.",
    "Create a small data analysis project and explain its findings.",
  ],
  frontend: [
    "Revise JavaScript fundamentals, ES6, promises, and async/await.",
    "Practise React components, props, state, hooks, and routing.",
    "Build a responsive React page that consumes a REST API.",
  ],
  default: [
    "Review the essential technical skills listed in your target job description.",
    "Practise common technical and problem-solving interview questions.",
    "Prepare a clear explanation of your projects and technical decisions.",
  ],
};

function getRoleTopics(role = "") {
  const value = role.toLowerCase();

  if (value.includes("python")) return ROLE_TOPICS.python;
  if (value.includes("developer") || value.includes("software")) {
    return ROLE_TOPICS.developer;
  }
  if (
    value.includes("ai") ||
    value.includes("machine learning") ||
    value.includes("ml")
  ) {
    return ROLE_TOPICS.ai;
  }
  if (value.includes("data") || value.includes("analyst")) {
    return ROLE_TOPICS.data;
  }
  if (
    value.includes("frontend") ||
    value.includes("react") ||
    value.includes("web")
  ) {
    return ROLE_TOPICS.frontend;
  }

  return ROLE_TOPICS.default;
}

function createRoadmap(reports) {
  const latestReport = reports[0] || {};
  const role = latestReport.target_job_role || "Your Target Role";

  const categories = [
    "correctness",
    "technical_depth",
    "clarity",
    "relevance",
    "completeness",
  ];

  const scores = categories
    .map((category) => ({
      category,
      score: Number(latestReport[`average_${category}`] ?? 0),
    }))
    .filter((item) => Number.isFinite(item.score));

  const hasScores = scores.some((item) => item.score > 0);

  const weakAreas = hasScores
    ? [...scores]
        .sort((a, b) => a.score - b.score)
        .filter((item) => item.score < 75)
        .slice(0, 3)
    : [];

  const selectedCategories = weakAreas.length
    ? weakAreas.map((item) => item.category)
    : ["technical_depth", "correctness"];

  const roleTasks = getRoleTopics(role);

  const tasks = [];

  // Week 1: Target-role fundamentals
  roleTasks.forEach((title, index) => {
    tasks.push({
      id: `role-${index + 1}`,
      week: 1,
      category: "Role Skills",
      title,
      duration: "45 minutes",
    });
  });

  // Weeks 2 and 3: Improve the weakest interview areas
  selectedCategories.forEach((category, categoryIndex) => {
    const item = CATEGORY_TASKS[category];

    item.tasks.forEach((title, taskIndex) => {
      tasks.push({
        id: `${category}-${taskIndex + 1}`,
        week: categoryIndex === 0 ? 2 : 3,
        category: item.title,
        title,
        duration: "30 minutes",
      });
    });
  });

  // Week 4: Practice and review
  [
    "Complete one full mock interview for your target role.",
    "Review your answers and compare them with your previous interview report.",
    "Revise your weakest topics and prepare a concise project explanation.",
  ].forEach((title, index) => {
    tasks.push({
      id: `final-${index + 1}`,
      week: 4,
      category: "Final Practice",
      title,
      duration: "45 minutes",
    });
  });

  return {
    role,
    tasks,
    weakAreas: weakAreas.map((item) => ({
      name: CATEGORY_TASKS[item.category].title,
      score: item.score,
    })),
    hasInterviewData: reports.length > 0,
  };
}

function CareerRoadmap({ sessions = [] }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [expandedWeek, setExpandedWeek] = useState(1);

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      setLoading(true);
      setError("");

      try {
        const completed = sessions
          .filter((session) => session.completed && session.session_id)
          .sort(
            (a, b) =>
              new Date(b.created_at || 0) -
              new Date(a.created_at || 0)
          );

        const results = await Promise.allSettled(
          completed.slice(0, 10).map((session) =>
            getInterviewReport(session.session_id)
          )
        );

        const validReports = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value)
          .sort(
            (a, b) =>
              new Date(b.created_at || 0) -
              new Date(a.created_at || 0)
          );

        if (active) {
          setReports(validReports);
        }
      } catch (err) {
        if (active) {
          setError("Unable to load interview performance data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReports();

    return () => {
      active = false;
    };
  }, [sessions]);

  const roadmap = useMemo(
    () => createRoadmap(reports),
    [reports]
  );

  const completedSet = useMemo(
    () => new Set(completedTasks),
    [completedTasks]
  );

  const totalTasks = roadmap.tasks.length;
  const completedCount = roadmap.tasks.filter((task) =>
    completedSet.has(task.id)
  ).length;

  const progress =
    totalTasks > 0
      ? Math.round((completedCount / totalTasks) * 100)
      : 0;

  const toggleTask = (taskId) => {
    setCompletedTasks((previous) => {
      const updated = previous.includes(taskId)
        ? previous.filter((id) => id !== taskId)
        : [...previous, taskId];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const resetProgress = () => {
    const confirmed = window.confirm(
      "Reset all completed roadmap tasks?"
    );

    if (!confirmed) return;

    setCompletedTasks([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const weeks = [1, 2, 3, 4];

  if (loading) {
    return (
      <section className="roadmap-panel">
        <div className="roadmap-loading">
          <RefreshCw className="roadmap-spin" size={22} />
          <p>Preparing your career roadmap...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="roadmap-panel">
      <div className="roadmap-header">
        <div>
          <span className="roadmap-eyebrow">
            PERSONAL DEVELOPMENT PLAN
          </span>
          <h2>
            <Target size={23} />
            Career Preparation Roadmap
          </h2>
          <p>
            A four-week plan based on your interview performance
            and target role.
          </p>
        </div>

        <button
          type="button"
          className="roadmap-reset"
          onClick={resetProgress}
          disabled={completedCount === 0}
        >
          <RefreshCw size={15} />
          Reset progress
        </button>
      </div>

      {error && <p className="roadmap-error">{error}</p>}

      <div className="roadmap-overview">
        <div className="roadmap-overview-icon">
          <Trophy size={25} />
        </div>

        <div className="roadmap-overview-content">
          <strong>Target role: {roadmap.role}</strong>
          <p>
            {roadmap.hasInterviewData
              ? "Your plan uses your latest available interview report."
              : "Complete a mock interview to personalise this plan using your performance."}
          </p>

          <div className="roadmap-progress-track">
            <div
              className="roadmap-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="roadmap-progress-label">
            <span>{completedCount} of {totalTasks} tasks completed</span>
            <strong>{progress}%</strong>
          </div>
        </div>
      </div>

      {roadmap.weakAreas.length > 0 && (
        <div className="roadmap-weak-areas">
          <h3>Areas to improve from your interview</h3>

          <div className="roadmap-weak-list">
            {roadmap.weakAreas.map((area) => (
              <div className="roadmap-weak-item" key={area.name}>
                <span>{area.name}</span>
                <strong>{area.score.toFixed(1)}/100</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="roadmap-weeks">
        {weeks.map((week) => {
          const weekTasks = roadmap.tasks.filter(
            (task) => task.week === week
          );

          const weekCompleted = weekTasks.filter((task) =>
            completedSet.has(task.id)
          ).length;

          const isExpanded = expandedWeek === week;

          return (
            <div className="roadmap-week" key={week}>
              <button
                type="button"
                className="roadmap-week-header"
                onClick={() =>
                  setExpandedWeek(isExpanded ? 0 : week)
                }
              >
                <div className="roadmap-week-title">
                  <span className="roadmap-week-number">
                    {week}
                  </span>

                  <div>
                    <strong>Week {week}</strong>
                    <p>
                      {weekCompleted}/{weekTasks.length} tasks completed
                    </p>
                  </div>
                </div>

                {isExpanded ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>

              {isExpanded && (
                <div className="roadmap-task-list">
                  {weekTasks.map((task) => {
                    const isCompleted = completedSet.has(task.id);

                    return (
                      <div
                        className={`roadmap-task ${
                          isCompleted ? "is-completed" : ""
                        }`}
                        key={task.id}
                      >
                        <button
                          type="button"
                          className="roadmap-task-check"
                          onClick={() => toggleTask(task.id)}
                          aria-label={
                            isCompleted
                              ? "Mark task as incomplete"
                              : "Mark task as completed"
                          }
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={21} />
                          ) : (
                            <Circle size={21} />
                          )}
                        </button>

                        <div className="roadmap-task-content">
                          <span className="roadmap-task-category">
                            {task.category}
                          </span>
                          <strong>{task.title}</strong>
                          <span className="roadmap-task-duration">
                            <Clock size={13} />
                            {task.duration}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {progress === 100 && (
        <div className="roadmap-finished">
          <Trophy size={20} />
          <div>
            <strong>Roadmap completed!</strong>
            <p>Great work. Take another mock interview to assess your progress.</p>
          </div>
        </div>
      )}

      <p className="roadmap-note">
        Your task completion progress is saved in this browser.
        It is not stored in the backend database.
      </p>
    </section>
  );
}

export default CareerRoadmap;