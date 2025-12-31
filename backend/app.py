from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os, time
import joblib

app = Flask(__name__)
CORS(app)

# ---------------- LOAD MODEL ---------------- #
model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

SCANS_FILE = "scans.json"

# ---------------- JSON HELPERS ---------------- #
def load_scans():
    if not os.path.exists(SCANS_FILE):
        return []
    try:
        with open(SCANS_FILE, "r") as f:
            return json.load(f)
    except:
        return []

def save_scans(data):
    with open(SCANS_FILE, "w") as f:
        json.dump(data, f, indent=4)

# ---------------- CATEGORY DETECTION ---------------- #
def get_category(text):
    text = text.lower()
    money = ["earn", "income", "profit", "money", "cash", "work from home"]
    job = ["job", "hiring", "interview", "salary"]
    shop = ["free", "offer", "discount", "sale"]
    crypto = ["crypto", "btc", "bitcoin", "investment"]
    kyc = ["kyc", "verification", "blocked"]

    if any(w in text for w in money): return "money"
    if any(w in text for w in job): return "job"
    if any(w in text for w in shop): return "shopping"
    if any(w in text for w in crypto): return "crypto"
    if any(w in text for w in kyc): return "kyc"
    return "general"

# ---------------- PREDICT API ---------------- #
@app.route("/predict", methods=["POST"])
def predict():
    try:
        text = request.json.get("text", "")

        vec = vectorizer.transform([text])
        pred = model.predict(vec)[0]          # 0 or 1
        prob = model.predict_proba(vec)[0][pred]

        label = "fake" if pred == 1 else "genuine"
        category = get_category(text)

        scans = load_scans()
        scans.append({
            "text": text,
            "result": label,
            "probability": float(prob),
            "category": category,
            "timestamp": int(time.time())
        })
        save_scans(scans)

        return jsonify({
            "result": label,
            "probability": float(prob),
            "category": category
        })

    except Exception as e:
        print("Prediction Error:", e)
        return jsonify({"error": "Prediction failed!"}), 500


# ---------------- DASHBOARD SUMMARY ---------------- #
@app.route("/dashboard/summary")
def dashboard_summary():
    scans = load_scans()

    total = len(scans)
    fake = sum(1 for x in scans if x["result"] == "fake")
    genuine = total - fake

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
        d = time.strftime("%Y-%m-%d", time.localtime(s["timestamp"]))
        if d not in timeline:
            timeline[d] = {"fake": 0, "genuine": 0}
        timeline[d][s["result"]] += 1

    dates = list(timeline.keys())
    fake = [timeline[d]["fake"] for d in dates]
    genuine = [timeline[d]["genuine"] for d in dates]

    return jsonify({"dates": dates, "fake": fake, "genuine": genuine})

# ---------------- CATEGORY CHART ---------------- #
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
