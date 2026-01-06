from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import json
import time
import re
import sys
import tempfile

# ---------------- APP SETUP ---------------- #
app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "vectorizer.pkl")
SCANS_FILE = os.path.join(BASE_DIR, "scans.json")

# ---------------- SAFE MODEL LOADING ---------------- #
def load_model_safe():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        print("\n❌ Model files not found.")
        print("👉 Run: python train_model.py")
        sys.exit(1)

    try:
        model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)
        print("✅ Model & Vectorizer loaded successfully")
        return model, vectorizer
    except Exception as e:
        print("\n❌ Model files corrupted.")
        print("👉 Delete model.pkl & vectorizer.pkl")
        print("👉 Run: python train_model.py")
        print("Error:", e)
        sys.exit(1)

model, vectorizer = load_model_safe()

# ---------------- SAFE JSON HELPERS ---------------- #
def load_scans():
    if not os.path.exists(SCANS_FILE):
        return []
    try:
        with open(SCANS_FILE, "r") as f:
            return json.load(f)
    except:
        return []

def safe_write_json(path, data):
    dir_name = os.path.dirname(path)
    with tempfile.NamedTemporaryFile("w", dir=dir_name, delete=False) as tf:
        json.dump(data, tf, indent=4)
        temp_name = tf.name
    os.replace(temp_name, path)

# ---------------- RULE-BASED SCAM LOGIC ---------------- #
def contains_huge_money(text):
    numbers = re.findall(r"\d+", text)
    for num in numbers:
        try:
            if int(num) >= 10_000_000:  # 1 crore+
                return True
        except:
            continue
    return False

def rule_based_scam(text):
    text = text.lower()

    lottery_words = ["lottery", "lucky draw", "jackpot"]
    earn_words = ["earn", "win", "profit", "guaranteed"]

    if any(w in text for w in lottery_words) and any(w in text for w in earn_words):
        return True

    if contains_huge_money(text):
        return True

    return False

# ---------------- CATEGORY DETECTION ---------------- #
def get_category(text):
    text = text.lower()

    if any(w in text for w in ["earn", "money", "profit", "income"]):
        return "money"
    if any(w in text for w in ["job", "hiring", "vacancy", "salary"]):
        return "job"
    if any(w in text for w in ["lottery", "jackpot", "lucky"]):
        return "lottery"
    if any(w in text for w in ["crypto", "bitcoin", "investment"]):
        return "crypto"

    return "general"

# ---------------- HEALTH CHECK ---------------- #
@app.route("/health")
def health():
    return jsonify({"status": "ok"})

# ---------------- PREDICTION API ---------------- #
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "No text provided"}), 400

    vector = vectorizer.transform([text])

    ml_pred = model.predict(vector)[0]
    ml_prob = model.predict_proba(vector)[0][ml_pred]

    label = "fake" if ml_pred == 1 else "genuine"
    probability = float(ml_prob)

    # -------- RULE OVERRIDE -------- #
    if rule_based_scam(text):
        label = "fake"
        probability = max(probability, 0.85)

    category = get_category(text)

    scans = load_scans()
    scans.append({
        "text": text,
        "result": label,
        "category": category,
        "probability": probability,
        "timestamp": int(time.time())
    })

    safe_write_json(SCANS_FILE, scans)

    return jsonify({
        "result": label,
        "probability": probability,
        "category": category
    })

# ---------------- DASHBOARD SUMMARY ---------------- #
@app.route("/dashboard/summary")
def dashboard_summary():
    scans = load_scans()

    total = len(scans)
    fake = sum(1 for s in scans if s["result"] == "fake")
    genuine = sum(1 for s in scans if s["result"] == "genuine")

    categories = {}
    for s in scans:
        categories[s["category"]] = categories.get(s["category"], 0) + 1

    top_category = max(categories, key=categories.get) if categories else "none"

    return jsonify({
        "total_scans": total,
        "fake": fake,
        "genuine": genuine,
        "categories": categories,
        "top_category": top_category
    })

# ---------------- DASHBOARD TIMELINE ---------------- #
@app.route("/dashboard/timeline")
def dashboard_timeline():
    scans = load_scans()
    timeline = {}

    for s in scans:
        date = time.strftime("%Y-%m-%d", time.localtime(s["timestamp"]))
        timeline.setdefault(date, {"fake": 0, "genuine": 0})
        timeline[date][s["result"]] += 1

    return jsonify({
        "dates": list(timeline.keys()),
        "fake": [timeline[d]["fake"] for d in timeline],
        "genuine": [timeline[d]["genuine"] for d in timeline]
    })

# ---------------- DASHBOARD CATEGORIES ---------------- #
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

# ---------------- RUN SERVER ---------------- #
if __name__ == "__main__":
    app.run(debug=True)
