
import { useState, useEffect } from "react";

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

import {
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";

import "./index.css";


function App() {

  // --------------------------------
  // APPLICATION STATE
  // --------------------------------

  const [page, setPage] = useState("dashboard");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("careercopilot-theme") || "light";
  });

  const [analysis, setAnalysis] = useState(null);

  const [jobDescription, setJobDescription] = useState("");

  const [sessionId, setSessionId] = useState(null);

  const [resumeSession, setResumeSession] = useState(null);

  const [report, setReport] = useState(null);

  const [loadingReport, setLoadingReport] = useState(false);

  const [error, setError] = useState("");

  const [reportReturnPage, setReportReturnPage] =
    useState("dashboard");

  const [recoverySession, setRecoverySession] = useState(null);


  // --------------------------------
  // THEME MANAGEMENT
  // --------------------------------

  useEffect(() => {
    localStorage.setItem("careercopilot-theme", theme);
  }, [theme]);


  const toggleTheme = () => {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  };


  // --------------------------------
  // NAVIGATION HELPER
  // --------------------------------

  const navigateTo = (nextPage) => {
    setError("");
    setPage(nextPage);
  };


  // --------------------------------
  // AUTOMATIC INTERVIEW RECOVERY
  // --------------------------------

  useEffect(() => {

    let isMounted = true;

    const checkUnfinishedInterview = async () => {

      try {

        const result = await getInterviewHistory();

        if (!isMounted) return;

        const unfinishedSessions = (
          result.sessions || []
        ).filter((session) => {

          return (
            !session.completed &&
            session.status !== "completed"
          );

        });


        if (unfinishedSessions.length > 0) {

          unfinishedSessions.sort((a, b) => {

            return (
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime()
            );

          });

          setRecoverySession(unfinishedSessions[0]);

        }

      } catch (error) {

        console.error(
          "Unable to check unfinished interviews:",
          error
        );

      }

    };


    checkUnfinishedInterview();


    return () => {
      isMounted = false;
    };

  }, []);


  // --------------------------------
  // JOB ANALYSIS
  // --------------------------------

  const handleAnalysis = (result, description) => {

    setAnalysis(result);

    setJobDescription(description);

    setError("");

    setPage("results");

  };


  // --------------------------------
  // NEW INTERVIEW COMPLETED
  // --------------------------------

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

      setError(
        err.response?.data?.detail ||
        "Unable to load the interview report."
      );

    } finally {

      setLoadingReport(false);

    }

  };


  // --------------------------------
  // VIEW PREVIOUS INTERVIEW REPORT
  // --------------------------------

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

      setError(
        err.response?.data?.detail ||
        "Unable to load interview report."
      );

    } finally {

      setLoadingReport(false);

    }

  };


  // --------------------------------
  // RESUME EXISTING INTERVIEW
  // --------------------------------

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

      setError(
        err.response?.data?.detail ||
        "Unable to resume this interview."
      );

    } finally {

      setLoadingReport(false);

    }

  };


  // --------------------------------
  // DISMISS RECOVERY PROMPT
  // --------------------------------

  const handleDismissRecovery = () => {

    setRecoverySession(null);

  };


  // --------------------------------
  // APPLICATION UI
  // --------------------------------

  return (

    <div className={`app theme-${theme}`}>

      {/* NAVIGATION BAR */}

      <nav className="navbar">

        <div
          className="logo"
          onClick={() => navigateTo("dashboard")}
          style={{ cursor: "pointer" }}
        >
          CareerCopilot
        </div>


        <div className="nav-links">

          {/* THEME TOGGLE */}

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            title="Switch theme"
          >

            {theme === "light" ? (

              <>
                <Moon size={18} />
                Dark Mode
              </>

            ) : (

              <>
                <Sun size={18} />
                Light Mode
              </>

            )}

          </button>


          <button
            onClick={() => navigateTo("dashboard")}
          >
            Dashboard
          </button>


          <button
            onClick={() => navigateTo("history")}
          >
            Interview History
          </button>


          <button
            onClick={() => navigateTo("analyzer")}
          >
            Resume Analyzer
          </button>


          <button
            onClick={() => navigateTo("applications")}
          >
            Applications
          </button>


          <button
            onClick={() => navigateTo("follow-up")}
          >
            Follow-ups
          </button>

        </div>

      </nav>


      {/* GLOBAL ERROR MESSAGE */}

      {error && (

        <div className="history-error">

          {error}

        </div>

      )}


      {/* DASHBOARD PAGE */}

      {page === "dashboard" && (

        <>

          {/* AUTOMATIC INTERVIEW RECOVERY PROMPT */}

          {recoverySession && (

            <div className="history-card">

              <div className="history-card-content">

                <h3>
                  Unfinished Interview Found
                </h3>

                <p>
                  You have an unfinished interview session.
                  Would you like to continue where you left off?
                </p>

                <p>
                  Questions answered:{" "}

                  {recoverySession.current_question || 0}/

                  {recoverySession.questions?.length || 0}
                </p>


                <div className="history-card-actions">

                  <button
                    className="history-view-button"
                    onClick={() =>
                      handleResumeInterview(
                        recoverySession.session_id
                      )
                    }
                    disabled={loadingReport}
                  >

                    Resume Interview

                    <ArrowRight size={16} />

                  </button>


                  <button
                    className="history-delete-button"
                    onClick={handleDismissRecovery}
                  >
                    Dismiss
                  </button>

                </div>

              </div>

            </div>

          )}


          {/* MAIN DASHBOARD */}

          <Dashboard
            onAnalysis={handleAnalysis}
          />


          {/* DASHBOARD ANALYTICS */}

          <DashboardAnalytics
            onNavigate={navigateTo}
          />


          {/* ALL CAREER TOOLS */}

          <DashboardToolbox
            onNavigate={navigateTo}
          />

        </>

      )}


      {/* RESUME ANALYZER */}

      {page === "analyzer" && (

        <ResumeAnalyzer
          onBack={() => navigateTo("dashboard")}
        />

      )}


      {/* JOB MATCH RESULTS */}

      {page === "results" && analysis && (

        <MatchResult

          analysis={analysis}

          onStartInterview={() => {

            setError("");

            setResumeSession(null);

            setSessionId(null);

            setPage("interview");

          }}

          onBack={() => navigateTo("dashboard")}

        />

      )}


      {/* AI INTERVIEW */}

      {page === "interview" && (

        <Interview

          jobDescription={jobDescription}

          resumeSession={resumeSession}

          onComplete={handleInterviewComplete}

          onBack={() => {

            setError("");

            setPage("history");

          }}

        />

      )}


      {/* INTERVIEW HISTORY */}

      {page === "history" && (

        <InterviewHistory

          onViewReport={handleViewHistoryReport}

          onResume={handleResumeInterview}

        />

      )}


      {/* INTERVIEW REPORT */}

      {page === "report" && (

        <div>

          {loadingReport ? (

            <div className="history-loading">

              <p>Loading interview report...</p>

            </div>

          ) : (

            <InterviewReport

              report={report}

              onBack={() =>
                navigateTo(reportReturnPage)
              }

            />

          )}

        </div>

      )}


      {/* JOB APPLICATION TRACKER */}

      {page === "applications" && (

        <JobApplicationTracker

          onBack={() => navigateTo("dashboard")}

        />

      )}


      {/* AI JOB APPLICATION ASSISTANT */}

      {page === "job-assistant" && (

        <JobApplicationAssistant

          onBack={() => navigateTo("dashboard")}

          onOpenTracker={() => navigateTo("applications")}

        />

      )}


      {/* AI FOLLOW-UP ASSISTANT */}

      {page === "follow-up" && (

        <FollowUpAssistant

          onBack={() => navigateTo("dashboard")}

        />

      )}


      {/* CAREER RECOMMENDATIONS */}

      {page === "recommendations" && (

        <CareerRecommendations

          onBack={() => navigateTo("dashboard")}

        />

      )}

    </div>

  );

}


export default App;
