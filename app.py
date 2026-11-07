"""
CareerMatch - AI-Based Job Recommendation System
Main Flask Web Application
"""

import os
import sys
import traceback
from flask import Flask, render_template, request, jsonify
from recommendation import JobRecommender

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

app = Flask(__name__)

# Initialize the recommendation engine
try:
    recommender = JobRecommender()
    print("[OK] JobRecommender initialized successfully.")
except Exception as e:
    print(f"[ERROR] Error initializing JobRecommender: {e}")
    recommender = None


@app.route('/')
def home():
    """Renders the main CareerMatch single-page application."""
    return render_template('index.html')


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Returns the list of unique job categories in the dataset."""
    try:
        if recommender is None:
            return jsonify({"status": "error", "message": "Recommender engine is not initialized."}), 500
        categories = recommender.get_categories()
        return jsonify({"status": "success", "categories": categories}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    """Returns all jobs for browsing and client-side inspection."""
    try:
        if recommender is None:
            return jsonify({"status": "error", "message": "Recommender engine is not initialized."}), 500
        jobs = recommender.get_all_jobs()
        return jsonify({"status": "success", "total": len(jobs), "jobs": jobs}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/recommend', methods=['POST'])
def recommend():
    """
    Analyzes the submitted user profile and returns recommended jobs
    ranked by TF-IDF & Cosine Similarity score.
    """
    try:
        if recommender is None:
            return jsonify({
                "status": "error",
                "message": "Recommendation engine is unavailable. Please check dataset."
            }), 500

        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "status": "error",
                "message": "Invalid request. JSON body is required."
            }), 400

        # Extract and validate fields
        name = str(data.get('name', '')).strip()
        qualification = str(data.get('qualification', '')).strip()
        skills = str(data.get('skills', '')).strip()
        interests = str(data.get('interests', '')).strip()
        preferred_role = str(data.get('preferred_role', '')).strip()
        top_n = data.get('top_n', 5)

        try:
            top_n = int(top_n)
            if top_n <= 0:
                top_n = 5
        except (ValueError, TypeError):
            top_n = 5

        # Validation: Skills are essential for recommendation
        if not skills:
            return jsonify({
                "status": "error",
                "message": "Please provide at least one skill (comma-separated) to generate recommendations."
            }), 400

        user_profile = {
            "name": name if name else "Candidate",
            "qualification": qualification,
            "skills": skills,
            "interests": interests,
            "preferred_role": preferred_role
        }

        # Run AI recommendation model
        result = recommender.recommend(user_profile, top_n=top_n)

        return jsonify({
            "status": "success",
            "data": result,
            "disclaimer": "Scores represent similarity between your profile and job requirements, not an employment guarantee."
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"An error occurred while generating recommendations: {str(e)}"
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "online",
        "service": "CareerMatch Recommendation Engine",
        "dataset_loaded": recommender is not None and recommender.df is not None and not recommender.df.empty
    }), 200


if __name__ == '__main__':
    # Run the Flask development server on port 5000
    print("==================================================")
    print("[*] CareerMatch - AI Job Recommendation System")
    print("[*] Running at: http://127.0.0.1:5000")
    print("==================================================")
    app.run(host='127.0.0.1', port=5000, debug=True)
