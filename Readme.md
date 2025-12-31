**************************************  BACKEND THINGS *****************************************8

1. First create the virtual environment
    a. python -m venv venv

2. Then activate the virtual environment
    a. venv\Scripts\activate

3. Install all the requirements
    a. pip install -r requirements.txt

    b. If PIP give permission issue  "python -m pip install -r requirements.txt"

4. Train the model
    a. python train_model.py
        You should see 
          "Model Accuracy: XX%
           model.pkl and vectorizer.pkl generated successfully!"

5. Run the flask backend
    a. python app.py
        You should see
          " Running on http://127.0.0.1:5000
            Model & Vectorizer Loaded Successfully!"

            
