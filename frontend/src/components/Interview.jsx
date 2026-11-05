
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  Send,
  Brain,
  AlertCircle,
  Pause,
  Play,
} from "lucide-react";

import {
  startInterview,
  submitInterviewAnswer,
  pauseInterviewSession,
  resumeInterviewSession,
  updateInterviewTimer,
} from "../services/api";

import { getApiError } from "../services/errorHandler";

function Interview({
  jobDescription,
  resumeSession,
  onComplete,
  onBack,
}) {
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answer, setAnswer] = useState("");
  const [evaluations, setEvaluations] = useState([]);
  const [previousAnswers, setPreviousAnswers] = useState([]);

  // Interview timer states
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [baseElapsedSeconds, setBaseElapsedSeconds] = useState(0);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // Pause / Resume loading state
  const [isPauseActionLoading, setIsPauseActionLoading] =
    useState(false);

  const [difficulty, setDifficulty] = useState("mixed");
  const [questionCount, setQuestionCount] = useState(5);

  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [latestEvaluation, setLatestEvaluation] = useState(null);

  // Normalize question format
  const getQuestionText = (question) => {
    if (typeof question === "string") {
      return question;
    }

    return question?.question || question?.text || "";
  };

  // Automatically save and restore unfinished answers
  const getDraftKey = (id, index) =>
    `careercopilot_interview_draft_${id}_${index}`;

  const readDraft = (id, index) => {
    try {
      return (
        window.localStorage.getItem(
          getDraftKey(id, index)
        ) || ""
      );
    } catch {
      return "";
    }
  };

  const saveDraft = (id, index, value) => {
    try {
      window.localStorage.setItem(
        getDraftKey(id, index),
        value
      );
    } catch (error) {
      console.error("Unable to save interview draft:", error);
    }
  };

  const clearDraft = (id, index) => {
    try {
      window.localStorage.removeItem(
        getDraftKey(id, index)
      );
    } catch (error) {
      console.error("Unable to clear interview draft:", error);
    }
  };

  // Interview elapsed-time tracker
  useEffect(() => {
    if (!started || isPaused || !timerStartedAt) {
      return;
    }

    const updateTimer = () => {
      const currentActiveSeconds = Math.floor(
        (Date.now() - timerStartedAt) / 1000
      );

      setElapsedSeconds(
        baseElapsedSeconds + currentActiveSeconds
      );
    };

    updateTimer();

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [
    started,
    isPaused,
    timerStartedAt,
    baseElapsedSeconds,
  ]);

  // Automatically save timer progress every 10 seconds
  useEffect(() => {
    if (
      !started ||
      !sessionId ||
      isPaused ||
      !timerStartedAt
    ) {
      return;
    }

    const syncTimer = async () => {
      const currentElapsed =
        baseElapsedSeconds +
        Math.floor(
          (Date.now() - timerStartedAt) / 1000
        );

      try {
        await updateInterviewTimer(
          sessionId,
          currentElapsed
        );
      } catch (error) {
        console.error(
          "Unable to synchronize interview timer:",
          error
        );
      }
    };

    const timerSync = setInterval(syncTimer, 10000);

    return () => clearInterval(timerSync);
  }, [
    started,
    sessionId,
    isPaused,
    timerStartedAt,
    baseElapsedSeconds,
  ]);

  // Restore an existing interview session
  useEffect(() => {
    if (!resumeSession) {
      return;
    }

    const savedQuestions = Array.isArray(
      resumeSession.questions
    )
      ? resumeSession.questions
      : [];

    const savedEvaluations = Array.isArray(
      resumeSession.evaluations
    )
      ? resumeSession.evaluations
      : [];

    const savedIndex = Number(
      resumeSession.current_question
    );

    const nextIndex = Number.isInteger(savedIndex)
      ? Math.min(
          Math.max(savedIndex, 0),
          savedQuestions.length
        )
      : savedEvaluations.length;

    const savedElapsed = Number(
      resumeSession.elapsed_seconds || 0
    );

    const sessionIsPaused =
      resumeSession.status === "paused";

    setSessionId(resumeSession.session_id);

    setBaseElapsedSeconds(savedElapsed);
    setElapsedSeconds(savedElapsed);
    setIsPaused(sessionIsPaused);

    setTimerStartedAt(
      sessionIsPaused ? null : Date.now()
    );

    setQuestions(savedQuestions);
    setCurrentIndex(nextIndex);
    setEvaluations(savedEvaluations);

    setPreviousAnswers(
      Array.isArray(resumeSession.answers)
        ? resumeSession.answers
        : []
    );

    setAnswer(
      readDraft(resumeSession.session_id, nextIndex)
    );

    setError("");
    setLatestEvaluation(null);
    setStarted(true);
  }, [resumeSession]);

  // Start a new interview
  const handleStartInterview = async () => {
    if (!jobDescription?.trim()) {
      setError(
        "Job description is missing. Please go back and try again."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await startInterview(
        jobDescription,
        difficulty,
        questionCount
      );

      if (!result.session_id || !result.questions?.length) {
        throw new Error(
          "No interview questions were generated."
        );
      }

      setSessionId(result.session_id);

      // Initialize timer
      setBaseElapsedSeconds(0);
      setElapsedSeconds(0);
      setTimerStartedAt(Date.now());
      setIsPaused(false);
      setIsPauseActionLoading(false);

      setQuestions(result.questions);
      setCurrentIndex(0);
      setEvaluations([]);
      setPreviousAnswers([]);
      setAnswer("");
      setLatestEvaluation(null);

      setStarted(true);
    } catch (err) {
      setError(
        getApiError(err, "Unable to start interview.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Save the answer whenever the user types
  const handleAnswerChange = (event) => {
    const value = event.target.value;

    setAnswer(value);

    if (sessionId) {
      saveDraft(sessionId, currentIndex, value);
    }
  };

  // Pause interview
  const handlePauseInterview = async () => {
    if (
      !sessionId ||
      isPaused ||
      !timerStartedAt ||
      isPauseActionLoading
    ) {
      return;
    }

    try {
      setIsPauseActionLoading(true);
      setError("");

      const currentElapsed =
        baseElapsedSeconds +
        Math.floor(
          (Date.now() - timerStartedAt) / 1000
        );

      await pauseInterviewSession(
        sessionId,
        currentElapsed
      );

      setBaseElapsedSeconds(currentElapsed);
      setElapsedSeconds(currentElapsed);
      setTimerStartedAt(null);
      setIsPaused(true);
    } catch (err) {
      console.error("Pause interview error:", err);

      setError(
        getApiError(
          err,
          "Unable to pause the interview. Please try again."
        )
      );
    } finally {
      setIsPauseActionLoading(false);
    }
  };

  // Resume interview
  const handleResumeInterview = async () => {
    if (
      !sessionId ||
      !isPaused ||
      isPauseActionLoading
    ) {
      return;
    }

    try {
      setIsPauseActionLoading(true);
      setError("");

      await resumeInterviewSession(sessionId);

      setTimerStartedAt(Date.now());
      setIsPaused(false);
    } catch (err) {
      console.error("Resume interview error:", err);

      setError(
        getApiError(
          err,
          "Unable to resume the interview. Please try again."
        )
      );
    } finally {
      setIsPauseActionLoading(false);
    }
  };

  // Safely pause interview before navigating back
  const handleBackFromInterview = async () => {
    if (submitting || isPauseActionLoading) {
      return;
    }

    // Already paused: navigate back directly
    if (isPaused) {
      onBack?.();
      return;
    }

    if (!sessionId || !timerStartedAt) {
      onBack?.();
      return;
    }

    try {
      setIsPauseActionLoading(true);
      setError("");

      const currentElapsed =
        baseElapsedSeconds +
        Math.floor(
          (Date.now() - timerStartedAt) / 1000
        );

      await pauseInterviewSession(
        sessionId,
        currentElapsed
      );

      setBaseElapsedSeconds(currentElapsed);
      setElapsedSeconds(currentElapsed);
      setTimerStartedAt(null);
      setIsPaused(true);

      onBack?.();
    } catch (err) {
      console.error("Back navigation error:", err);

      setError(
        getApiError(
          err,
          "Unable to save your interview. Please try again."
        )
      );
    } finally {
      setIsPauseActionLoading(false);
    }
  };

  // Submit the current answer
  const handleSubmitAnswer = async () => {
    if (isPaused) {
      setError("Resume the interview before submitting.");
      return;
    }

    const question = getQuestionText(
      questions[currentIndex]
    );

    if (!answer.trim()) {
      setError(
        "Please enter your answer before submitting."
      );
      return;
    }

    if (answer.trim().length > 5000) {
      setError(
        "Your answer cannot exceed 5000 characters."
      );
      return;
    }

    if (!question || !sessionId) {
      setError(
        "Interview session or question is unavailable."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const submittedAnswer = answer.trim();

      const result = await submitInterviewAnswer(
        sessionId,
        question,
        submittedAnswer
      );

      // Remove the draft only after successful submission
      clearDraft(sessionId, currentIndex);

      const evaluation = {
        question,
        answer: submittedAnswer,
        evaluation: result.evaluation,
      };

      setEvaluations((previous) => [
        ...previous,
        evaluation,
      ]);

      setPreviousAnswers((previous) => [
        ...previous,
        {
          question,
          answer: submittedAnswer,
        },
      ]);

      setLatestEvaluation(result.evaluation);
      setAnswer("");

      if (result.completed || !result.next_question) {
        setTimerStartedAt(null);
        setIsPaused(false);

        if (onComplete) {
          onComplete(sessionId);
        }

        return;
      }

      const nextQuestionIndex = currentIndex + 1;

      setCurrentIndex(nextQuestionIndex);
    } catch (err) {
      setError(
        getApiError(err, "Unable to submit your answer.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Format elapsed interview time
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const remainingSeconds = seconds % 60;

    return [hours, minutes, remainingSeconds]
      .map((value) =>
        String(value).padStart(2, "0")
      )
      .join(":");
  };

  // Current question
  const currentQuestion = questions[currentIndex];

  const questionText = getQuestionText(currentQuestion);

  const totalQuestions = questions.length;

  const progress =
    totalQuestions > 0
      ? Math.round(
          (evaluations.length / totalQuestions) * 100
        )
      : 0;

  // Interview setup screen
  if (!started) {
    return (
      <div className="interview-page">
        <div className="interview-header">
          <button
            type="button"
            className="history-refresh-button"
            onClick={handleBackFromInterview}
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div>
            <h1>AI Mock Interview</h1>
            <p>
              Prepare for your next technical interview.
            </p>
          </div>
        </div>

        <div className="interview-setup-card">
          <div className="interview-setup-icon">
            <Brain size={35} />
          </div>

          <h2>Configure Your Interview</h2>

          <p>
            Choose your preferred difficulty and number
            of questions.
          </p>

          <div className="interview-setup-field">
            <label>Difficulty Level</label>

            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value)
              }
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div className="interview-setup-field">
            <label>Number of Questions</label>

            <select
              value={questionCount}
              onChange={(e) =>
                setQuestionCount(Number(e.target.value))
              }
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
              <option value={20}>20 Questions</option>
            </select>
          </div>

          {error && (
            <div className="history-error">
              <AlertCircle size={17} />
              {error}
            </div>
          )}

          <button
            type="button"
            className="history-view-button"
            onClick={handleStartInterview}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={17} />
                Generating Questions...
              </>
            ) : (
              <>
                Start Interview
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Interview completed or no remaining questions
  if (!currentQuestion) {
    return (
      <div className="interview-page">
        <div className="interview-completed-card">
          <CheckCircle size={55} />

          <h2>Interview Completed</h2>

          <p>
            You have answered all the interview questions.
          </p>

          <button
            type="button"
            className="history-view-button"
            onClick={() => onComplete?.(sessionId)}
          >
            View Interview Report
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    );
  }

  // Main interview screen
  return (
    <div className="interview-page">
      {/* Header */}
      <div className="interview-header">
        <button
          type="button"
          className="history-refresh-button"
          onClick={handleBackFromInterview}
          disabled={
            submitting || isPauseActionLoading
          }
        >
          <ArrowLeft size={17} />
          {isPauseActionLoading ? "Saving..." : "Back"}
        </button>

        <div>
          <h1>AI Mock Interview</h1>
          <p>
            {resumeSession
              ? "Continue your previous interview."
              : "Answer the questions to complete your interview."}
          </p>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="interview-navigation-card">
        <div className="interview-navigation-header">
          <h3>Question Navigation</h3>

          <span>
            {evaluations.length} of {totalQuestions} answered
          </span>
        </div>

        <div className="interview-question-navigation">
          {questions.map((question, index) => {
            const isAnswered = index < evaluations.length;
            const isCurrent = index === currentIndex;

            let status = "upcoming";

            if (isAnswered) {
              status = "answered";
            } else if (isCurrent) {
              status = "current";
            }

            return (
              <div
                key={index}
                className={`interview-question-step ${status}`}
                title={
                  isAnswered
                    ? "Answered"
                    : isCurrent
                      ? "Current question"
                      : "Not answered yet"
                }
              >
                {isAnswered ? (
                  <CheckCircle size={16} />
                ) : (
                  index + 1
                )}
              </div>
            );
          })}
        </div>

        <div className="interview-navigation-legend">
          <span>
            <i className="legend-dot answered-dot"></i>
            Answered
          </span>

          <span>
            <i className="legend-dot current-dot"></i>
            Current
          </span>

          <span>
            <i className="legend-dot upcoming-dot"></i>
            Upcoming
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="interview-progress-card">
        <div className="interview-progress-info">
          <span>
            Question {currentIndex + 1} of {totalQuestions}
          </span>

          <span>{progress}% Completed</span>
        </div>

        <div className="interview-progress-track">
          <div
            className="interview-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="interview-progress-details">
          <span>
            <CheckCircle size={15} />
            {evaluations.length} Answered
          </span>

          <span>
            <Clock size={15} />
            {totalQuestions - evaluations.length} Remaining
          </span>

          <span>
            <Clock size={15} />
            Duration: {formatDuration(elapsedSeconds)}
          </span>
        </div>

        {/* Pause / Resume Controls */}
        <div className="interview-timer-controls">
          <button
            type="button"
            className="history-view-button"
            onClick={
              isPaused
                ? handleResumeInterview
                : handlePauseInterview
            }
            disabled={
              isPauseActionLoading || submitting
            }
          >
            {isPauseActionLoading ? (
              <>
                <Loader2 size={17} />
                Please wait...
              </>
            ) : isPaused ? (
              <>
                <Play size={17} />
                Resume Interview
              </>
            ) : (
              <>
                <Pause size={17} />
                Pause Interview
              </>
            )}
          </button>

          {isPaused && (
            <p className="interview-paused-message">
              Interview paused. Your timer is stopped.
            </p>
          )}
        </div>
      </div>

      {/* Previous Answers */}
      {previousAnswers.length > 0 && (
        <div className="interview-previous-answers">
          <h3>Previous Answers</h3>

          {previousAnswers.map((item, index) => (
            <div
              className="interview-previous-answer-card"
              key={index}
            >
              <h4>Question {index + 1}</h4>

              <p className="previous-question">
                {getQuestionText(item.question)}
              </p>

              <strong>Your Answer</strong>
              <p>{item.answer}</p>

              {evaluations[index] && (
                <div className="previous-evaluation">
                  <strong>AI Evaluation</strong>
                  <p>
                    {evaluations[index].evaluation?.feedback ||
                      evaluations[index].evaluation?.overall_feedback ||
                      "Evaluation saved successfully."}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Question */}
      <div className="interview-question-card">
        <div className="interview-question-label">
          <Brain size={20} />
          Interview Question
        </div>

        <h2>{questionText}</h2>

        {currentQuestion?.difficulty && (
          <span className="history-status pending">
            {currentQuestion.difficulty}
          </span>
        )}

        {currentQuestion?.category && (
          <span className="history-status completed">
            {currentQuestion.category}
          </span>
        )}
      </div>

      {/* Answer */}
      <div className="interview-answer-card">
        <label htmlFor="interview-answer">
          Your Answer
        </label>

        <textarea
          id="interview-answer"
          rows={8}
          maxLength={5000}
          placeholder="Type your answer here..."
          value={answer}
          onChange={handleAnswerChange}
          disabled={isPaused || submitting}
        />

        <p className="interview-draft-status">
          <CheckCircle size={14} />
          Your answer is saved automatically.
        </p>

        <div className="interview-answer-footer">
          <span>
            {answer.trim().length} / 5000 characters
          </span>

          <button
            type="button"
            className="history-view-button"
            onClick={handleSubmitAnswer}
            disabled={
              isPaused ||
              submitting ||
              !answer.trim()
            }
          >
            {submitting ? (
              <>
                <Loader2 size={17} />
                Evaluating...
              </>
            ) : (
              <>
                Submit Answer
                <Send size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="history-error">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {/* Latest Evaluation */}
      {latestEvaluation && (
        <div className="interview-evaluation-card">
          <h3>
            <CheckCircle size={20} />
            Answer Evaluation
          </h3>

          {latestEvaluation.score !== undefined && (
            <p>
              Score:{" "}
              <strong>
                {latestEvaluation.score}/100
              </strong>
            </p>
          )}

          {latestEvaluation.feedback && (
            <p>{latestEvaluation.feedback}</p>
          )}

          {latestEvaluation.strengths && (
            <div>
              <strong>Strengths</strong>
              <p>
                {Array.isArray(latestEvaluation.strengths)
                  ? latestEvaluation.strengths.join(", ")
                  : latestEvaluation.strengths}
              </p>
            </div>
          )}

          {latestEvaluation.improvements && (
            <div>
              <strong>Areas to Improve</strong>
              <p>
                {Array.isArray(latestEvaluation.improvements)
                  ? latestEvaluation.improvements.join(", ")
                  : latestEvaluation.improvements}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Interview;
