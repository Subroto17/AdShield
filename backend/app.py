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
REPORTS_FILE = os.path.join(BASE_DIR, "reports.json")

# ================= LOAD MODEL =================
try:
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("✅ Model & vectorizer loaded successfully")
except Exception:
    print("❌ Model files corrupted or missing.")
    print("👉 Run: python train_model.py")
    raise

# ================= FILE HELPERS =================
def read_json(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

# ================= CATEGORY =================
def get_category(text):
    t = text.lower()
    if any(w in t for w in ["earn", "salary", "job", "hiring", "work"]):
        return "Job Scam"
    if any(w in t for w in ["lottery", "earn", "money", "investment"]):
        return "Money Scam"
    if any(w in t for w in ["job", "salary", "hiring"]):
        return "Job Scam"
    if any(w in t for w in ["free", "offer", "discount"]):
        return "Shopping Scam"
    if any(w in t for w in ["crypto", "bitcoin"]):
        return "Crypto Scam"
    return "General Scam"

# ================= RULE BASED =================
def rule_based_fake(text):
    t = text.lower()

    scam_keywords = [
        "lottery", "win", "winner", "earn", "money", "profit",
        "investment", "guaranteed", "double", "free", "offer",
        "register", "registration", "apply", "job", "salary",
        "work from home", "click", "link", "limited time",
        "hurry", "fast", "instant", "no experience"
    ]

    # Large numbers (phone, prize amounts)
    if re.search(r"\b\d{4,}\b", t):
        return True

    # Keyword-based scam detection
    if any(word in t for word in scam_keywords):
        return True

    return False


# ================= PREDICT =================
@app.route("/predict", methods=["POST"])
def predict():
    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"error": "Empty input"}), 400

    # Rule-based detection
    forced_fake = rule_based_fake(text)

    # ML prediction
    vec = vectorizer.transform([text])
    probs = model.predict_proba(vec)[0]

    genuine_prob = float(probs[0])
    fake_prob = float(probs[1])

    # SAFETY-FIRST DECISION
    THRESHOLD = 0.6  # you can tune this (0.5–0.7)

    if forced_fake or fake_prob >= THRESHOLD:
        result = "fake"
        probability = max(fake_prob, 0.85)
    else:
        result = "genuine"
        probability = genuine_prob

    # Save scan
    scans = read_json(SCANS_FILE)
    scans.append({
        "text": text[:200],
        "result": result,
        "probability": round(probability, 2),
        "category": get_category(text),
        "timestamp": int(time.time()),
        "source": "system"
    })
    write_json(SCANS_FILE, scans)

    return jsonify({
        "result": result,
        "probability": round(probability, 2)
    })

    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"error": "Empty input"}), 400

    forced_fake = rule_based_fake(text)

    vec = vectorizer.transform([text])
    pred = int(model.predict(vec)[0])
    probs = model.predict_proba(vec)[0]

    fake_prob = probs[1]  # probability of FAKE class
    genuine_prob = probs[0]

# Safety-first decision
    if forced_fake or fake_prob >= 0.6:
        result = "fake"
        probability = max(fake_prob, 0.85)
    else:
        result = "genuine"
        probability = genuine_prob


    result = "fake" if forced_fake or pred == 1 else "genuine"
    probability = max(prob, 0.9) if forced_fake else prob

    scans = read_json(SCANS_FILE)
    scans.append({
        "text": text[:200],
        "result": result,
        "probability": round(probability, 2),
        "category": get_category(text),
        "timestamp": int(time.time()),
        "source": "system"
    })
    write_json(SCANS_FILE, scans)

    return jsonify({"result": result, "probability": probability})

# ================= DASHBOARD =================
@app.route("/dashboard/summary")
def summary():
    scans = read_json(SCANS_FILE)
    cats = Counter(s["category"] for s in scans)

    return jsonify({
        "total_scans": len(scans),
        "fake": sum(1 for s in scans if s["result"] == "fake"),
        "genuine": sum(1 for s in scans if s["result"] == "genuine"),
        "top_category": cats.most_common(1)[0][0] if cats else "-"
    })

@app.route("/dashboard/categories")
def categories():
    scans = read_json(SCANS_FILE)
    c = Counter(s["category"] for s in scans)
    return jsonify({
        "labels": list(c.keys()),
        "counts": list(c.values())
    })

@app.route("/dashboard/timeline")
def timeline():
    scans = read_json(SCANS_FILE)
    t = defaultdict(lambda: {"fake": 0, "genuine": 0})

    for s in scans:
        d = time.strftime("%Y-%m-%d", time.localtime(s["timestamp"]))
        t[d][s["result"]] += 1

    dates = sorted(t.keys())
    return jsonify({
        "dates": dates,
        "fake": [t[d]["fake"] for d in dates],
        "genuine": [t[d]["genuine"] for d in dates]
    })

# ================= USER REPORT =================
@app.route("/report", methods=["POST"])
def report():
    data = request.json

    description = data.get("description", "").strip()
    scam_type = data.get("scam_type", "Unknown")
    ad_link = data.get("ad_link", "")

    if not description:
        return jsonify({"success": False, "message": "Description required"}), 400

    reports = read_json(REPORTS_FILE)

    reports.append({
        "id": int(time.time()),
        "text": description[:300],
        "category": scam_type,
        "link": ad_link,
        "timestamp": int(time.time()),
        "status": "pending"
    })

    write_json(REPORTS_FILE, reports)

    return jsonify({
        "success": True,
        "message": "Report submitted successfully"
    })

# ================= ADMIN LOGIN =================
@app.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.json
    if data.get("username") == "ShouryaRaj" and data.get("password") == "Subroto@123":
        return jsonify({"success": True})
    return jsonify({"success": False}), 401

# ================= ADMIN SCANS (FIX) =================
@app.route("/admin/scans", methods=["GET"])
def admin_scans():
    scans = read_json(SCANS_FILE)
    scans = sorted(scans, key=lambda x: x["timestamp"], reverse=True)
    return jsonify(scans)

# ================= ADMIN REPORTS =================
@app.route("/admin/reports")
def admin_reports():
    return jsonify(read_json(REPORTS_FILE))

@app.route("/admin/approve/<int:rid>", methods=["POST"])
def approve_report(rid):
    reports = read_json(REPORTS_FILE)
    scans = read_json(SCANS_FILE)

    for r in reports:
        if r["id"] == rid and r["status"] == "pending":
            r["status"] = "approved"
            scans.append({
                "text": r["text"][:200],
                "result": "fake",
                "probability": 1.0,
                "category": r["category"],
                "timestamp": int(time.time()),
                "source": "admin_verified"
            })

    write_json(REPORTS_FILE, reports)
    write_json(SCANS_FILE, scans)
    return jsonify({"status": "approved"})

@app.route("/admin/reject/<int:rid>", methods=["POST"])
def reject_report(rid):
    reports = read_json(REPORTS_FILE)
    for r in reports:
        if r["id"] == rid:
            r["status"] = "rejected"
    write_json(REPORTS_FILE, reports)
    return jsonify({"status": "rejected"})

@app.route("/admin/clear", methods=["POST"])
def clear_all_data():
    # Clear scanned ads
    with open("scans.json", "w") as f:
        json.dump([], f)

    # Clear user reports
    with open("reports.json", "w") as f:
        json.dump([], f)

    return jsonify({"message": "All data cleared"}), 200


# ================= KEYWORD TRENDS =================
@app.route("/admin/keywords")
def keyword_trends():
    scans = read_json(SCANS_FILE)

    keywords = []
    stopwords = {
        "the","is","and","to","of","for","a","in","on","with",
        "your","you","from","this","that","by"
    }

    for s in scans:
        if s["result"] == "fake":
            words = re.findall(r"[a-zA-Z]{4,}", s["text"].lower())
            keywords.extend([w for w in words if w not in stopwords])

    counts = Counter(keywords).most_common(10)

    return jsonify({
        "labels": [k for k, _ in counts],
        "counts": [v for _, v in counts]
    })

# ================= START =================
if __name__ == "__main__":
    app.run(debug=True)