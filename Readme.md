
# 🛡️ AdShield AI

### Fake & Fraudulent Advertisement Detection System

🚀 **AdShield AI** is an AI-powered web application that detects **fake, scam, and fraudulent advertisements** using **Machine Learning** and **Natural Language Processing (NLP)**.

It helps users identify:

* 💼 Job scams
* 💰 Money scams
* 🏆 Lottery frauds
* ₿ Crypto scams
* 🛍️ Misleading promotions

in **real time** with high accuracy.

---

## 🌟 Key Highlights

✔ Fake / Genuine classification
✔ Confidence score for every scan
✔ Scam category detection
✔ Admin moderation & analytics dashboard
✔ Keyword trend analysis
✔ User scam reporting system

---

## 📌 Project Overview

With the rapid growth of online advertisements, scam activities have increased significantly.
**AdShield AI** analyzes advertisement text using a **trained ML model combined with rule-based intelligence**, ensuring **reliable and explainable predictions**.

🎓 **Ideal for:**

* MCA / BCA Final Year Projects
* AI / ML Demonstrations
* Cybersecurity & Fraud Detection Use Cases

---

## 🧠 Technology Stack

### 🔹 Frontend

* HTML5
* CSS3
* JavaScript (Vanilla JS)
* Chart.js (Analytics & graphs)
* AOS (Animate On Scroll)

### 🔹 Backend

* Python
* Flask
* Flask-CORS

### 🔹 Machine Learning

* Scikit-learn
* TF-IDF Vectorizer
* Logistic Regression (Binary Classification)

### 🔹 Storage

* JSON files (`scans.json`, `reports.json`)
* CSV dataset (`dataset.csv`)

---

## ✨ Features

### 🔍 1. Fake Advertisement Detection

* Detects **FAKE** or **GENUINE** ads
* Displays **confidence percentage**
* Highlights suspicious keywords
* Combines **ML prediction + rule-based validation**

📸 *Screenshot:*
`frontend/assets/screenshots/scan-page.png`

---

### 📊 2. Interactive Dashboard

* Total scanned advertisements
* Fake vs Genuine statistics
* Top scam category
* Category-wise bar chart
* Timeline trend graph
* Pie chart visualization

📸 *Screenshot:*
`frontend/assets/screenshots/dashboard.png`

---

### 🗂️ 3. Scam Category Detection

Automatically classifies ads into:

* 💰 Money Scam
* 💼 Job Scam
* 🛍️ Shopping Scam
* ₿ Crypto Scam
* 🧾 General Scam

---

### 🚨 4. Report Scam (User Module)

* Users can manually report suspicious ads
* Reports stored for admin review
* Helps improve system intelligence

📸 *Screenshot:*
`frontend/assets/screenshots/report-scam.png`

---

### 🧑‍💼 5. Admin Panel

* Secure admin login
* View all scanned advertisements
* Review & approve/reject user reports
* Clear dashboard data
* Keyword trend analysis

📸 *Screenshot:*
`frontend/assets/screenshots/admin-dashboard.png`

---

### 📈 6. Keyword Trend Analysis

* Extracts frequent keywords from verified fake ads
* Identifies emerging scam patterns
* Useful for cybersecurity research

📸 *Screenshot:*
`frontend/assets/screenshots/keyword-analysis.png`

---

## 📂 Project Folder Structure

```
AdShield/
│
├── backend/
│   ├── app.py                 # Flask backend
│   ├── train_model.py         # ML training script
│   ├── dataset.csv            # Training dataset
│   ├── model.pkl              # Trained ML model
│   ├── vectorizer.pkl         # TF-IDF vectorizer
│   ├── scans.json             # Stored scan results
│   ├── reports.json           # User reports
│
├── frontend/
│   ├── index.html             # Home page
│   ├── scan.html              # Scan advertisement
│   ├── dashboard.html         # User dashboard
│   ├── report.html            # Report scam
│   ├── admin.html             # Admin login
│   ├── admin-dashboard.html   # Admin panel
│   ├── learn.html             # Awareness page
│   ├── assets/
│   │   ├── css/style.css
│   │   └── js/script.js
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 🔹 1. Clone the Repository

```bash
git clone https://github.com/Subroto17/AdShield.git
cd AdShield
```

---

### 🔹 2. Create Virtual Environment

**Windows**

```bash
python -m venv venv
```

**macOS / Linux**

```bash
python3 -m venv venv
```

---

### 🔹 3. Activate Virtual Environment

**Windows (CMD)**

```bash
venv\Scripts\activate
```

**Windows (PowerShell)**

```bash
venv\Scripts\Activate.ps1
```

If blocked:

```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**macOS / Linux**

```bash
source venv/bin/activate
```

---

### 🔹 4. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 🔹 5. Train the Machine Learning Model

```bash
cd backend
python train_model.py
```

Generates:

* `model.pkl`
* `vectorizer.pkl`

---

### 🔹 6. Start Backend Server

```bash
python app.py
```

📍 Backend URL:

```
http://127.0.0.1:5000
```

---

### 🔹 7. Run Frontend

Open any frontend file using:

* VS Code Live Server **OR**
* Double-click `frontend/index.html`

---

## 🔐 Admin Credentials (Demo)

```
Username: ShouryaRaj
Password: Subroto@123
```

⚠️ **Note:** For production, store credentials in environment variables.

---

## 🧪 How Prediction Works

1. User submits advertisement text
2. Text is cleaned & vectorized using **TF-IDF**
3. ML model predicts **Fake / Genuine**
4. Rule-based checks verify red flags
5. Confidence score is calibrated
6. Result stored in database
7. Dashboard updates dynamically

---

## 🔮 Future Enhancements

* Deep Learning (LSTM / BERT)
* URL phishing detection
* Image-based scam detection (OCR)
* Cloud deployment (AWS / GCP)
* User authentication
* Continuous model retraining

---

## 📜 Disclaimer

This project is developed **for educational and research purposes only**.
Predictions are **probabilistic** and should not be treated as legal advice.

---

## 👨‍💻 Author

**AdShield AI**
Developed by **Subroto Raj**


