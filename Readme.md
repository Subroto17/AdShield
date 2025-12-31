# 🛡️ AdShield — Fake & Fraudulent Advertisement Detection System

### 🔍 AI-powered Web Platform to Identify Scam, Fraud & Fake Online Advertisements

AdShield is a machine-learning powered system designed to **detect fake online advertisements**, including job scams, money scams, crypto fraud, shopping scams, and phishing promotions.  
It uses **NLP + Classification Models (Logistic Regression)** with TF-IDF to determine whether an advertisement is **FAKE** or **GENUINE**, while also identifying its **risk category**.

This project includes a complete **end-to-end solution**:

- 🖥️ Modern Multi-Page UI (HTML + CSS + JS + Bootstrap)
- ⚙️ Flask Backend API
- 🤖 ML Model (TF-IDF + Logistic Regression)
- 📊 Real-Time Analytics Dashboard
- 🗄️ JSON Database (scans.json)
- 💡 Highlighting suspicious words
- 📝 Fully MCA-ready with documentation

---

# ⭐ 1. Features

### 🔥 Fake Ad Detection

- Classifies ads as **Fake** or **Genuine**
- Shows **confidence percentage**
- Displays a colored risk indicator
- Highlights suspicious scam-related words

### 🔥 Automatic Category Detection

Detects the type of scam:

- 💰 Money Scam
- 💼 Job Scam
- 🛍️ Shopping Scam
- ₿ Crypto Scam
- 🆔 KYC Fraud
- 🌐 General Ads

### 🔥 Real-Time Interactive Dashboard

Includes:

- Total scanned ads
- Fake vs Genuine count
- Top scam category
- Category-wise chart
- Fake/Genuine timeline
- Pie chart visual

### 🔥 JSON-Based Storage

Every scan is saved in `scans.json` with:

- Text
- Result
- Probability
- Category
- Timestamp

### 🔥 Modern UI/UX

- Clean blue → teal gradient theme
- Smooth loader animation
- Multiple pages (Scan, Report, Admin, Dashboard, Home, Learn)
- Fully responsive

---

# ⭐ 2. Project Structure

```
Fake-Ad Detector/
│── backend/
│   ├── app.py
│   ├── train_model.py
│   ├── dataset.csv
│   ├── model.pkl          ← generated
│   ├── vectorizer.pkl     ← generated
│   ├── scans.json         ← auto-generated
│
│── frontend/
│   ├── index.html
│   ├── scan.html
│   ├── dashboard.html
│   ├── learn.html
│   ├── report.html
│   ├── admin.html
│   ├── style.css
│   └── script.js
│
│── requirements.txt
│── README.md
│── .gitignore
```

---

# ⭐ 3. Virtual Environment Setup (VERY IMPORTANT)

Using a virtual environment keeps your backend clean and error-free.

## 🟦 Create Virtual Environment

### Windows:

```
python -m venv venv
```

### macOS / Linux:

```
python3 -m venv venv
```

---

## 🟦 Activate Virtual Environment

### Windows PowerShell:

```
venv\Scripts\Activate.ps1
```

If blocked:

```
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then:

```
venv\Scripts\Activate.ps1
```

### Windows CMD:

```
venv\Scripts\activate.bat
```

### macOS / Linux:

```
source venv/bin/activate
```

You'll see:

```
(venv) PS C:\Users\...
```

---

## 🟦 Install Dependencies

```
pip install -r requirements.txt
```

---

## 🟦 Run ML Model Training

```
python train_model.py
```

This generates:

```
model.pkl
vectorizer.pkl
```

---

## 🟦 Start Backend Server

```
python app.py
```

Backend URL:

```
http://127.0.0.1:5000/
```

---

## 🟦 Deactivate Virtual Environment

```
deactivate
```

---

# ⭐ 4. API Endpoints

## 🔹 **POST /predict**

Predicts if an advertisement is fake.

**Request:**

```json
{
  "text": "Earn 5000 rupees daily from home"
}
```

**Response:**

```json
{
  "result": "fake",
  "probability": 0.89,
  "category": "money"
}
```

---

## 🔹 **GET /dashboard/summary**

Stats for dashboard.

Returns:

- total scans
- fake
- genuine
- categories
- top category

---

## 🔹 **GET /dashboard/categories**

Returns labels and counts for bar chart.

---

## 🔹 **GET /dashboard/timeline**

Returns dates + fake/genuine counts per day.

---

# ⭐ 5. Installation & Running Full Project

## 🔸 Step 1 — Clone

```
git clone https://github.com/Subroto17/AdShield.git
cd AdShield
```

## 🔸 Step 2 — Create & Activate venv

(See virtual environment section above)

## 🔸 Step 3 — Install libraries

```
pip install -r requirements.txt
```

## 🔸 Step 4 — Train model

```
python train_model.py
```

## 🔸 Step 5 — Run backend

```
python app.py
```

## 🔸 Step 6 — Open frontend

Double-click:

```
frontend/index.html
```

or use **Live Server** in VS Code.

---

# ⭐ 6. Screenshots

(Add your screenshots here)

```
📌 dashboard preview
📌 scan results page
📌 home page UI
📌 charts
```

---

# ⭐ 7. Future Enhancements

- Image OCR (scan text from screenshots)
- URL phishing detection
- Admin authentication
- Cloud deployment
- Push notifications for trending scams
- Auto ML re-training module



