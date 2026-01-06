from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import os
import sys
import time
import tempfile

# ---------------- APP INIT ---------------- #
app = Flask(__name__)
CORS(app)

# ---------------- PATHS ---------------- #
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
        print("✅ Model & Vectorizer loaded successfully.")
        return model, vectorizer
    except Exception as e:
        print("\n❌ Model files are corrupted.")
        print("👉 Stop server, retrain model, then restart.")
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

# ---------------- CATEGORY DETECTION ---------------- #
def get_category(text):
    text = text.lower()

    categories = {
        "money": ["earn", "income", "profit", "money", "cash", "work from home"],
        "job": ["job", "hiring", "interview", "vacancy", "salary"],
        "shopping": ["free", "offer", "discount", "sale", "voucher"],
        "crypto": ["crypto", "btc", "bitcoin", "investment", "trading"],
        "kyc": ["kyc", "verification", "account blocked"]
    }

    for category, words in categories.items():
        if any(word in text for word in words):
            return category

    return "general"

# ---------------- HEALTH CHECK ---------------- #
@app.route("/health")
def health():
    return jsonify({"status": "ok"})

# ---------------- SCAN API ---------------- #
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "No text provided"}), 400

    vector = vectorizer.transform([text])
    prediction = model.predict(vector)[0]
    probability = model.predict_proba(vector)[0][prediction]

    label = "fake" if prediction == 1 else "genuine"
    category = get_category(text)

    scans = load_scans()
    scans.append({
        "text": text,
        "result": label,
        "category": category,
        "probability": float(probability),
        "timestamp": int(time.time())
    })

    safe_write_json(SCANS_FILE, scans)

    return jsonify({
        "result": label,
        "probability": float(probability),
        "category": category
    })

# ---------------- DASHBOARD APIs ---------------- #
@app.route("/dashboard/summary")
def dashboard_summary():
    scans = load_scans()

    total = len(scans)
    fake = sum(1 for x in scans if x["result"] == "fake")
    genuine = sum(1 for x in scans if x["result"] == "genuine")

    categories = {}
    for scan in scans:
        cat = scan["category"]
        categories[cat] = categories.get(cat, 0) + 1

    top_category = max(categories, key=categories.get) if categories else "none"

    return jsonify({
        "total_scans": total,
        "fake": fake,
        "genuine": genuine,
        "categories": categories,
        "top_category": top_category
    })

@app.route("/dashboard/categories")
def dashboard_categories():
    scans = load_scans()

    categories = {}
    for scan in scans:
        cat = scan["category"]
        categories[cat] = categories.get(cat, 0) + 1

    return jsonify({
        "labels": list(categories.keys()),
        "counts": list(categories.values())
    })

@app.route("/dashboard/timeline")
def dashboard_timeline():
    scans = load_scans()

    timeline = {}
    for scan in scans:
        date = time.strftime("%Y-%m-%d", time.localtime(scan["timestamp"]))
        timeline.setdefault(date, {"fake": 0, "genuine": 0})
        timeline[date][scan["result"]] += 1

    return jsonify({
        "dates": list(timeline.keys()),
        "fake": [timeline[d]["fake"] for d in timeline],
        "genuine": [timeline[d]["genuine"] for d in timeline]
    })

# ---------------- RUN SERVER ---------------- #
if __name__ == "__main__":
    app.run(debug=True)
