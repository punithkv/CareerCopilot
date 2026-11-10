import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileSearch,
  ClipboardList,
  BriefcaseBusiness,
  Mail,
  Sparkles,
  History,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Menu,
  X,
  BrainCircuit,
  Bot,
} from "lucide-react";

import ResumeAnalyzer from "./components/ResumeAnalyzer";
import Dashboard from "./components/Dashboard";
import MatchResult from "./components/MatchResult";
import Interview from "./components/Interview";
import InterviewReport from "./components/InterviewReport";
import InterviewHistory from "./components/InterviewHistory";
import DashboardAnalytics from "./components/DashboardAnalytics";
import DashboardToolbox from "./components/DashboardToolbox";
import JobApplicationTracker from "./components/JobApplicationTracker";
import JobApplicationAssistant from "./components/JobApplicationAssistant";
import FollowUpAssistant from "./components/FollowUpAssistant";
import CareerRecommendations from "./components/CareerRecommendations";

import {
  getInterviewReport,
  getInterviewSession,
  getInterviewHistory,
} from "./services/api";

import "./index.css";
import "./careercopilot-redesign.css";

const NAV_GROUPS = [
  {
    label: "WORKSPACE",
    items: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "analyzer", label: "Resume Analyzer", icon: FileSearch },
      { id: "history", label: "Interview History", icon: History },
    ],
  },
  {
    label: "CAREER TOOLS",
    items: [
      { id: "applications", label: "Applications", icon: BriefcaseBusiness },
      { id: "follow-up", label: "Follow-up Assistant", icon: Mail },
      { id: "job-assistant", label: "Job Assistant", icon: Bot },
      { id: "recommendations", label: "Career Insights", icon: BrainCircuit },
    ],
  },
];

const PAGE_TITLES = {
  dashboard: ["Overview", "Your career workspace at a glance"],
  analyzer: ["Resume Analyzer", "Improve your resume and job readiness"],
  history: ["Interview History", "Review your practice sessions and reports"],
  applications: ["Job Applications", "Track every opportunity in one place"],
  "follow-up": ["Follow-up Assistant", "Create thoughtful application follow-ups"],
  "job-assistant": ["Job Assistant", "Understand your fit for a role"],
  recommendations: ["Career Insights", "Turn your progress into a career plan"],
  results: ["Job Match Results", "Your resume-to-role analysis"],
  interview: ["AI Interview", "Practice, answer and improve"],
  report: ["Interview Report", "Your performance breakdown"],
};

function App() {
  const [page, setPage] = useState("dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem("careercopilot-theme") || "dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [resumeSession, setResumeSession] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");
  const [reportReturnPage, setReportReturnPage] = useState("dashboard");
  const [recoverySession, setRecoverySession] = useState(null);

  useEffect(() => {
    localStorage.setItem("careercopilot-theme", theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    const checkUnfinishedInterview = async () => {
      try {
        const result = await getInterviewHistory();
        if (!isMounted) return;
        const unfinished = (result.sessions || []).filter(
          (session) => !session.completed && session.status !== "completed"
        );
        unfinished.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
        if (unfinished.length) setRecoverySession(unfinished[0]);
      } catch (err) {
        console.error("Unable to check unfinished interviews:", err);
      }
    };
    checkUnfinishedInterview();
    return () => {
      isMounted = false;
    };
  }, []);

  const navigateTo = (nextPage) => {
    setError("");
    setPage(nextPage);
    setMobileNavOpen(false);
  };

  const handleAnalysis = (result, description) => {
    setAnalysis(result);
    setJobDescription(description);
    setError("");
    setPage("results");
  };

  const handleInterviewComplete = async (id) => {
    try {
      setLoadingReport(true);
      setError("");
      const result = await getInterviewReport(id);
      setSessionId(id);
      setReport(result);
      setReportReturnPage("dashboard");
      setResumeSession(null);
      setRecoverySession(null);
      setPage("report");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load the interview report.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleViewHistoryReport = async (id) => {
    try {
      setLoadingReport(true);
      setError("");
      const result = await getInterviewReport(id);
      setSessionId(id);
      setReport(result);
      setReportReturnPage("history");
      setPage("report");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load interview report.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleResumeInterview = async (id) => {
    try {
      setError("");
      setLoadingReport(true);
      const result = await getInterviewSession(id);
      setResumeSession(result);
      setSessionId(id);
      setJobDescription(result.job_description || "");
      setRecoverySession(null);
      setPage("interview");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to resume this interview.");
    } finally {
      setLoadingReport(false);
    }
  };

  const title = PAGE_TITLES[page] || ["CareerCopilot", "Your AI-powered career companion"];

  const sidebar = (
    <aside className={`cc-sidebar ${sidebarCollapsed ? "is-collapsed" : ""}`}>
      <div className="cc-brand-row">
        <button className="cc-brand" onClick={() => navigateTo("dashboard")} aria-label="CareerCopilot home">
          <span className="cc-brand-mark"><Sparkles size={19} /></span>
          {!sidebarCollapsed && <span className="cc-brand-name">Career<span>Copilot</span></span>}
        </button>
        <button className="cc-collapse-btn" onClick={() => setSidebarCollapsed((v) => !v)} aria-label="Toggle sidebar">
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <div className="cc-workspace-chip">
        <span className="cc-workspace-avatar">P</span>
        {!sidebarCollapsed && <span><strong>Personal workspace</strong><small>Local AI environment</small></span>}
      </div>

      <nav className="cc-navigation" aria-label="Main navigation">
        {NAV_GROUPS.map((group) => (
          <div className="cc-nav-group" key={group.label}>
            {!sidebarCollapsed && <p className="cc-nav-label">{group.label}</p>}
            {group.items.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`cc-nav-item ${page === id ? "active" : ""}`}
                onClick={() => navigateTo(id)}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon size={18} strokeWidth={1.9} />
                {!sidebarCollapsed && <span>{label}</span>}
                {!sidebarCollapsed && page === id && <ChevronRight className="cc-nav-chevron" size={15} />}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="cc-sidebar-bottom">
        <div className="cc-local-status"><span className="cc-status-dot" />{!sidebarCollapsed && <span>Local AI services</span>}</div>
        <button className="cc-theme-btn" onClick={() => setTheme((v) => v === "light" ? "dark" : "light")} title="Toggle theme">
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          {!sidebarCollapsed && <span>{theme === "light" ? "Dark appearance" : "Light appearance"}</span>}
        </button>
        {!sidebarCollapsed && <div className="cc-sidebar-footnote">CareerCopilot <span>·</span> Built for your next move</div>}
      </div>
    </aside>
  );

  return (
    <div className={`cc-app theme-${theme}`}>
      {sidebar}
      {mobileNavOpen && <button className="cc-mobile-backdrop" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <div className="cc-main-shell">
        <header className="cc-topbar">
          <button className="cc-mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="cc-breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{title[0]}</strong></div>
          <div className="cc-topbar-right">
            <span className="cc-ai-pill"><span /> AI workspace</span>
            <div className="cc-profile-avatar">P</div>
          </div>
        </header>
        <main className="cc-content">
          <div className="cc-page-heading">
            <div><p className="cc-page-kicker">CAREERCOPILOT WORKSPACE</p><h1>{title[0]}</h1><p>{title[1]}</p></div>
            <div className="cc-page-heading-mark"><BrainCircuit size={22} /></div>
          </div>

          {error && <div className="history-error cc-global-error">{error}</div>}

          {page === "dashboard" && (
            <>
              {recoverySession && (
                <div className="history-card cc-recovery-card">
                  <div className="history-card-content">
                    <h3>Unfinished interview found</h3>
                    <p>You have an unfinished interview session. Continue where you left off?</p>
                    <p>Questions answered: {recoverySession.current_question || 0}/{recoverySession.questions?.length || 0}</p>
                    <div className="history-card-actions">
                      <button className="history-view-button" onClick={() => handleResumeInterview(recoverySession.session_id)} disabled={loadingReport}>Resume interview <ChevronRight size={16} /></button>
                      <button className="history-delete-button" onClick={() => setRecoverySession(null)}>Dismiss</button>
                    </div>
                  </div>
                </div>
              )}
              <Dashboard onAnalysis={handleAnalysis} />
              <DashboardAnalytics onNavigate={navigateTo} />
              <DashboardToolbox onNavigate={navigateTo} />
            </>
          )}

          {page === "analyzer" && <ResumeAnalyzer onBack={() => navigateTo("dashboard")} />}
          {page === "results" && analysis && (
            <MatchResult analysis={analysis} onStartInterview={() => { setError(""); setResumeSession(null); setSessionId(null); setPage("interview"); }} onBack={() => navigateTo("dashboard")} />
          )}
          {page === "interview" && (
            <Interview jobDescription={jobDescription} resumeSession={resumeSession} onComplete={handleInterviewComplete} onBack={() => navigateTo("history")} />
          )}
          {page === "history" && <InterviewHistory onViewReport={handleViewHistoryReport} onResume={handleResumeInterview} />}
          {page === "report" && (
            loadingReport ? <div className="history-loading"><p>Loading interview report...</p></div> :
            <InterviewReport report={report} onBack={() => navigateTo(reportReturnPage)} />
          )}
          {page === "applications" && <JobApplicationTracker onBack={() => navigateTo("dashboard")} />}
          {page === "job-assistant" && <JobApplicationAssistant onBack={() => navigateTo("dashboard")} onOpenTracker={() => navigateTo("applications")} />}
          {page === "follow-up" && <FollowUpAssistant onBack={() => navigateTo("dashboard")} />}
          {page === "recommendations" && <CareerRecommendations onBack={() => navigateTo("dashboard")} />}
        </main>
        <footer className="cc-footer"><span>CareerCopilot</span><span>Private by design · Powered by local AI</span></footer>
      </div>

      {mobileNavOpen && (
        <div className="cc-mobile-sidebar">
          <div className="cc-mobile-sidebar-head"><strong>CareerCopilot</strong><button onClick={() => setMobileNavOpen(false)} aria-label="Close"><X size={20} /></button></div>
          {NAV_GROUPS.map((group) => <section key={group.label}><p>{group.label}</p>{group.items.map(({ id, label, icon: Icon }) => <button key={id} className={page === id ? "active" : ""} onClick={() => navigateTo(id)}><Icon size={18} />{label}</button>)}</section>)}
          <button className="cc-mobile-theme" onClick={() => setTheme((v) => v === "light" ? "dark" : "light")}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />} Toggle appearance</button>
        </div>
      )}
    </div>
  );
}

export default App;
