import requests
import sys
import time
from datetime import datetime

class VARABackendTester:
    def __init__(self, base_url="https://vara-landing-v1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {response_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")

            self.test_results.append({
                'name': name,
                'success': success,
                'status_code': response.status_code,
                'expected_status': expected_status
            })

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                'name': name,
                'success': False,
                'error': str(e)
            })
            return False, {}

    def test_health_endpoint(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        
        if success and isinstance(response, dict):
            if response.get('status') == 'healthy':
                print("   ✅ Database connection verified")
                return True
            else:
                print(f"   ⚠️ Health status: {response.get('status')}")
        
        return success

    def test_waitlist_stats(self):
        """Test waitlist statistics endpoint"""
        success, response = self.run_test(
            "Waitlist Stats",
            "GET",
            "api/waitlist/stats",
            200
        )
        
        if success and isinstance(response, dict):
            data = response.get('data', {})
            if 'totalSignups' in data and 'todaySignups' in data:
                print(f"   📊 Total signups: {data.get('totalSignups')}")
                print(f"   📊 Today's signups: {data.get('todaySignups')}")
                return True
        
        return success

    def test_waitlist_submission_main_form(self):
        """Test waitlist submission from main form"""
        test_email = f"test_main_{int(time.time())}@example.com"
        
        success, response = self.run_test(
            "Waitlist Submission (Main Form)",
            "POST",
            "api/waitlist",
            200,
            data={
                "email": test_email,
                "source": "main_form"
            }
        )
        
        if success and isinstance(response, dict):
            if response.get('success') and response.get('data', {}).get('position'):
                position = response['data']['position']
                print(f"   🎯 Assigned position: {position}")
                return True, test_email, position
        
        return False, test_email, None

    def test_waitlist_submission_exit_popup(self):
        """Test waitlist submission from exit popup"""
        test_email = f"test_exit_{int(time.time())}@example.com"
        
        success, response = self.run_test(
            "Waitlist Submission (Exit Popup)",
            "POST",
            "api/waitlist",
            200,
            data={
                "email": test_email,
                "source": "exit_popup"
            }
        )
        
        if success and isinstance(response, dict):
            if response.get('success') and response.get('data', {}).get('position'):
                position = response['data']['position']
                bonus_type = response['data'].get('bonusType')
                print(f"   🎯 Assigned position: {position}")
                print(f"   🎁 Bonus type: {bonus_type}")
                return True, test_email, position
        
        return False, test_email, None

    def test_duplicate_email_handling(self, existing_email):
        """Test duplicate email submission"""
        success, response = self.run_test(
            "Duplicate Email Handling",
            "POST",
            "api/waitlist",
            200,
            data={
                "email": existing_email,
                "source": "main_form"
            }
        )
        
        if success and isinstance(response, dict):
            if response.get('success') and 'already' in response.get('message', '').lower():
                print("   ✅ Duplicate email properly detected")
                return True
        
        return success

    def test_invalid_email_validation(self):
        """Test email validation"""
        invalid_emails = [
            "invalid-email",
            "test@",
            "@example.com",
            "test..test@example.com"
        ]
        
        all_passed = True
        for invalid_email in invalid_emails:
            success, response = self.run_test(
                f"Invalid Email Validation ({invalid_email})",
                "POST",
                "api/waitlist",
                422,  # FastAPI validation error
                data={
                    "email": invalid_email,
                    "source": "main_form"
                }
            )
            
            if not success:
                all_passed = False
                print(f"   ❌ Should have rejected: {invalid_email}")
            else:
                print(f"   ✅ Properly rejected: {invalid_email}")
        
        return all_passed

    def test_rate_limiting(self):
        """Test rate limiting (3 requests per IP per hour)"""
        test_email_base = f"rate_test_{int(time.time())}"
        
        print("   Testing rate limiting (may take a moment)...")
        
        # Make 3 requests quickly
        for i in range(4):  # Try 4 requests to trigger rate limit
            email = f"{test_email_base}_{i}@example.com"
            success, response = self.run_test(
                f"Rate Limit Test {i+1}/4",
                "POST",
                "api/waitlist",
                200 if i < 3 else 200,  # Expecting rate limit response
                data={
                    "email": email,
                    "source": "main_form"
                }
            )
            
            if i == 3:  # 4th request should be rate limited
                if isinstance(response, dict) and 'too many' in response.get('message', '').lower():
                    print("   ✅ Rate limiting working correctly")
                    return True
                elif isinstance(response, dict) and not response.get('success'):
                    print("   ✅ Rate limiting detected (different message)")
                    return True
            
            time.sleep(0.5)  # Small delay between requests
        
        print("   ⚠️ Rate limiting may not be working as expected")
        return False

    def test_root_endpoint(self):
        """Test root endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )
        
        if success and isinstance(response, dict):
            if 'message' in response and 'VARA' in response['message']:
                print("   ✅ Root endpoint working correctly")
                return True
        
        return success

def main():
    print("🚀 Starting VARA Backend API Tests")
    print("=" * 50)
    
    tester = VARABackendTester()
    
    # Test sequence
    print("\n📋 Running comprehensive backend tests...")
    
    # 1. Basic connectivity tests
    tester.test_root_endpoint()
    tester.test_health_endpoint()
    tester.test_waitlist_stats()
    
    # 2. Waitlist functionality tests
    main_success, main_email, main_position = tester.test_waitlist_submission_main_form()
    exit_success, exit_email, exit_position = tester.test_waitlist_submission_exit_popup()
    
    # 3. Duplicate email test (use one of the emails we just created)
    if main_success:
        tester.test_duplicate_email_handling(main_email)
    
    # 4. Validation tests
    tester.test_invalid_email_validation()
    
    # 5. Rate limiting test
    tester.test_rate_limiting()
    
    # Print final results
    print("\n" + "=" * 50)
    print("📊 FINAL TEST RESULTS")
    print("=" * 50)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Detailed results
    print("\n📋 Detailed Results:")
    for result in tester.test_results:
        status = "✅ PASS" if result['success'] else "❌ FAIL"
        print(f"  {status} - {result['name']}")
        if not result['success'] and 'error' in result:
            print(f"    Error: {result['error']}")
    
    # Return exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())