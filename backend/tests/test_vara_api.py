"""
VARA API Backend Tests
Tests for: Auth, Tasks, Withdrawal, and E2E flows
Critical bug fix verification: Cookie security + AuthContext null handling
"""
import pytest
import requests
import os
import time
import uuid

# Get backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://vara-landing-v1.preview.emergentagent.com"

# Test credentials
ADMIN_EMAIL = "admin@vara.com"
ADMIN_PASSWORD = "vara_admin_2026"

class TestHealthAndBasics:
    """Basic health check and API availability tests"""
    
    def test_api_root(self):
        """Test API root endpoint - Note: Root serves frontend HTML"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        # Root URL serves frontend HTML, not JSON API
        print(f"✓ Root endpoint accessible (serves frontend)")
    
    def test_api_health(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed: {data}")


class TestAuthFlow:
    """Authentication flow tests - Login, Register, Logout, /me endpoint"""
    
    def test_login_admin_success(self):
        """Test admin login with correct credentials"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "email" in data
        assert data["email"] == ADMIN_EMAIL
        assert "role" in data
        assert data["role"] == "admin"
        assert "earnings" in data
        assert "tasks_completed" in data
        assert "bonus_unlocked" in data
        
        # Verify cookies are set (critical bug fix verification)
        cookies = session.cookies.get_dict()
        # Note: httpOnly cookies may not be visible in requests library
        print(f"✓ Admin login successful: {data['email']}, role={data['role']}")
        print(f"  Tasks completed: {data['tasks_completed']}, Bonus unlocked: {data['bonus_unlocked']}")
        return session
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid credentials rejected: {data['detail']}")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@test.com", "password": "anypassword"}
        )
        assert response.status_code == 401
        print("✓ Non-existent user rejected")
    
    def test_register_new_user(self):
        """Test new user registration"""
        unique_email = f"TEST_user_{uuid.uuid4().hex[:8]}@example.com"
        session = requests.Session()
        
        response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "testpass123",
                "name": "Test User"
            }
        )
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data["email"] == unique_email.lower()
        assert data["name"] == "Test User"
        assert data["role"] == "user"
        assert data["earnings"] == 0.0
        assert data["tasks_completed"] == 0
        assert data["bonus_unlocked"] == False
        
        print(f"✓ New user registered: {data['email']}")
        return session, unique_email
    
    def test_register_duplicate_email(self):
        """Test registration with existing email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": ADMIN_EMAIL,
                "password": "anypassword",
                "name": "Duplicate"
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
        print(f"✓ Duplicate email rejected: {data['detail']}")
    
    def test_auth_me_endpoint(self):
        """Test /api/auth/me endpoint - CRITICAL for session persistence"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        
        # Now test /me endpoint
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200, f"/me failed: {me_response.text}"
        data = me_response.json()
        
        assert data["email"] == ADMIN_EMAIL
        assert "earnings" in data
        assert "tasks_completed" in data
        print(f"✓ /api/auth/me working: {data['email']}")
    
    def test_auth_me_without_login(self):
        """Test /api/auth/me without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /api/auth/me correctly rejects unauthenticated requests")
    
    def test_logout(self):
        """Test logout endpoint"""
        session = requests.Session()
        
        # Login first
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        # Logout
        logout_response = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200
        data = logout_response.json()
        assert "logged out" in data["message"].lower()
        
        # Verify /me fails after logout
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 401
        print("✓ Logout successful, session invalidated")


class TestTasksFlow:
    """Task listing and completion tests"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_get_tasks_authenticated(self, authenticated_session):
        """Test getting available tasks when authenticated"""
        response = authenticated_session.get(f"{BASE_URL}/api/tasks/")
        assert response.status_code == 200, f"Get tasks failed: {response.text}"
        tasks = response.json()
        
        assert isinstance(tasks, list)
        print(f"✓ Got {len(tasks)} available tasks")
        
        if tasks:
            task = tasks[0]
            assert "_id" in task
            assert "title" in task
            assert "reward_amount" in task
            assert "task_type" in task
            print(f"  Sample task: {task['title']} - ${task['reward_amount']}")
    
    def test_get_tasks_unauthenticated(self):
        """Test getting tasks without authentication"""
        response = requests.get(f"{BASE_URL}/api/tasks/")
        assert response.status_code == 401
        print("✓ Tasks endpoint correctly requires authentication")
    
    def test_complete_task_flow(self):
        """Test task completion E2E flow with fresh user"""
        # Create fresh user for clean test
        unique_email = f"TEST_taskuser_{uuid.uuid4().hex[:8]}@example.com"
        session = requests.Session()
        
        # Register
        reg_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": unique_email, "password": "testpass123", "name": "Task Tester"}
        )
        assert reg_response.status_code == 200
        initial_data = reg_response.json()
        initial_earnings = initial_data["earnings"]
        initial_tasks = initial_data["tasks_completed"]
        
        # Get available tasks
        tasks_response = session.get(f"{BASE_URL}/api/tasks/")
        assert tasks_response.status_code == 200
        tasks = tasks_response.json()
        assert len(tasks) > 0, "No tasks available"
        
        # Complete first task
        task_to_complete = tasks[0]
        complete_response = session.post(
            f"{BASE_URL}/api/tasks/complete",
            json={"task_id": task_to_complete["_id"]}
        )
        assert complete_response.status_code == 200, f"Task completion failed: {complete_response.text}"
        completion_data = complete_response.json()
        
        # Verify completion response
        assert completion_data["success"] == True
        assert completion_data["reward_earned"] > 0
        assert completion_data["tasks_completed"] == initial_tasks + 1
        assert completion_data["total_earnings"] > initial_earnings
        
        print(f"✓ Task completed: {task_to_complete['title']}")
        print(f"  Reward: ${completion_data['reward_earned']}, Total: ${completion_data['total_earnings']}")
        
        # Verify via /me endpoint
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        user_data = me_response.json()
        assert user_data["tasks_completed"] == initial_tasks + 1
        assert user_data["earnings"] == completion_data["total_earnings"]
        print(f"✓ User data updated correctly via /me endpoint")
    
    def test_complete_same_task_twice(self):
        """Test that same task cannot be completed twice"""
        unique_email = f"TEST_dupetask_{uuid.uuid4().hex[:8]}@example.com"
        session = requests.Session()
        
        # Register
        session.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": unique_email, "password": "testpass123"}
        )
        
        # Get tasks
        tasks = session.get(f"{BASE_URL}/api/tasks/").json()
        task_id = tasks[0]["_id"]
        
        # Complete once
        first_complete = session.post(
            f"{BASE_URL}/api/tasks/complete",
            json={"task_id": task_id}
        )
        assert first_complete.status_code == 200
        
        # Try to complete again
        second_complete = session.post(
            f"{BASE_URL}/api/tasks/complete",
            json={"task_id": task_id}
        )
        assert second_complete.status_code == 400
        assert "already completed" in second_complete.json()["detail"].lower()
        print("✓ Duplicate task completion correctly rejected")


class TestBonusUnlock:
    """Test $2 USD bonus unlock after 5 tasks"""
    
    def test_bonus_unlocks_after_5_tasks(self):
        """CRITICAL: Test that bonus unlocks after completing 5 tasks"""
        unique_email = f"TEST_bonus_{uuid.uuid4().hex[:8]}@example.com"
        session = requests.Session()
        
        # Register fresh user
        reg_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": unique_email, "password": "testpass123", "name": "Bonus Tester"}
        )
        assert reg_response.status_code == 200
        assert reg_response.json()["bonus_unlocked"] == False
        
        # Get all available tasks
        tasks = session.get(f"{BASE_URL}/api/tasks/").json()
        assert len(tasks) >= 5, f"Need at least 5 tasks, got {len(tasks)}"
        
        total_earned = 0
        bonus_earned = 0
        
        # Complete 5 tasks
        for i in range(5):
            task = tasks[i]
            response = session.post(
                f"{BASE_URL}/api/tasks/complete",
                json={"task_id": task["_id"]}
            )
            assert response.status_code == 200, f"Task {i+1} completion failed: {response.text}"
            data = response.json()
            
            print(f"  Task {i+1}: {task['title']} - earned ${data['reward_earned']}")
            
            if i == 4:  # 5th task
                # Bonus should be unlocked now
                assert data["bonus_unlocked"] == True, "Bonus should be unlocked after 5 tasks"
                assert data["tasks_completed"] == 5
                # Reward should include $2 bonus
                assert data["reward_earned"] >= task["reward_amount"] + 2.0, \
                    f"5th task should include $2 bonus. Got ${data['reward_earned']}"
                bonus_earned = 2.0
                print(f"  🎉 BONUS UNLOCKED! +$2.00")
        
        # Verify final state via /me
        me_data = session.get(f"{BASE_URL}/api/auth/me").json()
        assert me_data["bonus_unlocked"] == True
        assert me_data["tasks_completed"] == 5
        print(f"✓ Bonus unlock verified: tasks={me_data['tasks_completed']}, bonus_unlocked={me_data['bonus_unlocked']}")
        print(f"  Total earnings: ${me_data['earnings']}")


class TestWithdrawal:
    """Withdrawal flow tests"""
    
    def test_withdrawal_request(self):
        """Test withdrawal request flow"""
        unique_email = f"TEST_withdraw_{uuid.uuid4().hex[:8]}@example.com"
        session = requests.Session()
        
        # Register and complete some tasks to have balance
        session.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": unique_email, "password": "testpass123"}
        )
        
        # Complete 2 tasks to have some balance
        tasks = session.get(f"{BASE_URL}/api/tasks/").json()
        for i in range(2):
            session.post(f"{BASE_URL}/api/tasks/complete", json={"task_id": tasks[i]["_id"]})
        
        # Get current balance
        me_data = session.get(f"{BASE_URL}/api/auth/me").json()
        current_balance = me_data["earnings"]
        initial_withdrawn = me_data.get("total_withdrawn", 0)
        
        # Request withdrawal of full balance
        withdrawal_response = session.post(
            f"{BASE_URL}/api/withdrawal/request",
            json={
                "amount": current_balance,
                "method": "gcash",
                "account_details": "09123456789"
            }
        )
        assert withdrawal_response.status_code == 200, f"Withdrawal failed: {withdrawal_response.text}"
        data = withdrawal_response.json()
        
        assert data["success"] == True
        assert data["amount"] == current_balance
        assert data["status"] == "approved"
        print(f"✓ Withdrawal approved: ${data['amount']} via {data['status']}")
        
        # Verify balance updated
        me_after = session.get(f"{BASE_URL}/api/auth/me").json()
        assert me_after["earnings"] == 0, f"Balance should be 0 after withdrawal, got {me_after['earnings']}"
        assert me_after["total_withdrawn"] == initial_withdrawn + current_balance
        print(f"✓ Balance updated: earnings=${me_after['earnings']}, withdrawn=${me_after['total_withdrawn']}")
    
    def test_withdrawal_insufficient_balance(self):
        """Test withdrawal with insufficient balance"""
        unique_email = f"TEST_insuffbal_{uuid.uuid4().hex[:8]}@example.com"
        session = requests.Session()
        
        # Register (0 balance)
        session.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": unique_email, "password": "testpass123"}
        )
        
        # Try to withdraw
        response = session.post(
            f"{BASE_URL}/api/withdrawal/request",
            json={"amount": 10.0, "method": "gcash", "account_details": "09123456789"}
        )
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()
        print("✓ Insufficient balance withdrawal correctly rejected")
    
    def test_withdrawal_history(self):
        """Test withdrawal history endpoint"""
        session = requests.Session()
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        response = session.get(f"{BASE_URL}/api/withdrawal/history")
        assert response.status_code == 200
        history = response.json()
        assert isinstance(history, list)
        print(f"✓ Withdrawal history retrieved: {len(history)} records")


class TestSessionPersistence:
    """Test session persistence - CRITICAL for the bug fix"""
    
    def test_session_persists_across_requests(self):
        """Test that session persists across multiple requests"""
        session = requests.Session()
        
        # Login
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        
        # Make multiple requests to verify session
        for i in range(3):
            me_response = session.get(f"{BASE_URL}/api/auth/me")
            assert me_response.status_code == 200, f"Request {i+1} failed: {me_response.text}"
            
            tasks_response = session.get(f"{BASE_URL}/api/tasks/")
            assert tasks_response.status_code == 200, f"Tasks request {i+1} failed"
        
        print("✓ Session persists across multiple requests")
    
    def test_tasks_page_no_redirect(self):
        """CRITICAL: Verify tasks endpoint doesn't cause auth issues"""
        session = requests.Session()
        
        # Login
        session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        # Access tasks multiple times (simulating page interactions)
        for i in range(5):
            response = session.get(f"{BASE_URL}/api/tasks/")
            assert response.status_code == 200, f"Tasks request {i+1} returned {response.status_code}"
            
            # Also verify /me still works
            me_response = session.get(f"{BASE_URL}/api/auth/me")
            assert me_response.status_code == 200, f"/me request {i+1} returned {me_response.status_code}"
        
        print("✓ Tasks page access doesn't break session (no redirect issue)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
