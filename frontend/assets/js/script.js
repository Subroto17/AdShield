const API_BASE = "http://127.0.0.1:5000";

/* ================= SCAN PAGE ================= */

async function predict() {
  const textArea = document.getElementById("adText");
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

    // Clear textarea only AFTER success
    textArea.value = "";
  } catch (err) {
    console.error(err);
    document.getElementById("loader").style.display = "none";
    alert("Backend not reachable. Start app.py");
  }
}

/* ================= DASHBOARD ================= */

async function loadDashboard() {
  await loadSummary();
  await loadCategories();
  await loadTimeline();
  await loadRecentScans();
}

/* -------- SUMMARY -------- */
async function loadSummary() {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  const data = await res.json();

  document.getElementById("totalScans").innerText = data.total_scans;
  document.getElementById("fakeCount").innerText = data.fake;
  document.getElementById("genuineCount").innerText = data.genuine;
  document.getElementById("topCategory").innerText =
    data.top_category.toUpperCase();

  const insight = document.getElementById("insightText");
  if (data.fake > data.genuine) {
    insight.innerText =
      "⚠️ Alert: High number of fake advertisements detected. Most scams relate to " +
      data.top_category.toUpperCase();
  } else {
    insight.innerText =
      "✅ System Status: Majority of scanned advertisements appear genuine.";
  }
}

/* -------- CATEGORY BAR -------- */
let categoryChart;
async function loadCategories() {
  const res = await fetch(`${API_BASE}/dashboard/categories`);
  const data = await res.json();

  if (categoryChart) categoryChart.destroy();

  categoryChart = new Chart(document.getElementById("categoryChart"), {
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
      plugins: { legend: { display: false } },
    },
  });
}

/* -------- TIMELINE -------- */
let timelineChart;
async function loadTimeline() {
  const res = await fetch(`${API_BASE}/dashboard/timeline`);
  const data = await res.json();

  if (timelineChart) timelineChart.destroy();

  timelineChart = new Chart(document.getElementById("timelineChart"), {
    type: "line",
    data: {
      labels: data.dates,
      datasets: [
        {
          label: "Fake",
          data: data.fake,
          borderColor: "#e74a3b",
          fill: false,
          tension: 0.4,
        },
        {
          label: "Genuine",
          data: data.genuine,
          borderColor: "#1cc88a",
          fill: false,
          tension: 0.4,
        },
      ],
    },
    options: { responsive: true },
  });
}

/* -------- PIE -------- */
let pieChart;
async function loadPie() {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  const data = await res.json();

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(document.getElementById("pieChart"), {
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
  });
}

/* -------- RECENT SCANS -------- */
async function loadRecentScans() {
  const res = await fetch(`${API_BASE}/dashboard/recent`);
  const scans = await res.json();

  const tbody = document.getElementById("recentScans");
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
      <td>${s.time}</td>
    `;
    tbody.appendChild(row);
  });
}

/* -------- AUTO LOAD -------- */
if (window.location.pathname.includes("dashboard.html")) {
  loadDashboard();
  loadPie();
  setInterval(loadDashboard, 15000); // auto refresh every 15 sec
}
