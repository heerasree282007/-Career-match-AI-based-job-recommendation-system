"""
CareerMatch - AI-Based Job Recommendation System
Module: recommendation.py
Description:
    Implements a content-based recommendation engine using TF-IDF Vectorization
    and Cosine Similarity to recommend relevant job positions based on a user's
    skills, educational background, interests, and preferred roles.
"""

import os
import re
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class JobRecommender:
    """
    A Content-Based Job Recommendation Engine.
    
    Attributes:
        csv_path (str): File path to the jobs dataset CSV.
        df (pd.DataFrame): DataFrame containing the loaded job listings.
        vectorizer (TfidfVectorizer): Vectorizer used to convert text to TF-IDF vectors.
    """

    def __init__(self, csv_path=None):
        """
        Initialize the recommender and load the dataset.
        """
        if csv_path is None:
            # Default dataset location relative to project root
            base_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(base_dir, 'dataset', 'jobs.csv')
            
        self.csv_path = csv_path
        self.df = None
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),  # Consider both unigrams and bigrams (e.g. 'machine learning')
            token_pattern=r'(?u)\b[\w\+\#\.]+\b'  # Supports C++, C#, .NET, etc.
        )
        self.load_dataset()

    def load_dataset(self):
        """
        Loads the job listings from CSV and prepares a combined textual profile for each job.
        """
        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(f"Dataset not found at {self.csv_path}")

        self.df = pd.read_csv(self.csv_path)

        # Ensure required columns exist
        required_cols = ['Job ID', 'Job Title', 'Company Name', 'Category', 'Required Skills', 'Job Description']
        for col in required_cols:
            if col not in self.df.columns:
                raise ValueError(f"Dataset missing required column: '{col}'")

        # Fill any empty values
        self.df.fillna('', inplace=True)

        # Create an enriched textual representation of each job.
        # Repeating Required Skills and Job Title gives them higher term weight in TF-IDF.
        self.df['combined_features'] = self.df.apply(
            lambda row: (
                f"{row['Job Title']} {row['Job Title']} "
                f"{row['Category']} "
                f"{row['Required Skills']} {row['Required Skills']} {row['Required Skills']} "
                f"{row['Job Description']}"
            ),
            axis=1
        )

    @staticmethod
    def _normalize_skill(skill):
        """Clean and normalize a skill string for comparison."""
        return re.sub(r'[^a-zA-Z0-9\+\#\.]', '', skill.strip().lower())

    def _extract_skills_comparison(self, user_skills_str, job_skills_str):
        """
        Compare user skills with required job skills.
        
        Returns:
            matched_skills (list): Skills required by the job that the user possesses.
            missing_skills (list): Skills required by the job that the user is missing.
        """
        # Split skills by comma
        user_skills_raw = [s.strip() for s in user_skills_str.split(',') if s.strip()]
        job_skills_raw = [s.strip() for s in job_skills_str.split(',') if s.strip()]

        normalized_user_skills = {self._normalize_skill(s) for s in user_skills_raw}

        matched_skills = []
        missing_skills = []

        for skill in job_skills_raw:
            norm_job_skill = self._normalize_skill(skill)
            # Exact or fuzzy match check
            is_matched = False
            for u_skill in normalized_user_skills:
                if (norm_job_skill == u_skill or 
                    (len(norm_job_skill) > 3 and norm_job_skill in u_skill) or 
                    (len(u_skill) > 3 and u_skill in norm_job_skill)):
                    is_matched = True
                    break

            if is_matched:
                matched_skills.append(skill)
            else:
                missing_skills.append(skill)

        return matched_skills, missing_skills

    def recommend(self, user_profile, top_n=5):
        """
        Generate job recommendations based on user profile.

        Args:
            user_profile (dict): Dictionary with keys:
                - name (str): User's full name
                - qualification (str): Educational qualification
                - skills (str): Comma-separated user skills
                - interests (str): Areas of interest
                - preferred_role (str): Preferred job role
            top_n (int): Number of top recommendations to return (default: 5)

        Returns:
            dict: {
                "user_name": str,
                "total_jobs_evaluated": int,
                "recommendations": list of job dicts with similarity scores & skill analysis
            }
        """
        if self.df is None or self.df.empty:
            self.load_dataset()

        user_name = user_profile.get('name', 'Job Seeker').strip() or 'Job Seeker'
        qualification = user_profile.get('qualification', '').strip()
        skills = user_profile.get('skills', '').strip()
        interests = user_profile.get('interests', '').strip()
        preferred_role = user_profile.get('preferred_role', '').strip()

        # Edge case: If user provided no searchable skills or interests
        if not skills and not interests and not preferred_role:
            return {
                "user_name": user_name,
                "total_jobs_evaluated": len(self.df),
                "recommendations": []
            }

        # Build user profile textual representation.
        # Emphasize user skills and preferred role with multiple occurrences.
        user_content = (
            f"{preferred_role} {preferred_role} "
            f"{skills} {skills} {skills} "
            f"{interests} {interests} "
            f"{qualification}"
        )

        # List of all job combined features + user's feature text
        all_documents = list(self.df['combined_features']) + [user_content]

        # Calculate TF-IDF matrix
        tfidf_matrix = self.vectorizer.fit_transform(all_documents)

        # The last vector is the user profile
        job_vectors = tfidf_matrix[:-1]
        user_vector = tfidf_matrix[-1:]

        # Calculate Cosine Similarity between user vector and all job vectors
        cosine_sim_scores = cosine_similarity(user_vector, job_vectors).flatten()

        results = []

        for idx, row in self.df.iterrows():
            cos_score = float(cosine_sim_scores[idx])

            # Analyze skill overlap
            job_skills_str = row['Required Skills']
            matched_skills, missing_skills = self._extract_skills_comparison(skills, job_skills_str)

            total_job_skills = len(matched_skills) + len(missing_skills)
            skill_ratio = (len(matched_skills) / total_job_skills) if total_job_skills > 0 else 0.0

            # In TF-IDF text matching between concise user profiles and comprehensive job descriptions,
            # maximum cosine similarity typically tops out around 0.50 - 0.65.
            # We normalize the cosine similarity and blend it with direct skill coverage:
            normalized_cos = min(cos_score / 0.55, 1.0)
            
            # Weighted formula:
            # 50% from contextual TF-IDF Cosine Similarity (semantic & profile alignment)
            # 50% from direct Skill Coverage Ratio (exact skills matched)
            if skill_ratio > 0 or cos_score > 0.03:
                raw_percent = (0.50 * normalized_cos + 0.50 * skill_ratio) * 100
                similarity_percent = round(min(max(raw_percent, 12.0), 98.5), 1)
            else:
                similarity_percent = 0.0

            results.append({
                "job_id": int(row['Job ID']),
                "job_title": row['Job Title'],
                "company_name": row['Company Name'],
                "category": row['Category'],
                "required_skills": [s.strip() for s in job_skills_str.split(',') if s.strip()],
                "job_description": row['Job Description'],
                "similarity_score": similarity_percent,
                "raw_cosine_score": round(cos_score, 4),
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "match_count": len(matched_skills),
                "total_skills_count": total_job_skills
            })

        # Sort recommendations by similarity_score in descending order
        sorted_results = sorted(results, key=lambda x: x['similarity_score'], reverse=True)

        # If all scores are 0, return empty list
        valid_recommendations = [job for job in sorted_results if job['similarity_score'] > 0]

        top_recommendations = valid_recommendations[:top_n]

        return {
            "user_name": user_name,
            "total_jobs_evaluated": len(self.df),
            "recommendations": top_recommendations
        }

    def get_all_jobs(self):
        """Return all jobs formatted as dictionaries."""
        if self.df is None or self.df.empty:
            self.load_dataset()
        jobs_list = []
        for _, row in self.df.iterrows():
            jobs_list.append({
                "job_id": int(row['Job ID']),
                "job_title": row['Job Title'],
                "company_name": row['Company Name'],
                "category": row['Category'],
                "required_skills": [s.strip() for s in row['Required Skills'].split(',') if s.strip()],
                "job_description": row['Job Description']
            })
        return jobs_list

    def get_categories(self):
        """Return unique job categories."""
        if self.df is None or self.df.empty:
            self.load_dataset()
        return sorted(self.df['Category'].dropna().unique().tolist())


# Self-test block for standalone verification
if __name__ == '__main__':
    recommender = JobRecommender()
    print(f"Loaded {len(recommender.df)} jobs successfully.")
    print("Categories:", recommender.get_categories())

    sample_profile = {
        "name": "Alex Mercer",
        "qualification": "B.Tech in Computer Science",
        "skills": "Python, Machine Learning, Pandas, Scikit-learn, SQL",
        "interests": "Artificial Intelligence, Data Analytics",
        "preferred_role": "Machine Learning Engineer"
    }

    result = recommender.recommend(sample_profile, top_n=5)
    print(f"\nRecommendations for {result['user_name']}:")
    for idx, rec in enumerate(result['recommendations'], 1):
        print(f"\n{idx}. {rec['job_title']} at {rec['company_name']}")
        print(f"   Similarity Score: {rec['similarity_score']}%")
        print(f"   Matched Skills: {rec['matched_skills']}")
        print(f"   Missing Skills: {rec['missing_skills']}")
