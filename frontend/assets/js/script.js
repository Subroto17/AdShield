const API_BASE = "http://127.0.0.1:5000";

/* ================= SCAN PAGE ================= */

async function predict() {
  const textArea = document.getElementById("adText");
  if (!textArea) return;

  const text = textArea.value.trim();

  if (!text) {
    alert("Please enter advertisement text.");
    return;
  }

  document.getElementById("loader").style.display = "block";
  document.getElementById("risk-section").style.display = "none";
  document.getElementById("highlightOutput").style.display = "none";

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    document.getElementById("loader").style.display = "none";
    document.getElementById("risk-section").style.display = "block";

    const confidence = Math.round(data.probability * 100);
    const circle = document.getElementById("risk-circle");
    const resultText = document.getElementById("resultText");

    document.getElementById("riskValue").innerText = confidence + "%";

    circle.classList.remove("meter-red", "meter-green");

    if (data.result === "fake") {
      circle.classList.add("meter-red");
      resultText.innerHTML = "<b style='color:#e74a3b'>FAKE Advertisement</b>";
    } else {
      circle.classList.add("meter-green");
      resultText.innerHTML =
        "<b style='color:#1cc88a'>GENUINE Advertisement</b>";
    }

    // Highlight risky words
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

    const output = document.getElementById("highlightOutput");
    output.innerHTML = highlighted;
    output.style.display = "block";

    textArea.value = "";
  } catch (err) {
    console.error(err);
    document.getElementById("loader").style.display = "none";
    alert("Backend not reachable. Start app.py");
  }
}

/* ================= DASHBOARD ================= */

// chart instances (DO NOT REMOVE)
let categoryChart = null;
let timelineChart = null;
let pieChart = null;

// helper to avoid crashes on other pages
function el(id) {
  return document.getElementById(id);
}

async function loadDashboard() {
  if (!el("totalScans")) return; // ensures this runs ONLY on dashboard

  await loadSummary();
  await loadCategories();
  await loadTimeline();
  await loadPie();
  await loadRecentScans();
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

  if (el("insightText")) {
    el("insightText").innerText =
      data.fake > data.genuine
        ? "⚠️ High scam activity detected. Most scams belong to " +
          data.top_category.toUpperCase()
        : "✅ System healthy. Majority of advertisements are genuine.";
  }
}

/* -------- CATEGORY BAR -------- */
async function loadCategories() {
  const res = await fetch(`${API_BASE}/dashboard/categories`);
  const data = await res.json();

  if (!el("categoryChart")) return;
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
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });
}

/* -------- TIMELINE -------- */
async function loadTimeline() {
  const res = await fetch(`${API_BASE}/dashboard/timeline`);
  const data = await res.json();

  if (!el("timelineChart")) return;
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
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

/* -------- PIE -------- */
async function loadPie() {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  const data = await res.json();

  if (!el("pieChart")) return;
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
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

/* -------- RECENT SCANS -------- */
async function loadRecentScans() {
  if (!el("recentScans")) return;

  const res = await fetch(`${API_BASE}/dashboard/recent`);
  const scans = await res.json();

  const tbody = el("recentScans");
  tbody.innerHTML = "";

  if (scans.length === 0) {
    tbody.innerHTML = "<tr><td colspan='4'>No scans yet</td></tr>";
    return;
  }

  scans.forEach((s) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${s.text}</td>
      <td style="color:${s.result === "fake" ? "#e74a3b" : "#1cc88a"}">
        ${s.result.toUpperCase()}
      </td>
      <td>${s.category}</td>
      <td>${Math.round(s.probability * 100)}%</td>
    `;
    tbody.appendChild(row);
  });
}

/* -------- AUTO LOAD -------- */
if (window.location.pathname.includes("dashboard.html")) {
  loadDashboard();
  setInterval(loadDashboard, 20000);
}

/* ================= REPORT SCAM ================= */

async function submitReport() {
  const scamType = document.getElementById("scamType").value;
  const adLink = document.getElementById("adLink").value;
  const description = document.getElementById("description").value.trim();

  if (!description) {
    alert("Please describe the suspicious advertisement.");
    return;
  }

  const btn = document.getElementById("reportBtn");
  btn.innerText = "Submitting...";
  btn.disabled = true;

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

    const data = await res.json();

    document.getElementById("reportSuccess").style.display = "block";
    document.getElementById("reportForm").reset();
  } catch (err) {
    alert("Backend not reachable. Start app.py");
  } finally {
    btn.innerText = "Submit Report";
    btn.disabled = false;
  }
}
