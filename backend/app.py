from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json, os, time, re

app = Flask(__name__)
CORS(app)

MODEL_PATH = "model.pkl"
VECTORIZER_PATH = "vectorizer.pkl"
SCANS_FILE = "scans.json"

# ================= LOAD MODEL =================
try:
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("✅ Model & vectorizer loaded successfully")
except Exception as e:
    print("❌ Model files corrupted or missing.")
    print("👉 Run: python train_model.py")
    raise e

# ================= UTIL =================
def load_scans():
    if not os.path.exists(SCANS_FILE):
        return []
    with open(SCANS_FILE, "r") as f:
        return json.load(f)

def save_scans(scans):
    with open(SCANS_FILE, "w") as f:
        json.dump(scans, f, indent=2)

# ================= CATEGORY =================
def get_category(text):
    t = text.lower()
    if any(w in t for w in ["lottery", "earn", "money", "profit", "investment"]):
        return "money"
    if any(w in t for w in ["job", "salary", "hiring", "vacancy"]):
        return "job"
    if any(w in t for w in ["crypto", "bitcoin", "trading"]):
        return "crypto"
    return "general"

# ================= RULE-BASED OVERRIDE =================
def rule_based_fake(text):
    t = text.lower()

    scam_keywords = [
        "lottery", "guaranteed", "earn money", "double your money",
        "investment return", "free money", "quick cash"
    ]

    if any(word in t for word in scam_keywords):
        return True

    # Unrealistic large numbers
    if re.search(r"\b\d{8,}\b", t):
        return True

    # Low pay → huge return
    if "earn" in t and re.search(r"\d+", t):
        numbers = [int(n) for n in re.findall(r"\d+", t)]
        if len(numbers) >= 2 and min(numbers) < 1000 and max(numbers) > 100000:
            return True

    return False

# ================= PREDICT API =================
@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Empty input"}), 400

    forced_fake = rule_based_fake(text)

    vec = vectorizer.transform([text])
    ml_pred = int(model.predict(vec)[0])
    ml_prob = float(model.predict_proba(vec)[0][ml_pred])

    if forced_fake:
        result = "fake"
        probability = max(ml_prob, 0.9)
    else:
        result = "fake" if ml_pred == 1 else "genuine"
        probability = ml_prob

    scans = load_scans()
    scans.append({
        "text": text,
        "result": result,
        "probability": probability,
        "category": get_category(text),
        "timestamp": int(time.time())
    })
    save_scans(scans)

    return jsonify({
        "result": result,
        "probability": probability
    })

# ================= DASHBOARD: SUMMARY =================
@app.route("/dashboard/summary")
def dashboard_summary():
    scans = load_scans()

    total = len(scans)
    fake = sum(1 for s in scans if s["result"] == "fake")
    genuine = sum(1 for s in scans if s["result"] == "genuine")

    categories = {}
    for s in scans:
        categories[s["category"]] = categories.get(s["category"], 0) + 1

    top_category = max(categories, key=categories.get) if categories else "-"

    return jsonify({
        "total_scans": total,
        "fake": fake,
        "genuine": genuine,
        "categories": categories,
        "top_category": top_category
    })

# ================= DASHBOARD: CATEGORIES =================
@app.route("/dashboard/categories")
def dashboard_categories():
    scans = load_scans()
    categories = {}

    for s in scans:
        categories[s["category"]] = categories.get(s["category"], 0) + 1

    return jsonify({
        "labels": list(categories.keys()),
        "counts": list(categories.values())
    })

# ================= DASHBOARD: TIMELINE =================
@app.route("/dashboard/timeline")
def dashboard_timeline():
    scans = load_scans()
    timeline = {}

    for s in scans:
        date = time.strftime("%Y-%m-%d", time.localtime(s["timestamp"]))
        if date not in timeline:
            timeline[date] = {"fake": 0, "genuine": 0}
        timeline[date][s["result"]] += 1

    return jsonify({
        "dates": list(timeline.keys()),
        "fake": [timeline[d]["fake"] for d in timeline],
        "genuine": [timeline[d]["genuine"] for d in timeline]
    })

# ================= DASHBOARD: RECENT SCANS =================
@app.route("/dashboard/recent")
def dashboard_recent():
    scans = load_scans()
    recent = scans[-5:][::-1]

    return jsonify([
        {
            "text": s["text"][:60] + ("..." if len(s["text"]) > 60 else ""),
            "result": s["result"],
            "category": s["category"],
            "time": time.strftime("%H:%M:%S", time.localtime(s["timestamp"]))
        }
        for s in recent
    ])

if __name__ == "__main__":
    app.run(debug=True)
