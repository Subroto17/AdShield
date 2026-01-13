const API_BASE = "http://127.0.0.1:5000";

/* ================= HELPER ================= */
function el(id) {
  return document.getElementById(id);
}

/* ================= SCAN PAGE ================= */

async function predict() {
  const textArea = el("adText");
  if (!textArea) return;

  const text = textArea.value.trim();
  if (!text) {
    alert("Please enter advertisement text.");
    return;
  }

  el("loader").style.display = "block";
  el("risk-section").style.display = "none";
  el("highlightOutput").style.display = "none";

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    el("loader").style.display = "none";
    el("risk-section").style.display = "block";

    const confidence = Math.round(data.probability * 100);
    el("riskValue").innerText = confidence + "%";

    const circle = el("risk-circle");
    const resultText = el("resultText");

    circle.classList.remove("meter-red", "meter-green");

    if (data.result === "fake") {
      circle.classList.add("meter-red");
      resultText.innerHTML = "<b style='color:#e74a3b'>FAKE Advertisement</b>";
    } else {
      circle.classList.add("meter-green");
      resultText.innerHTML =
        "<b style='color:#1cc88a'>GENUINE Advertisement</b>";
    }

    const riskyWords = [
      "lottery",
      "earn",
      "money",
      "profit",
      "investment",
      "guaranteed",
      "free",
      "quick cash",
    ];

    let highlighted = text;
    riskyWords.forEach((word) => {
      const regex = new RegExp(word, "gi");
      highlighted = highlighted.replace(
        regex,
        `<span style="background:#ffe2e2;padding:3px;border-radius:4px">${word}</span>`
      );
    });

    el("highlightOutput").innerHTML = highlighted;
    el("highlightOutput").style.display = "block";

    textArea.value = "";
  } catch (err) {
    console.error(err);
    el("loader").style.display = "none";
    alert("Backend not reachable. Start app.py");
  }
}

/* ================= DASHBOARD ================= */

let categoryChart = null;
let timelineChart = null;
let pieChart = null;
let keywordChart = null; // 🔥 NEW

async function loadDashboard() {
  await loadSummary();
  await loadCategories();
  await loadTimeline();
  await loadPie();
}

/* -------- SUMMARY -------- */
async function loadSummary() {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  const data = await res.json();

  if (el("totalScans")) el("totalScans").innerText = data.total_scans;
  if (el("fakeCount")) el("fakeCount").innerText = data.fake;
  if (el("genuineCount")) el("genuineCount").innerText = data.genuine;
  if (el("topCategory"))
    el("topCategory").innerText = data.top_category.toUpperCase();

  // ADMIN STATS
  if (el("adminTotal")) {
    el("adminTotal").innerText = data.total_scans;
    el("adminFake").innerText = data.fake;
    el("adminGenuine").innerText = data.genuine;
    el("adminTopCategory").innerText = data.top_category;
  }
}

/* -------- CATEGORY BAR -------- */
async function loadCategories() {
  if (!el("categoryChart")) return;

  const res = await fetch(`${API_BASE}/dashboard/categories`);
  const data = await res.json();

  if (categoryChart) categoryChart.destroy();

  categoryChart = new Chart(el("categoryChart"), {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Scam Count",
          data: data.counts,
          backgroundColor: "#4a6cf7",
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

/* -------- TIMELINE -------- */
async function loadTimeline() {
  if (!el("timelineChart")) return;

  const res = await fetch(`${API_BASE}/dashboard/timeline`);
  const data = await res.json();

  if (timelineChart) timelineChart.destroy();

  timelineChart = new Chart(el("timelineChart"), {
    type: "line",
    data: {
      labels: data.dates,
      datasets: [
        {
          label: "Fake",
          data: data.fake,
          borderColor: "#e74a3b",
          tension: 0.4,
        },
        {
          label: "Genuine",
          data: data.genuine,
          borderColor: "#1cc88a",
          tension: 0.4,
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

/* -------- PIE -------- */
async function loadPie() {
  if (!el("pieChart")) return;

  const res = await fetch(`${API_BASE}/dashboard/summary`);
  const data = await res.json();

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(el("pieChart"), {
    type: "pie",
    data: {
      labels: ["Fake", "Genuine"],
      datasets: [
        {
          data: [data.fake, data.genuine],
          backgroundColor: ["#e74a3b", "#1cc88a"],
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

/* ================= 🔥 KEYWORD TRENDS ================= */

async function loadKeywordTrends() {
  if (!el("keywordChart")) return;

  const res = await fetch(`${API_BASE}/admin/keywords`);
  const data = await res.json();

  if (keywordChart) keywordChart.destroy();

  keywordChart = new Chart(el("keywordChart"), {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Frequency",
          data: data.counts,
          backgroundColor: "#f6c23e",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });
}

/* ================= REPORT SCAM ================= */

async function submitReport() {
  const scamType = el("scamType").value;
  const adLink = el("adLink").value;
  const description = el("description").value.trim();

  if (!description) {
    alert("Please describe the suspicious advertisement.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scam_type: scamType,
        ad_link: adLink,
        description: description,
      }),
    });

    if (res.ok) {
      alert("✅ Report submitted successfully!");
      el("reportForm").reset();
    } else {
      alert("❌ Failed to submit report");
    }
  } catch {
    alert("Backend not reachable. Start app.py");
  }
}

/* ================= ADMIN ================= */

async function adminLogin() {
  const username = el("adminUsername").value.trim();
  const password = el("adminPassword").value.trim();
  const errorBox = el("adminError");

  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      sessionStorage.setItem("isAdmin", "true");
      window.location.href = "admin-dashboard.html";
    } else {
      errorBox.innerText = "Invalid credentials";
      errorBox.style.display = "block";
    }
  } catch {
    errorBox.innerText = "Backend not reachable";
    errorBox.style.display = "block";
  }
}

/* -------- ADMIN LOAD -------- */
async function loadAdminScans() {
  if (!el("adminTable")) return;

  const res = await fetch(`${API_BASE}/admin/scans`);
  const scans = await res.json();

  const table = el("adminTable");
  table.innerHTML = "";

  scans.forEach((s) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(s.timestamp * 1000).toLocaleString()}</td>
      <td>${s.text}</td>
      <td>${s.result.toUpperCase()}</td>
      <td>${s.category}</td>
    `;
    table.appendChild(row);
  });
}

async function loadAdminReports() {
  if (!el("adminReportsTable")) return;

  const res = await fetch(`${API_BASE}/admin/reports`);
  const reports = await res.json();

  const table = el("adminReportsTable");
  table.innerHTML = "";

  reports.forEach((r) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.text}</td>
      <td>${r.category}</td>
      <td>${r.status.toUpperCase()}</td>
      <td>
        ${
          r.status === "pending"
            ? `<button onclick="approveReport(${r.id})">Approve</button>
               <button onclick="rejectReport(${r.id})">Reject</button>`
            : "-"
        }
      </td>
    `;
    table.appendChild(row);
  });
}

async function approveReport(id) {
  await fetch(`${API_BASE}/admin/approve/${id}`, { method: "POST" });
  loadAdminReports();
  loadAdminScans();
}

async function rejectReport(id) {
  await fetch(`${API_BASE}/admin/reject/${id}`, { method: "POST" });
  loadAdminReports();
}

/* -------- AUTO LOAD -------- */
if (window.location.pathname.includes("dashboard.html")) {
  loadDashboard();
}

if (window.location.pathname.includes("admin-dashboard.html")) {
  loadSummary();
  loadAdminScans();
  loadAdminReports();
  loadKeywordTrends(); // 🔥 FINAL CALL
}
