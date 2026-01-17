const API_BASE = "http://127.0.0.1:5000";

/* ================= HELPER ================= */
function el(id) {
  return document.getElementById(id);
}

/* ================= AOS INIT (GLOBAL) ================= */
document.addEventListener("DOMContentLoaded", () => {
  if (window.AOS) {
    AOS.init();
  }
});

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
        `<span style="background:#ffe2e2;padding:3px;border-radius:4px">${word}</span>`,
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
let keywordChart = null;

async function loadSystemInsight() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    const data = await res.json();

    const insightEl = el("insightText");
    if (!insightEl) return;

    if (data.total_scans === 0) {
      insightEl.innerText = "No scans available yet.";
      return;
    }

    const fakePercent = Math.round((data.fake / data.total_scans) * 100);

    insightEl.innerText =
      `Total Scans: ${data.total_scans}\n` +
      `Fake Ads: ${fakePercent}%\n` +
      `Genuine Ads: ${100 - fakePercent}%\n` +
      `Top Scam Category: ${data.top_category}`;
  } catch (err) {
    console.error("System insight error:", err);
  }
}

async function loadDashboard() {
  await loadSummary();
  await loadCategories();
  await loadSystemInsight();
  await loadTimeline();
  await loadPie();
}

/* ================= ADMIN PAGINATION ================= */
let allScans = [];
let currentScanPage = 1;
const scansPerPage = 10;

/* -------- SUMMARY -------- */
async function loadSummary() {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  const data = await res.json();

  if (el("totalScans")) el("totalScans").innerText = data.total_scans;
  if (el("fakeCount")) el("fakeCount").innerText = data.fake;
  if (el("genuineCount")) el("genuineCount").innerText = data.genuine;
  if (el("topCategory"))
    el("topCategory").innerText = data.top_category.toUpperCase();

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
  try {
    const res = await fetch(`${API_BASE}/dashboard/timeline`);
    const data = await res.json();

    const chartCanvas = el("timelineChart");
    if (!chartCanvas) return;

    // 🔹 Ensure at least 2 points so line is visible
    if (data.dates && data.dates.length === 1) {
      data.dates.push(data.dates[0]);
      data.fake.push(data.fake[0]);
      data.genuine.push(data.genuine[0]);
    }

    if (timelineChart) timelineChart.destroy();

    timelineChart = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: data.dates,
        datasets: [
          {
            label: "Fake Ads",
            data: data.fake,
            borderColor: "#3b82f6",
            backgroundColor: "#3b82f6",
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
          },
          {
            label: "Genuine Ads",
            data: data.genuine,
            borderColor: "#22c55e",
            backgroundColor: "#22c55e",
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
  } catch (err) {
    console.error("Timeline error:", err);
  }
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

/* ================= KEYWORD TRENDS ================= */

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
  const scamType = el("scamType")?.value || "";
  const adLink = el("adLink")?.value || "";
  const description = el("description")?.value.trim();

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
        description,
      }),
    });

    if (res.ok) {
      showReportSuccess();
      openReportModal();
      el("reportForm").reset();
    } else {
      alert("❌ Failed to submit report");
    }
  } catch {
    alert("Backend not reachable. Start app.py");
  }
}

/* -------- REPORT UI HELPERS -------- */

function showReportSuccess() {
  const box = el("reportSuccess");
  if (!box) return;

  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 5000);
}

function openReportModal() {
  const modal = el("reportModal");
  if (modal) modal.style.display = "flex";
}

function closeReportModal() {
  const modal = el("reportModal");
  if (modal) modal.style.display = "none";
}

/* ================= ADMIN ================= */
async function adminLogin() {
  const username = el("adminUser")?.value || el("adminUsername")?.value;
  const password = el("adminPass")?.value || el("adminPassword")?.value;
  const errorBox = el("adminError");

  const btn = el("loginBtn");
  const text = el("loginText");
  const spinner = el("loginSpinner");
  const card = document.querySelector(".admin-card");

  // Start loading UI
  if (btn && text && spinner) {
    btn.disabled = true;
    text.style.display = "none";
    spinner.style.display = "inline-block";
  }

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
      // Stop loading UI
      if (btn && text && spinner) {
        btn.disabled = false;
        text.style.display = "inline";
        spinner.style.display = "none";
      }

      if (errorBox) {
        errorBox.innerText = "Invalid credentials";
        errorBox.style.display = "block";
      }

      // Shake animation
      if (card) {
        card.classList.add("shake");
        setTimeout(() => card.classList.remove("shake"), 400);
      }
    }
  } catch {
    // Stop loading UI
    if (btn && text && spinner) {
      btn.disabled = false;
      text.style.display = "inline";
      spinner.style.display = "none";
    }

    if (errorBox) {
      errorBox.innerText = "Backend not reachable";
      errorBox.style.display = "block";
    }
  }
}

function togglePassword() {
  const input = el("adminPass") || el("adminPassword");
  if (!input) return;

  input.type = input.type === "password" ? "text" : "password";
}

/* -------- ADMIN UI CONTROLS -------- */

function openAdminTab(id, btn) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  el(id).classList.add("active");
}

function openLogoutModal() {
  el("logoutModal").style.display = "flex";
}

function closeLogoutModal() {
  el("logoutModal").style.display = "none";
}

function confirmLogout() {
  sessionStorage.removeItem("isAdmin");
  window.location.href = "admin.html";
}

/* -------- ADMIN DATA -------- */

async function loadAdminScans() {
  if (!el("adminTable")) return;

  const res = await fetch(`${API_BASE}/admin/scans`);
  allScans = await res.json();

  // latest first
  allScans.reverse();
  currentScanPage = 1;

  renderScanTable();
  renderScanPagination();
}

function renderScanTable() {
  const table = el("adminTable");
  table.innerHTML = "";

  const start = (currentScanPage - 1) * scansPerPage;
  const end = start + scansPerPage;
  const pageData = allScans.slice(start, end);

  if (pageData.length === 0) {
    table.innerHTML = `<tr><td colspan="4">No records</td></tr>`;
    return;
  }

  pageData.forEach((s) => {
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

function renderScanPagination() {
  const container = el("scanPagination");
  if (!container) return;

  container.innerHTML = "";
  const totalPages = Math.ceil(allScans.length / scansPerPage);

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = `page-btn ${i === currentScanPage ? "active" : ""}`;
    btn.innerText = i;

    btn.onclick = () => {
      currentScanPage = i;
      renderScanTable();
      renderScanPagination();
    };

    container.appendChild(btn);
  }
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
     <td class="status ${r.status}">${r.status.toUpperCase()}</td>

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
  loadKeywordTrends();
}

async function clearDashboard() {
  const confirmClear = confirm(
    "⚠️ This will delete ALL scanned ads and reports.\nAre you sure?",
  );

  if (!confirmClear) return;

  try {
    const res = await fetch(`${API_BASE}/admin/clear`, {
      method: "POST",
    });

    if (res.ok) {
      alert("✅ All data cleared successfully!");
      loadSummary();
      loadAdminScans();
      loadAdminReports();
    } else {
      alert("❌ Failed to clear data");
    }
  } catch (err) {
    alert("Backend not reachable. Start app.py");
  }
}

function openClearModal() {
  document.getElementById("clearModal").style.display = "flex";
}

function closeClearModal() {
  document.getElementById("clearModal").style.display = "none";
}

async function confirmClearData() {
  closeClearModal();

  try {
    const res = await fetch(`${API_BASE}/admin/clear`, {
      method: "POST",
    });

    if (res.ok) {
      alert("✅ All data cleared successfully!");
      loadSummary();
      loadAdminScans();
      loadAdminReports();
    } else {
      alert("❌ Failed to clear data");
    }
  } catch {
    alert("Backend not reachable. Start app.py");
  }
}
