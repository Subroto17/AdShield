async function predict() {
  let text = document.getElementById("adText").value;

  if (!text.trim()) {
    alert("Please enter advertisement text.");
    return;
  }

  // Show loader
  document.getElementById("loader").style.display = "flex";

  // Hide previous results
  document.getElementById("highlightOutput").style.display = "none";
  document.getElementById("risk-section").style.display = "none";

  try {
    let r = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    });

    let data = await r.json();

    // Hide loader
    document.getElementById("loader").style.display = "none";

    // Show result block
    document.getElementById("risk-section").style.display = "block";

    // NEW CORRECT VALUES
    let confidence = Math.floor(data.probability * 100); // %
    let prediction = data.result; // fake / genuine

    // Set percentage text
    document.getElementById("riskValue").innerText = confidence + "%";

    // Circle element
    let circle = document.getElementById("risk-circle");

    // Reset old colors
    circle.classList.remove("meter-red", "meter-green");

    // SIMPLE LOGIC
    if (prediction === "fake") {
      circle.classList.add("meter-red");
      document.getElementById("resultText").innerHTML =
        "<span style='color:#e74a3b;'>FAKE Advertisement</span>";
    } else {
      circle.classList.add("meter-green");
      document.getElementById("resultText").innerHTML =
        "<span style='color:#1cc88a;'>GENUINE Advertisement</span>";
    }

    // Highlight risky words
    let riskyWords = [
      "free",
      "win",
      "winner",
      "money",
      "earn",
      "investment",
      "guaranteed",
    ];
    let highlight = text;

    riskyWords.forEach((word) => {
      let reg = new RegExp(word, "gi");
      highlight = highlight.replace(
        reg,
        `<span style="background:#ffdfdf;padding:3px;border-radius:4px;">${word}</span>`
      );
    });

    // Show highlighted text
    let out = document.getElementById("highlightOutput");
    out.style.display = "block";
    out.innerHTML = highlight;

    // Clear textarea
    document.getElementById("adText").value = "";
  } catch (err) {
    console.error("Error:", err);
    alert("Something went wrong while scanning!");
    document.getElementById("loader").style.display = "none";
  }
}
