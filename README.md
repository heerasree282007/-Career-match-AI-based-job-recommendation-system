## 🚀 Live Demo

Try CareerMatch here: https://career-match-pt8l.onrender.com
# CareerMatch – AI-Based Job Recommendation System

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1.3-000000?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.9.1-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Pandas](https://img.shields.io/badge/Pandas-3.1.1-150458?style=flat&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

---

## 1. Project Title
**CareerMatch – AI-Based Job Recommendation System**

---

## 2. Project Overview
**CareerMatch** is an AI-powered web application that recommends suitable job roles to students, job seekers, and career changers based on their:
- **Technical Skills** (e.g., Python, SQL, React, Machine Learning)
- **Educational Qualifications** (e.g., B.Tech in Computer Science, BCA, MCA, BS)
- **Areas of Interest** (e.g., Artificial Intelligence, Web Development, Cloud Computing)
- **Preferred Job Roles** (e.g., Data Scientist, Frontend Developer)

Instead of manually browsing through hundreds of generic job listings, users submit their profile details through an interactive form. The system analyzes their profile using **Machine Learning (TF-IDF Vectorization & Cosine Similarity)** and matches them against curated industry job positions. It displays the top recommended jobs with similarity scores, highlights the skills the user already has, and identifies missing skills they should learn to improve their career readiness.

---

## 3. Objectives
The CareerMatch project was developed to:
1. **Simplify Job Search:** Help students and graduates quickly identify job roles that match their current skill sets.
2. **Highlight Skill Gaps:** Clearly show the difference between what a candidate knows and what an employer requires.
3. **Provide Practical Career Guidance:** Offer learners an actionable roadmap of technologies to study next for interview preparation.
4. **Implement Transparent Machine Learning:** Build an explainable content-based recommendation system using classical NLP and Vector Space Models without relying on expensive, third-party AI APIs.
5. **Create a Modern, User-Friendly Web Experience:** Deliver a clean, professional, and fully responsive web interface that works smoothly on mobile, tablet, and desktop devices.

---

## 4. Features

- **User Profile Input:** A clean form to input Full Name, Educational Qualification, Technical Skills (comma-separated), Areas of Interest, and Preferred Role.
- **Job Role Recommendations:** Automatically evaluates and returns the top matching job roles from a curated benchmark dataset.
- **Matching Percentage:** Displays an objective similarity score (0% to 100%) indicating how closely the candidate's skills align with each role.
- **Matched Skills:** Clearly highlights in green badges the required skills that the candidate already possesses.
- **Missing Skills:** Identifies in red/coral badges the skills required by the job that the candidate has not yet listed.
- **Career Improvement Suggestions:** Provides an actionable learning roadmap showing candidates exactly which skills to study next to bridge the gap.
- **One-Click Profile Presets:** Pre-fills the form with sample profiles (*ML & Data Fresher*, *Frontend / Web Dev*, *DevOps & Cloud*, *UI/UX Designer*) for instant testing.
- **Tap-to-Add Skill Chips:** Quick-tap chips to add in-demand skills (Python, SQL, React, Docker, AWS, etc.) with a single click.
- **Search, Filter & Sort:** Allows filtering recommendations by category domain, searching by keyword/title, and sorting by similarity percentage.
- **Job Bookmarking:** Lets users save and bookmark favorite job listings to browser storage (`localStorage`).
- **Input Validation & Feedback:** Provides instant error messages and alert banners if required fields are missing.

---

## 5. Technologies Used

CareerMatch is built with clean, beginner-friendly full-stack technologies:

| Category | Technology | Usage in Project |
| :--- | :--- | :--- |
| **Frontend** | **HTML5** | Semantic structure for the homepage, assessment form, result cards, and modals. |
| | **CSS3** | Modern styling with a blue, white, and light-grey theme, flexbox/grid layout, and responsive media queries. |
| | **JavaScript** | Client-side logic for API requests (`fetch`), dynamic card rendering, real-time filtering, presets, and toast notifications. |
| **Backend** | **Python** | Core server-side programming language. |
| | **Flask** | Lightweight web framework that connects the frontend interface with the machine learning recommendation model. |
| **Machine Learning** | **Scikit-learn** | Implements `TfidfVectorizer` to extract numerical vectors and `cosine_similarity` to calculate alignment scores. |
| **Data Processing** | **Pandas** | Loads and processes the job records from the CSV file (`jobs.csv`). |
| **Dataset** | **CSV File** | Contains 25 realistic job records with Job ID, Job Title, Company Name, Category, Required Skills, and Job Description. |

---

## 6. Machine Learning

CareerMatch uses a **Content-Based Recommendation System** powered by two fundamental data science concepts:

```
[ User Profile Text ] ──► [ TF-IDF Vectorizer ] ──► Numerical User Vector ┐
                                                                          ├──► [ Cosine Similarity ] ──► Ranked Top Jobs
[ Job Descriptions  ] ──► [ TF-IDF Vectorizer ] ──► Numerical Job Vectors  ┘
```

### 1. TF-IDF Vectorization (Term Frequency – Inverse Document Frequency)
Computers cannot directly understand plain text words like *"Python"* or *"Machine Learning"*. TF-IDF converts text into meaningful numerical vectors:
- **Term Frequency (TF):** Measures how frequently a skill keyword appears in a candidate's profile or job description.
- **Inverse Document Frequency (IDF):** Reduces the weight of common English words (such as *"and"*, *"the"*, *"with"*) while giving much higher importance to specialized technical terms (such as *"PyTorch"*, *"Docker"*, *"Kubernetes"*).
- **Result:** Every job and candidate profile is represented as a list of numbers (a vector) where important technical skills carry the highest weights.

### 2. Cosine Similarity
Once text is converted into numerical vectors, **Cosine Similarity** measures the angle between the user vector ($\mathbf{u}$) and each job vector ($\mathbf{j}$):
$$\text{Cosine Similarity}(\mathbf{u}, \mathbf{j}) = \frac{\mathbf{u} \cdot \mathbf{j}}{\|\mathbf{u}\| \|\mathbf{j}\|}$$

- **Score near 100%:** The user's skills point in the same direction as the job requirements (strong match).
- **Score near 0%:** There is very little overlap between the user's skills and the job requirements (weak match).
- The system sorts all jobs in descending order and returns the highest-scoring recommendations.

> **Important Note:** The percentage is an objective similarity score indicating skill alignment—not a hiring guarantee.

---

## 7. Project Folder Structure

```
CareerMatch/
│
├── app.py                     # Flask backend server and REST API endpoints
├── recommendation.py          # Machine Learning recommendation logic (TF-IDF + Cosine Similarity)
├── requirements.txt           # Python dependencies (Flask, Pandas, Scikit-learn, NumPy)
├── README.md                  # Project documentation for GitHub
├── .gitignore                 # Files and folders to ignore in Git
├── test_app.py                # Automated unit test suite (7 tests verifying routes & ML)
│
├── dataset/
│   └── jobs.csv               # Dataset of 25 benchmark tech jobs across 7 categories
│
├── templates/
│   └── index.html             # Responsive frontend single-page application
│
├── static/
│   ├── style.css              # Custom styling (Blue, White, Light-Grey theme, responsive design)
│   └── script.js              # JavaScript for form handling, API calls, presets, and filters
│
└── screenshots/               # Folder for repository screenshots
    ├── homepage.png           # (Add your homepage screenshot here)
    ├── profile_form.png       # (Add your profile form screenshot here)
    └── recommendation_results.png # (Add your results screenshot here)
```

---

## 8. Installation

Follow these steps to set up CareerMatch on your local computer:

### Step 1: Check Python Installation
Make sure Python 3.9 or higher is installed:
```bash
python --version
```

### Step 2: Clone or Download the Project
```bash
git clone https://github.com/<your-username>/CareerMatch.git
cd CareerMatch
```

### Step 3: (Recommended) Create and Activate a Virtual Environment
- **On Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
- **On macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Step 4: Install Dependencies
Install all required packages with a single command:
```bash
pip install -r requirements.txt
```

---

## 9. How to Run

### Step 1: Start the Application
Run the Flask application from your terminal:
```bash
python app.py
```

You should see output similar to this:
```text
[OK] JobRecommender initialized successfully.
==================================================
[*] CareerMatch - AI Job Recommendation System
[*] Running at: http://127.0.0.1:5000
==================================================
 * Running on http://127.0.0.1:5000
```

### Step 2: Open in Your Browser
Open your favorite web browser and go to:
```text
http://127.0.0.1:5000
```

---

## 10. Screenshots

Add your application screenshots into the [`screenshots/`](screenshots/) directory to showcase your project on GitHub:

### 10.1 Homepage & Hero Section
*Displays the navigation bar, headline, platform introduction, live match preview, and feature highlights.*

![CareerMatch Homepage](screenshots/homepage.png)

---

### 10.2 Candidate Profile Assessment Form
*User profile input form with one-click presets and tap-to-add skill chips.*

![Candidate Profile Assessment Form](screenshots/profile_form.png)

---

### 10.3 Job Recommendation Results & Skills Matrix
*Ranked job recommendation cards showing similarity score gauge, match meter, and side-by-side matched vs. missing skills.*

![Job Recommendation Results](screenshots/recommendation_results.png)

> **How to add screenshots:**
> 1. Open the running application at `http://127.0.0.1:5000`.
> 2. Take screenshots of the Homepage, Profile Form, and Recommendation Results.
> 3. Save them into the `screenshots/` folder as `homepage.png`, `profile_form.png`, and `recommendation_results.png`.
> 4. Commit and push to GitHub!

---

## 11. Future Enhancements

Potential features planned for future versions of CareerMatch include:
- **User Authentication & Profiles:** Allow job seekers to sign up, log in, and manage multiple saved career profiles.
- **Resume PDF / DOCX Parser:** Enable users to upload their resume file to automatically extract skills and education.
- **Expanded Job Dataset:** Expand from 25 benchmark roles to thousands of real-time job listings via scheduled scrapers.
- **Improved Hybrid Recommendations:** Combine content-based filtering with collaborative filtering based on user ratings and application outcomes.
- **Curated Course Recommendations:** Add direct links to free learning tutorials (e.g., freeCodeCamp, Coursera, YouTube) for each missing skill.
- **Salary Insights & Remote Preference:** Filter positions by salary ranges and work modes (Remote, Hybrid, On-site).

---

## 12. Conclusion

**CareerMatch** illustrates how foundational Machine Learning techniques—specifically **TF-IDF Vectorization** and **Cosine Similarity**—can be coupled with a clean **Flask and JavaScript** web stack to solve a real-world career challenge. By offering clear similarity percentages, separating matched competencies from missing skills, and providing an intuitive user experience, CareerMatch empowers job seekers to make informed career decisions and prepare effectively for technical interviews. It serves as an excellent portfolio piece, capstone project, and open-source template for AI-driven recommendation applications.

---

## License
This project is licensed under the **MIT License** — you are free to use, adapt, and build upon it for academic and personal projects.
