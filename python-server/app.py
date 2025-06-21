from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import bcrypt
import jwt
import os
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import psycopg2
import joblib
from keybert import KeyBERT
import re
from rapidfuzz import fuzz
import nltk
from symspellpy.symspellpy import SymSpell, Verbosity
# nltk.download()
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('averaged_perceptron_tagger')
nltk.download('averaged_perceptron_tagger_eng')

from nltk import pos_tag, word_tokenize


app = Flask(__name__)
CORS(app, supports_credentials=True)

SECRET_KEY = "secret"  # Store this in an env variable in production

# Database connection
connection = psycopg2.connect(
    dbname="sgis",
    user="postgres",
    password="123456",
    host="localhost",
    port="5432"
)


kw_model = KeyBERT(model='all-MiniLM-L6-v2')


UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/")
def home():
    print("Server working")
    return jsonify({"message": "working"}), 200

@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


    try:
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO users (email, password) VALUES (%s, %s)", (email, hashed_password))
            connection.commit()
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        print("Error creating user:", e)
        return jsonify({"error": "Error creating user"}), 400

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
            user = cursor.fetchone()
            
            if not user or not bcrypt.checkpw(password.encode("utf-8"), user[-1].encode("utf-8")):
                return jsonify({"error": "Invalid credentials"}), 400

            token = jwt.encode({"userId": user[0], "exp": datetime.utcnow() + timedelta(hours=1)}, SECRET_KEY, algorithm="HS256")
            return jsonify({"token": token}), 200
    except Exception as e:
        print("Login error:", e)
        return jsonify({"error": "Login failed"}), 500

@app.route("/submit-homework", methods=["POST"])
def submit_homework():
    email = request.form.get("email")
    student_name = request.form.get("student_name")
    subject = request.form.get("subject")
    teacher = request.form.get("teacher")
    notes = request.form.get("notes", None)
    file = request.files.get("file")


    if not all([email, student_name, subject, teacher, file]):
        return jsonify({"error": "All required fields must be filled."}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)
    file_url = f"{request.scheme}://{request.host}/uploads/{filename}"
    file_size_kb = f"{os.path.getsize(filepath)/1024:.2f} KB"

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """INSERT INTO homework_submissions 
                (email, student_name, subject, teacher, notes, file_name, file_size, file_url) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (email, student_name, subject, teacher, notes, filename, file_size_kb, file_url)
            )
            connection.commit()
        return jsonify({"message": "Homework submitted successfully!"}), 201
    except Exception as e:
        print("Error submitting homework:", e)
        return jsonify({"error": "Internal Server Error"}), 500

@app.route("/uploads/<filename>")
def get_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

@app.route("/homework/<email>", methods=["GET"])
def get_homework(email):
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM homework_submissions WHERE email = %s ORDER BY submitted_at DESC",
                (email,)
            )
            result = cursor.fetchall()

            hmwk_list = []
            for row in result:
                hmwk = {
                    "id": row[0],
                    "email": row[1],
                    "studentName": row[2],
                    "subject": row[3],
                    "date": row[-1].isoformat(), 
                    "teacher": row[4],
                    "notes": row[5],
                    "file_name": row[6],
                    "file_size": row[7],
                    "file_url": row[8],
                }
                hmwk_list.append(hmwk)

            return jsonify(hmwk_list), 200
    except Exception as e:
        print("Error fetching homework:", e)
        return jsonify({"error": "Internal Server Error"}), 500

sym_spell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)

dictionary_path = "symspell_dictionaries/frequency_dictionary_en_82_765.txt"
custom_dictionary_path = "symspell_dictionaries/symspell_frequency_list.txt"
term_index = 0  
count_index = 1  
sym_spell.load_dictionary(dictionary_path, term_index, count_index)
sym_spell.load_dictionary(custom_dictionary_path, term_index, count_index)

def correct_spelling(text):
    words = text.split()
    corrected_words = []

    for word in words:
        suggestions = sym_spell.lookup(word, Verbosity.CLOSEST, max_edit_distance=2)
        if suggestions:
            corrected_words.append(suggestions[0].term)
        else:
            corrected_words.append(word)

    return ' '.join(corrected_words)

def sanitize_tag(tag):
    tag = re.sub(r'[^\w\s]', '', tag.lower().strip())
    words = sorted(tag.split())  # Sort to reduce near-duplicates like "fan classroom" vs "classroom fan"
    return ' '.join(words)

def is_valid_tag(tag):
    if not tag:
        return False
    if re.match(r'^\d', tag):  # Starts with number
        return False
    if re.search(r'\d', tag):  # Contains number
        return False
    if len(tag.split()) < 2:  # Must have at least two words
        return False
    return validate_pos(tag)

# def validate_pos(tag):
#     tokens = word_tokenize(tag)
#     pos_tags = pos_tag(tokens)
#     # Allow adjectives (JJ), nouns (NN, NNS, NNP, NNPS)
#     allowed_tags = {'JJ', 'JJR', 'JJS', 'NN', 'NNS', 'NNP', 'NNPS'}
#     has_noun = any(pos.startswith('NN') for _, pos in pos_tags)
#     all_allowed = all(pos in allowed_tags for _, pos in pos_tags)
#     return has_noun and all_allowed

import spacy

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")

def validate_pos(tag):
    doc = nlp(tag)
    
    # Check if it's a valid noun chunk (meaningful phrase)
    for chunk in doc.noun_chunks:
        if chunk.text.lower() == tag.lower():
            return True

    return False


def get_existing_tags(cursor):
    cursor.execute("SELECT id, tag_name FROM tags")
    return cursor.fetchall()

def find_similar_tag(sanitized_tag, existing_tags, threshold=85):
    best_match = None
    highest_score = 0

    for tag_id, existing_tag in existing_tags:
        score = fuzz.token_set_ratio(sanitized_tag, existing_tag)
        if score >= threshold and score > highest_score:
            best_match = tag_id
            highest_score = score

    return best_match

def process_complaint_tags(cursor, complaint_id, description):
    description = correct_spelling(description)
    tags = kw_model.extract_keywords(description, keyphrase_ngram_range=(1, 4), stop_words='english', top_n=10, use_maxsum=True, nr_candidates=20)
    print(f"Extracted tags for complaint {complaint_id}: {tags}")

    clean_tags = []
    for tag in tags:
        sanitized_tag = sanitize_tag(tag[0])
        if is_valid_tag(sanitized_tag):
            clean_tags.append(sanitized_tag)

    print(f"Cleaned tags for complaint {complaint_id}: {clean_tags}")

    try:
        existing_tags = get_existing_tags(cursor)
        complaint_tag_ids = [] 

        for tag in clean_tags:
            similar_tag_id = find_similar_tag(tag, existing_tags)

            if similar_tag_id:
                if similar_tag_id in complaint_tag_ids:
                    # If similar tag was already linked to this complaint, skip frequency update
                    print(f"Tag '{tag}' is similar to an already linked tag in this complaint. Skipping frequency update.")
                else:
                    # Update frequency only if it's the first time this tag is linked in this complaint
                    cursor.execute("UPDATE tags SET frequency = frequency + 1 WHERE id = %s", (similar_tag_id,))
                    complaint_tag_ids.append(similar_tag_id)
                
                tag_id = similar_tag_id

            else:
                cursor.execute("INSERT INTO tags (tag_name, frequency) VALUES (%s, 1) RETURNING id", (tag,))
                tag_id = cursor.fetchone()[0]
                existing_tags.append((tag_id, tag))

            cursor.execute("INSERT INTO complaint_tags (complaint_id, tag_id) VALUES (%s, %s)", (complaint_id, tag_id))

    except Exception as e:
        print(f"Error processing tags for complaint {complaint_id}: {e}")

@app.route("/complaints", methods=["POST"])
def submit_complaint():
    data = request.get_json()
    student_name = data.get("student_name")
    email = data.get("email")
    subject = data.get("subject")
    description = data.get("description")

    if not all([student_name, email, subject, description]):
        return jsonify({"error": "All fields are required."}), 400
    
    print("Received complaint data:", data)

    try:
        with connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO complaints (student_name, email, subject, description) VALUES (%s, %s, %s, %s) RETURNING id",
                    (student_name, email, subject, description)
                )
                complaint_id = cursor.fetchone()[0]

                process_complaint_tags(cursor, complaint_id, description)

                complaint = {
                    "student_name": student_name,
                    "subject": subject,
                    "description": description,
                    "status": "Submitted",
                }

        return jsonify(complaint), 201

    except Exception as e:
        print("Error submitting complaint:", e)
        return jsonify({"error": "Internal Server Error"}), 500

@app.route("/complaints", methods=["GET"])
def get_complaints():
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT c.id, c.student_name, c.email, c.subject, c.description, c.status, c.date, 
                       COALESCE(ARRAY_REMOVE(ARRAY_AGG(t.tag_name ORDER BY t.tag_name), NULL), '{}') AS tags
                FROM complaints c
                LEFT JOIN complaint_tags ct ON c.id = ct.complaint_id
                LEFT JOIN tags t ON ct.tag_id = t.id
                GROUP BY c.id
                ORDER BY c.date DESC
            """)
            complaints = cursor.fetchall()

        print("Fetched complaints:", complaints)
        formatted_complaints = []
        for row in complaints:
            tags = row[7][:] if row[7] else []  # Ensures empty list if no tags
            formatted_complaints.append({
                "id": row[0],
                "student_name": row[1],
                "email": row[2],
                "subject": row[3],
                "description": row[4],
                "status": row[5],
                "date": row[6],
                "tags": tags
            })

        return jsonify(formatted_complaints), 200

    except Exception as e:
        print("Error fetching complaints:", e)
        return jsonify({"error": "Internal Server Error"}), 500

@app.route("/tags", methods=["GET"])
def get_popular_tags():
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT t.tag_name, COUNT(ct.complaint_id) AS tag_count
                FROM tags t
                JOIN complaint_tags ct ON t.id = ct.tag_id
                GROUP BY t.tag_name
                ORDER BY tag_count DESC
                LIMIT 15
            """)
            tags = cursor.fetchall()

        popular_tags = [{"tag": row[0], "count": row[1]} for row in tags]
        return jsonify(popular_tags), 200

    except Exception as e:
        print("Error fetching popular tags:", e)
        return jsonify({"error": "Internal Server Error"}), 500


# Uncomment the following lines if you want to use TF-IDF and KMeans clustering


# vectorizer = joblib.load("tfidf_vectorizer.pkl")
# kmeans = joblib.load("kmeans_model.pkl")

# cluster_names = {
#     0: "Job Struggles & Time Pressure",
#     1: "Student Sentiments & Expectations",
#     2: "Course Content & Online Learning Issues",
#     3: "Food Quality & Dining Hall Concerns",
#     4: "Mental Health & Academic Stress",
#     5: "Sports & Extracurricular Activities",
#     6: "Financial Aid Process Issues",
#     7: "Medical Expense & Affordability",
#     8: "Certificate Requests & Timing",
#     9: "Limited Food Options & Availability",
#     10: "Access to Research & Academic Resources",
#     11: "Cafeteria Overcrowding & Timing",
#     12: "Career Opportunities & Internships"
# }

# def predict_cluster(complaint_text):
#     vec = vectorizer.transform([complaint_text])
#     cluster = int(kmeans.predict(vec)[0])
#     return {"cluster": cluster_names[cluster]}


# @app.route("/complaints", methods=["POST"])
# def submit_complaint():
#     data = request.get_json()
#     student_name = data.get("student_name")
#     email = data.get("email")
#     subject = data.get("subject")
#     description = data.get("description")

#     if not all([student_name, email, subject, description]):
#         return jsonify({"error": "All fields are required."}), 400

#     try:
#         with connection.cursor() as cursor:
#             cursor.execute(
#                 "INSERT INTO complaints (student_name, email, subject, description) VALUES (%s, %s, %s, %s)",
#                 (student_name, email, subject, description)
#             )
#             connection.commit()
#             complaint = {
#                     "student_name": student_name,
#                     "subject": subject,
#                     "description": description,
#                     "status": "Submitted",
#                     "cluster": predict_cluster(description)["cluster"],
#                     }
#         return complaint, 201
#     except Exception as e:
#         print("Error submitting complaint:", e)
#         return jsonify({"error": "Internal Server Error"}), 500

# @app.route("/complaints/<email>", methods=["GET"])
# def get_complaints(email):
#     print("Fetching complaints for email:", email)
#     try:
#         with connection.cursor() as cursor:
#             cursor.execute("SELECT * FROM complaints ORDER BY date DESC")
#             result = cursor.fetchall()
#             complaints_list = []
#             for row in result:

#                 complaint = {
#                     "id": row[0],
#                     "student_name": row[1],
#                     "subject": row[2],
#                     "description": row[3],
#                     "date": row[5].isoformat(),
#                     "status": row[4],
#                     "cluster": predict_cluster(row[3])["cluster"]
#                 }
#                 complaints_list.append(complaint)

#             return jsonify(complaints_list), 200
#     except Exception as e:
#         print("Error fetching complaints:", e)
#         return jsonify({"error": "Internal Server Error"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80, debug=True)
