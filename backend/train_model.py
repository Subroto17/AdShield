import pandas as pd
import re
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

# ---------------- LOAD DATA ---------------- #
df = pd.read_csv("dataset.csv")

# Map labels to 0/1
df["label"] = df["label"].astype(str).str.lower().replace({
    "fake": 1,
    "spam": 1,
    "fraud": 1,
    "genuine": 0,
    "real": 0
})

# ---------------- CLEAN TEXT ---------------- #
def clean(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

df["clean_text"] = df["text"].apply(clean)

# ---------------- TF-IDF ---------------- #
vectorizer = TfidfVectorizer(
    max_features=3000,
    stop_words="english"
)

X = vectorizer.fit_transform(df["clean_text"])
y = df["label"]

# ---------------- SPLIT ---------------- #
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ---------------- TRAIN MODEL ---------------- #
model = LogisticRegression(max_iter=700)
model.fit(X_train, y_train)

# ---------------- RESULTS ---------------- #
preds = model.predict(X_test)
print("\nModel accuracy report:\n")
print(classification_report(y_test, preds))

# ---------------- SAVE MODEL ---------------- #
joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")

print("\nmodel.pkl & vectorizer.pkl saved successfully!")
