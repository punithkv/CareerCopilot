
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportInterviewReport = (report) => {
  if (!report) {
    throw new Error("Interview report data is missing.");
  }

  const pdf = new jsPDF();

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const score = Number(report.overall_score ?? 0);
  const questions = report.questions || [];

  const candidateName =
    report.candidate_name || report.user_name || "Candidate";
  const candidateEmail = report.candidate_email || "Not provided";
  const targetJobRole = report.target_job_role || "Not provided";
  const resumeFilename =
  report.resume_filename || "Not available";
  const jobDescription =
    report.job_description || "Not available";
  const interviewDate =
    report.interview_date || report.created_at || report.started_at;
  const formattedDate = interviewDate
  ? new Date(interviewDate).toLocaleDateString("en-IN")
  : "Not available";
  const generatedDate = new Date().toLocaleDateString("en-IN");

  // =====================================
  // PAGE 1: PROFESSIONAL COVER PAGE
  // =====================================

  // Background
  pdf.setFillColor(18, 27, 48);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // Accent design
  pdf.setFillColor(54, 105, 190);
  pdf.circle(pageWidth - 10, 20, 45, "F");

  pdf.setFillColor(37, 75, 140);
  pdf.circle(10, pageHeight - 15, 55, "F");

  // Branding
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.text("CareerCopilot", 20, 38);

  pdf.setDrawColor(100, 160, 255);
  pdf.setLineWidth(1);
  pdf.line(20, 48, pageWidth - 20, 48);

  // Report title
  pdf.setFontSize(12);
  pdf.setTextColor(150, 190, 255);
  pdf.text("AI-POWERED CAREER DEVELOPMENT", 20, 75);

  pdf.setFontSize(25);
  pdf.setTextColor(255, 255, 255);
  pdf.text("INTERVIEW", 20, 100);
  pdf.text("PERFORMANCE", 20, 113);
  pdf.text("REPORT", 20, 126);

  // Overall score
  pdf.setFillColor(35, 49, 75);
  pdf.roundedRect(20, 145, pageWidth - 40, 42, 5, 5, "F");

  pdf.setFontSize(11);
  pdf.setTextColor(180, 200, 230);
  pdf.text("OVERALL PERFORMANCE", 30, 158);

  pdf.setFontSize(25);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`${score.toFixed(1)} / 100`, 30, 176);

// =====================================
// CANDIDATE PROFILE
// =====================================

pdf.setFontSize(11);
pdf.setTextColor(150, 190, 255);
pdf.text("CANDIDATE PROFILE", 20, 210);

pdf.setFontSize(9);
pdf.setTextColor(255, 255, 255);

// Candidate information
pdf.text(`Candidate: ${candidateName}`, 20, 223);
pdf.text(`Email: ${candidateEmail}`, 20, 230);
pdf.text(`Target Job Role: ${targetJobRole}`, 20, 237);

// Uploaded resume filename
pdf.text("Uploaded Resume:", 20, 244);

const resumeLines = pdf.splitTextToSize(
  resumeFilename,
  pageWidth - 40
);

pdf.text(resumeLines.slice(0, 1), 20, 250);

// Job description
pdf.setFontSize(10);
pdf.setTextColor(150, 190, 255);

pdf.text("JOB DESCRIPTION", 20, 259);

pdf.setFontSize(9);
pdf.setTextColor(255, 255, 255);

const descriptionLines = pdf.splitTextToSize(
  jobDescription,
  pageWidth - 40
);

pdf.text(descriptionLines.slice(0, 2), 20, 266);

// Interview metadata
pdf.setFontSize(8);
pdf.setTextColor(180, 190, 210);

pdf.text(
  `Interview Date: ${formattedDate}`,
  20,
  279
);

pdf.text(
  `Total Questions: ${
    report.total_questions || questions.length
  }`,
  pageWidth - 20,
  279,
  { align: "right" }
);

pdf.text(
  `Session ID: ${report.session_id || "N/A"}`,
  20,
  285
);

pdf.text(
  `Generated: ${generatedDate}`,
  pageWidth - 20,
  285,
  { align: "right" }
);

// Confidentiality footer
pdf.setFontSize(8);
pdf.text(
  "Confidential Interview Evaluation Report",
  pageWidth / 2,
  pageHeight - 5,
  { align: "center" }
);

  // =====================================
  // PAGE 2: PERFORMANCE BREAKDOWN
  // =====================================

  pdf.addPage();

  pdf.setTextColor(30, 40, 60);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("Interview Evaluation Report", 14, 20);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`Session ID: ${report.session_id || "N/A"}`, 14, 29);
  pdf.text(`Total Questions: ${report.total_questions || questions.length}`, 14, 36);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Performance Breakdown", 14, 52);

  autoTable(pdf, {
    startY: 60,
    head: [["Evaluation Category", "Score"]],
    body: [
      ["Correctness", `${report.average_correctness ?? 0}/100`],
      ["Technical Depth", `${report.average_technical_depth ?? 0}/100`],
      ["Clarity", `${report.average_clarity ?? 0}/100`],
      ["Relevance", `${report.average_relevance ?? 0}/100`],
      ["Completeness", `${report.average_completeness ?? 0}/100`],
    ],
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
  });

  // =====================================
  // QUESTION-WISE EVALUATION
  // =====================================

  let currentY = pdf.lastAutoTable.finalY + 15;

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Question-wise Evaluation", 14, currentY);

  const questionRows = questions.map((item, index) => [
    `Q${index + 1}`,
    item.question || "",
    item.answer || "",
    `${Number(item.overall_score ?? 0).toFixed(1)}/10`,
  ]);

  autoTable(pdf, {
    startY: currentY + 7,
    head: [["No.", "Question", "Your Answer", "Score"]],
    body: questionRows.length
      ? questionRows
      : [["-", "No questions available", "-", "-"]],
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 55 },
      2: { cellWidth: 95 },
      3: { cellWidth: 22 },
    },
  });

  currentY = pdf.lastAutoTable.finalY + 15;

  // =====================================
  // STRENGTHS, WEAKNESSES AND RECOMMENDATIONS
  // =====================================

  const addListSection = (title, items) => {
    if (currentY > 250) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 40, 60);
    pdf.text(title, 14, currentY);

    currentY += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    const list = Array.isArray(items)
      ? items
      : items
      ? [items]
      : [];

    if (list.length === 0) {
      pdf.text("No information available.", 14, currentY);
      currentY += 8;
    } else {
      list.forEach((item) => {
        const lines = pdf.splitTextToSize(
          `- ${String(item)}`,
          pageWidth - 28
        );

        if (currentY + lines.length * 5 > 275) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.text(lines, 14, currentY);
        currentY += lines.length * 5 + 2;
      });
    }

    currentY += 8;
  };

  addListSection("Strengths", report.strengths);
  addListSection("Areas for Improvement", report.weaknesses);
  addListSection("Recommendations", report.recommendations);

  // =====================================
  // OVERALL FEEDBACK
  // =====================================

  if (currentY > 250) {
    pdf.addPage();
    currentY = 20;
  }

  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(30, 40, 60);
  pdf.text("Overall Feedback", 14, currentY);

  currentY += 8;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");

  const summary = pdf.splitTextToSize(
    report.summary || "No summary available.",
    pageWidth - 28
  );

  summary.forEach((line) => {
    if (currentY > 275) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.text(line, 14, currentY);
    currentY += 5;
  });

  // =====================================
  // DOWNLOAD PDF
  // =====================================

  pdf.save(
    `CareerCopilot_Interview_Report_${report.session_id || "report"}.pdf`
  );
};
