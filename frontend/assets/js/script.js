// =======================
// SCAN / PREDICT FUNCTION
// =======================
async function predict(event) {
  if (event) event.preventDefault();

  const textArea = document.getElementById("adText");
  const text = textArea.value.trim();

  const loader = document.getElementById("loader");
  const riskSection = document.getElementById("risk-section");
  const highlightOutput = document.getElementById("highlightOutput");
  const resultText = document.getElementById("resultText");
  const riskValue = document.getElementById("riskValue");
  const circle = document.getElementById("risk-circle");
  const button = document.querySelector(".btn-primary");

  // ---------- VALIDATION ----------
  if (!text) {
    alert("Please enter advertisement text.");
    return;
  }

  // ---------- RESET UI (ONLY HERE) ----------
  riskSection.style.display = "none";
  highlightOutput.style.display = "none";
  resultText.innerHTML = "";
  circle.classList.remove("meter-red", "meter-green");

  // ---------- LOCK UI ----------
  loader.style.display = "flex";
  button.disabled = true;
  button.innerText = "Analyzing...";

  try {
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Backend error");
    }

    const data = await response.json();

    // ---------- UNLOCK UI ----------
    loader.style.display = "none";
    button.disabled = false;
    button.innerText = "Analyze";

    // ---------- PROCESS RESULT ----------
    const confidence = Math.floor(data.probability * 100);
    const prediction = data.result; // fake | genuine

    riskValue.innerText = confidence + "%";

    if (prediction === "fake") {
      circle.classList.add("meter-red");
      resultText.innerHTML =
        "<span style='color:#e74a3b;'>FAKE Advertisement</span>";
    } else {
      circle.classList.add("meter-green");
      resultText.innerHTML =
        "<span style='color:#1cc88a;'>GENUINE Advertisement</span>";
    }

    // ---------- HIGHLIGHT SUSPICIOUS WORDS ----------
    const riskyWords = [
      "free",
      "win",
      "winner",
      "money",
      "earn",
      "investment",
      "guaranteed",
    ];

    let highlightedText = text;

    riskyWords.forEach((word) => {
      const regex = new RegExp(word, "gi");
      highlightedText = highlightedText.replace(
        regex,
        `<span style="background:#ffdfdf;padding:3px;border-radius:4px;">${word}</span>`
      );
    });

    highlightOutput.innerHTML = highlightedText;

    // ---------- SHOW RESULT (PERMANENT) ----------
    riskSection.style.display = "block";
    highlightOutput.style.display = "block";

    // ---------- CLEAR INPUT ----------
    textArea.value = "";
  } catch (error) {
    console.error("Scan failed:", error);

    loader.style.display = "none";
    button.disabled = false;
    button.innerText = "Analyze";

    alert("Backend is not reachable. Please start the server.");
  }
}

// =======================
// DASHBOARD AUTO LOAD
// =======================
if (window.location.pathname.includes("dashboard.html")) {
  loadDashboard();
}
