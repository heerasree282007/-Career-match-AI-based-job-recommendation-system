"""
Test suite for CareerMatch Flask Application and API Endpoints
"""

import json
import unittest
from app import app


class CareerMatchTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_home_page(self):
        """Test GET / returns HTML home page."""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'CareerMatch', response.data)
        self.assertIn(b'Perfect Career', response.data)

    def test_health_check(self):
        """Test GET /api/health endpoint."""
        response = self.app.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'online')
        self.assertTrue(data['dataset_loaded'])

    def test_get_categories(self):
        """Test GET /api/categories endpoint."""
        response = self.app.get('/api/categories')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        self.assertIsInstance(data['categories'], list)
        self.assertIn('Software Development', data['categories'])
        self.assertIn('Artificial Intelligence', data['categories'])

    def test_get_jobs(self):
        """Test GET /api/jobs endpoint."""
        response = self.app.get('/api/jobs')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        self.assertGreaterEqual(data['total'], 20)
        self.assertIsInstance(data['jobs'], list)

    def test_recommendation_ml_profile(self):
        """Test POST /api/recommend with Machine Learning profile."""
        payload = {
            "name": "Jane Tester",
            "qualification": "B.Tech in AI & Data Science",
            "skills": "Python, Machine Learning, Scikit-learn, Pandas, PyTorch",
            "interests": "Artificial Intelligence, Deep Learning",
            "preferred_role": "Machine Learning Engineer",
            "top_n": 5
        }
        response = self.app.post(
            '/api/recommend',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        self.assertIn('disclaimer', data)
        recs = data['data']['recommendations']
        self.assertGreaterEqual(len(recs), 1)

        # Top recommendation should be Machine Learning or Data Science related
        top_job = recs[0]
        self.assertIn(top_job['job_title'], ['Machine Learning Engineer', 'Data Scientist', 'AI Research Engineer'])
        self.assertGreater(top_job['similarity_score'], 50.0)
        self.assertIsInstance(top_job['matched_skills'], list)
        self.assertIsInstance(top_job['missing_skills'], list)
        self.assertIn('Python', top_job['matched_skills'])

    def test_recommendation_frontend_profile(self):
        """Test POST /api/recommend with Frontend Web profile."""
        payload = {
            "name": "Dev Sharma",
            "qualification": "BCA",
            "skills": "HTML5, CSS3, JavaScript, React, Tailwind CSS",
            "interests": "Frontend Development, UI Components",
            "preferred_role": "Frontend Developer",
            "top_n": 5
        }
        response = self.app.post(
            '/api/recommend',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        recs = data['data']['recommendations']
        top_job = recs[0]
        self.assertIn(top_job['job_title'], ['Frontend Developer', 'Web Developer', 'Full Stack Developer', 'UI/UX Designer'])

    def test_recommendation_validation_empty_skills(self):
        """Test POST /api/recommend with empty skills returns 400 error."""
        payload = {
            "name": "Empty Candidate",
            "qualification": "B.Sc",
            "skills": "",
            "interests": "Tech",
            "preferred_role": "Manager"
        }
        response = self.app.post(
            '/api/recommend',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'error')


if __name__ == '__main__':
    unittest.main()
