from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json, os, time, re
from collections import Counter, defaultdict

# ================= APP =================
app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "vectorizer.pkl")
SCANS_FILE = os.path.join(BASE_DIR, "scans.json")

# ================= LOAD MODEL (SAFE) =================
try:
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("✅ Model & vectorizer loaded successfully")
except Exception as e:
    print("❌ Model files corrupted or missing.")
    print("👉 Run: python train_model.py")
    raise e

# ================= STORAGE HELPERS =================
def load_scans():
    if not os.path.exists(SCANS_FILE):
        return []
    try:
        with open(SCANS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def save_scans(scans):
    with open(SCANS_FILE, "w", encoding="utf-8") as f:
        json.dump(scans, f, indent=2)

# ================= CATEGORY LOGIC =================
def get_category(text):
    t = text.lower()
    if any(w in t for w in ["lottery", "earn", "money", "investment", "profit"]):
        return "Money Scam"
    if any(w in t for w in ["job", "salary", "hiring", "vacancy"]):
        return "Job Scam"
    if any(w in t for w in ["free", "offer", "voucher", "discount"]):
        return "Shopping Scam"
    if any(w in t for w in ["crypto", "bitcoin", "trading"]):
        return "Crypto Scam"
    return "General Scam"

# ================= RULE-BASED OVERRIDE =================
def rule_based_fake(text):
    t = text.lower()

    scam_keywords = [
        "lottery", "guaranteed", "double your money",
        "earn money fast", "free money", "quick cash"
    ]

    if any(word in t for word in scam_keywords):
        return True

    # Unrealistic numbers
    if re.search(r"\b\d{8,}\b", t):
        return True

    # Low pay + huge return
    nums = [int(n) for n in re.findall(r"\d+", t)]
    if len(nums) >= 2 and min(nums) < 1000 and max(nums) > 100000:
        return True

    return False

# ================= SCAN API =================
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
        "text": text[:200],
        "result": result,
        "probability": round(probability, 2),
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

    categories = Counter(s["category"] for s in scans)
    top_category = categories.most_common(1)[0][0] if categories else "-"

    return jsonify({
        "total_scans": total,
        "fake": fake,
        "genuine": genuine,
        "top_category": top_category
    })

# ================= DASHBOARD: CATEGORY BAR =================
@app.route("/dashboard/categories")
def dashboard_categories():
    scans = load_scans()
    categories = Counter(s["category"] for s in scans)

    return jsonify({
        "labels": list(categories.keys()),
        "counts": list(categories.values())
    })

# ================= DASHBOARD: TIMELINE =================
@app.route("/dashboard/timeline")
def dashboard_timeline():
    scans = load_scans()
    timeline = defaultdict(lambda: {"fake": 0, "genuine": 0})

    for s in scans:
        date = time.strftime("%Y-%m-%d", time.localtime(s["timestamp"]))
        timeline[date][s["result"]] += 1

    dates = sorted(timeline.keys())
    return jsonify({
        "dates": dates,
        "fake": [timeline[d]["fake"] for d in dates],
        "genuine": [timeline[d]["genuine"] for d in dates]
    })

# ================= DASHBOARD: RECENT SCANS =================
@app.route("/dashboard/recent")
def dashboard_recent():
    scans = load_scans()[-10:][::-1]
    return jsonify(scans)

# ================= REPORT SCAM API =================
@app.route("/report", methods=["POST"])
def report_scam():
    data = request.json

    scam_type = data.get("scam_type", "").strip()
    ad_link = data.get("ad_link", "").strip()
    description = data.get("description", "").strip()

    if not scam_type or not description:
        return jsonify({"error": "Invalid report data"}), 400

    scans = load_scans()

    scans.append({
        "text": description,
        "result": "fake",
        "probability": 1.0,
        "category": scam_type.lower(),
        "timestamp": int(time.time()),
        "source": "user_report",
        "ad_link": ad_link
    })

    save_scans(scans)

    return jsonify({
        "message": "Report submitted successfully"
    })


# ================= START =================
if __name__ == "__main__":
    app.run(debug=True)
