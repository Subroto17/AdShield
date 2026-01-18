import pandas as pd
import re
import joblib
import os
import sys
import tempfile
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# ---------------- PATHS ---------------- #
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "vectorizer.pkl")

# ---------------- CHECK DATASET ---------------- #
if not os.path.exists(DATASET_PATH):
    print("❌ dataset.csv not found.")
    sys.exit(1)

df = pd.read_csv(DATASET_PATH)

required_cols = {"text", "label"}
if not required_cols.issubset(df.columns):
    print("❌ dataset.csv must contain columns: text, label")
    sys.exit(1)

# ---------------- CLEAN TEXT ---------------- #
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

df["clean_text"] = df["text"].apply(clean_text)

# ---------------- NORMALIZE LABELS ---------------- #
df["label"] = df["label"].astype(str).str.lower()
df["label"] = df["label"].replace({
    "fake": 1,
    "spam": 1,
    "genuine": 0,
    "real": 0
})

# Remove invalid rows
df = df[df["label"].isin([0, 1])]

# ---------------- 🔥 ADDITION 1: REMOVE DUPLICATES ---------------- #
before = len(df)
df = df.drop_duplicates(subset=["clean_text", "label"])
after = len(df)
print(f"🧹 Removed duplicates: {before - after}")

# ---------------- 🔥 ADDITION 2: CLASS BALANCE CHECK ---------------- #
print("\n📊 Class distribution:")
print(df["label"].value_counts())

# ---------------- TRAIN TEST SPLIT ---------------- #
X = df["clean_text"]
y = df["label"]

# ---------------- 🔥 IMPROVED VECTORIZER (SAFE) ---------------- #
vectorizer = TfidfVectorizer(
    stop_words="english",
    max_features=5000,
    ngram_range=(1, 2),
    min_df=2,     # ignore very rare words
    max_df=0.95   # ignore extremely common words
)

X_vec = vectorizer.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_vec,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y  # 🔥 important for fairness
)

# ---------------- TRAIN MODEL ---------------- #
model = LogisticRegression(
    max_iter=500,
    class_weight="balanced"  # 🔥 handles imbalance
)

model.fit(X_train, y_train)

# ---------------- EVALUATE ---------------- #
preds = model.predict(X_test)
acc = accuracy_score(y_test, preds)

print("\n✅ Training completed")
print(f"📊 Accuracy: {acc * 100:.2f}%\n")

print("📑 Classification Report:")
print(classification_report(y_test, preds))

# ---------------- SAFE SAVE FUNCTION ---------------- #
def safe_save(obj, path):
    dir_name = os.path.dirname(path)
    with tempfile.NamedTemporaryFile("wb", dir=dir_name, delete=False) as tf:
        joblib.dump(obj, tf.name)
        temp_name = tf.name
    os.replace(temp_name, path)

# ---------------- SAVE FILES SAFELY ---------------- #
try:
    safe_save(model, MODEL_PATH)
    safe_save(vectorizer, VECTORIZER_PATH)
    print("\n✅ model.pkl and vectorizer.pkl saved safely")
except Exception as e:
    print("\n❌ Failed to save model files")
    print("Error:", e)
    sys.exit(1)

print("\n👉 NEXT STEPS:")
print("1. Stop this script")
print("2. Start backend server: python app.py")