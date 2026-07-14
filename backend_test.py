#!/usr/bin/env python3
"""
Comprehensive Backend Test for Flowternity Sports Platform
Tests all API endpoints with detailed assertions and logging
"""

import requests
import json
from datetime import datetime, timedelta
import sys
import os

# Load environment variables
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://run-workflow.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@flowternity.com"
ADMIN_PASSWORD = "admin123"

# Test counters
total_tests = 0
passed_tests = 0
failed_tests = []

def log(msg, level="INFO"):
    """Log test messages"""
    print(f"[{level}] {msg}")

def assert_test(condition, test_name, details=""):
    """Assert a test condition and track results"""
    global total_tests, passed_tests, failed_tests
    total_tests += 1
    if condition:
        passed_tests += 1
        log(f"✅ PASS: {test_name}", "PASS")
        return True
    else:
        failed_tests.append(f"{test_name}: {details}")
        log(f"❌ FAIL: {test_name} - {details}", "FAIL")
        return False

def test_health():
    """Test 1: Health / Config endpoints"""
    log("\n=== TEST 1: HEALTH / CONFIG ===")
    
    # Test health endpoint
    try:
        resp = requests.get(f"{API_BASE}/")
        assert_test(resp.status_code == 200, "GET /api/ returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test(data.get('ok') == True, "Health check ok=true", f"Got {data}")
        assert_test(data.get('app') == 'Flowternity', "Health check app='Flowternity'", f"Got {data.get('app')}")
    except Exception as e:
        assert_test(False, "GET /api/ health check", str(e))
    
    # Test config endpoint
    try:
        resp = requests.get(f"{API_BASE}/config")
        assert_test(resp.status_code == 200, "GET /api/config returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test(len(data.get('sports', [])) >= 6, "Config has 6+ sports", f"Got {len(data.get('sports', []))} sports")
        memberships = data.get('memberships', [])
        assert_test(len(memberships) == 6, "Config has 6 memberships", f"Got {len(memberships)} memberships")
        
        # Check specific membership IDs
        mem_ids = [m['id'] for m in memberships]
        expected_ids = ['kids_1m', 'kids_6m', 'kids_12m', 'adult_3m', 'adult_6m', 'adult_12m']
        assert_test(all(mid in mem_ids for mid in expected_ids), "All expected membership IDs present", f"Got {mem_ids}")
    except Exception as e:
        assert_test(False, "GET /api/config", str(e))

def test_auth():
    """Test 2: Authentication flows"""
    log("\n=== TEST 2: AUTH ===")
    
    session = requests.Session()
    
    # Test duplicate email registration
    try:
        resp = session.post(f"{API_BASE}/auth/register", json={
            "full_name": "Test User",
            "email": ADMIN_EMAIL,
            "password": "test123"
        })
        assert_test(resp.status_code == 409, "Duplicate email returns 409", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Duplicate email registration", str(e))
    
    # Test short password
    try:
        resp = session.post(f"{API_BASE}/auth/register", json={
            "full_name": "Test User",
            "email": "newuser@test.com",
            "password": "123"
        })
        assert_test(resp.status_code == 400, "Short password returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Short password validation", str(e))
    
    # Test wrong password login
    try:
        resp = session.post(f"{API_BASE}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert_test(resp.status_code == 401, "Wrong password returns 401", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Wrong password login", str(e))
    
    # Try to login as admin (or register if doesn't exist)
    admin_session = requests.Session()
    try:
        resp = admin_session.post(f"{API_BASE}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if resp.status_code == 401:
            # Admin doesn't exist, register
            log("Admin doesn't exist, registering...")
            resp = admin_session.post(f"{API_BASE}/auth/register", json={
                "full_name": "Admin",
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            assert_test(resp.status_code == 200, "Admin registration successful", f"Got {resp.status_code}")
        else:
            assert_test(resp.status_code == 200, "Admin login successful", f"Got {resp.status_code}")
        
        data = resp.json()
        user = data.get('user', {})
        assert_test(user.get('role') == 'admin', "User role is admin", f"Got role: {user.get('role')}")
    except Exception as e:
        assert_test(False, "Admin login/register", str(e))
    
    # Test /auth/me
    try:
        resp = admin_session.get(f"{API_BASE}/auth/me")
        assert_test(resp.status_code == 200, "GET /auth/me returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test('user' in data, "/auth/me returns user object", f"Got {data.keys()}")
    except Exception as e:
        assert_test(False, "GET /auth/me", str(e))
    
    # Test logout
    try:
        resp = admin_session.post(f"{API_BASE}/auth/logout")
        assert_test(resp.status_code == 200, "POST /auth/logout returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /auth/logout", str(e))
    
    # Test /auth/me after logout
    try:
        resp = admin_session.get(f"{API_BASE}/auth/me")
        assert_test(resp.status_code == 401, "GET /auth/me after logout returns 401", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "GET /auth/me after logout", str(e))
    
    return admin_session

def test_admin_classes_stats(admin_session):
    """Test 3: Admin classes and stats"""
    log("\n=== TEST 3: ADMIN CLASSES + STATS ===")
    
    # Re-login admin
    try:
        resp = admin_session.post(f"{API_BASE}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert_test(resp.status_code == 200, "Admin re-login successful", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Admin re-login", str(e))
        return None
    
    # Create a class for tomorrow
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    class_id = None
    try:
        resp = admin_session.post(f"{API_BASE}/admin/classes", json={
            "sport_id": "basketball",
            "coach_name": "Coach Test",
            "date": tomorrow,
            "start_time": "18:00",
            "end_time": "19:00",
            "capacity": 10
        })
        assert_test(resp.status_code == 200, "POST /admin/classes returns 200", f"Got {resp.status_code}")
        data = resp.json()
        class_obj = data.get('class', {})
        class_id = class_obj.get('id')
        assert_test(class_id is not None, "Created class has ID", f"Got {class_obj}")
    except Exception as e:
        assert_test(False, "POST /admin/classes", str(e))
    
    # Get all classes
    try:
        resp = admin_session.get(f"{API_BASE}/admin/classes")
        assert_test(resp.status_code == 200, "GET /admin/classes returns 200", f"Got {resp.status_code}")
        data = resp.json()
        classes = data.get('classes', [])
        assert_test(any(c.get('id') == class_id for c in classes), "New class appears in list", f"Class ID {class_id} not found")
    except Exception as e:
        assert_test(False, "GET /admin/classes", str(e))
    
    # Get admin stats
    try:
        resp = admin_session.get(f"{API_BASE}/admin/stats")
        assert_test(resp.status_code == 200, "GET /admin/stats returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test('total_users' in data, "Stats has total_users", f"Got {data.keys()}")
        assert_test('active_memberships' in data, "Stats has active_memberships", f"Got {data.keys()}")
        assert_test('today_classes' in data, "Stats has today_classes", f"Got {data.keys()}")
        assert_test('active_bookings' in data, "Stats has active_bookings", f"Got {data.keys()}")
        assert_test(isinstance(data.get('total_users'), int), "total_users is number", f"Got {type(data.get('total_users'))}")
    except Exception as e:
        assert_test(False, "GET /admin/stats", str(e))
    
    return class_id

def test_admin_register_member(admin_session):
    """Test 4: Admin register member (NEW feature)"""
    log("\n=== TEST 4: ADMIN REGISTER MEMBER ===")
    
    import time
    timestamp = int(time.time())
    
    # 4a: Adult with auto password
    adult1_email = f"testadult1_{timestamp}@test.com"
    adult1_password = None
    try:
        resp = admin_session.post(f"{API_BASE}/admin/members", json={
            "full_name": "Test Adult 1",
            "email": adult1_email,
            "phone": "9111111111",
            "role": "adult"
        })
        assert_test(resp.status_code == 200, "4a: Adult with auto password returns 200", f"Got {resp.status_code}")
        data = resp.json()
        user = data.get('user', {})
        assert_test(user.get('role') == 'adult', "4a: User role is adult", f"Got {user.get('role')}")
        adult1_password = data.get('temp_password')
        assert_test(adult1_password and len(adult1_password) >= 8, "4a: temp_password is 8+ chars", f"Got {adult1_password}")
        assert_test('email_sent' in data, "4a: email_sent field present", f"Got {data.keys()}")
        
        # Verify can login with temp password
        test_session = requests.Session()
        resp = test_session.post(f"{API_BASE}/auth/login", json={
            "email": adult1_email,
            "password": adult1_password
        })
        assert_test(resp.status_code == 200, "4a: Can login with temp password", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "4a: Adult with auto password", str(e))
    
    # 4b: Adult with membership
    adult2_email = f"testadult2_{timestamp}@test.com"
    adult2_user_id = None
    try:
        resp = admin_session.post(f"{API_BASE}/admin/members", json={
            "full_name": "Test Adult 2",
            "email": adult2_email,
            "role": "adult",
            "membership_id": "adult_3m"
        })
        assert_test(resp.status_code == 200, "4b: Adult with membership returns 200", f"Got {resp.status_code}")
        data = resp.json()
        membership = data.get('membership')
        assert_test(membership is not None, "4b: Membership created", f"Got {data.keys()}")
        assert_test(membership.get('status') == 'active', "4b: Membership status is active", f"Got {membership.get('status')}")
        adult2_user_id = data.get('user', {}).get('id')
        adult2_password = data.get('temp_password')
        
        # Login as this user and check dashboard
        test_session = requests.Session()
        resp = test_session.post(f"{API_BASE}/auth/login", json={
            "email": adult2_email,
            "password": adult2_password
        })
        assert_test(resp.status_code == 200, "4b: Can login as new user", f"Got {resp.status_code}")
        
        resp = test_session.get(f"{API_BASE}/dashboard")
        assert_test(resp.status_code == 200, "4b: Dashboard accessible", f"Got {resp.status_code}")
        data = resp.json()
        assert_test(data.get('active_membership') is not None, "4b: Dashboard shows active_membership", f"Got {data.keys()}")
    except Exception as e:
        assert_test(False, "4b: Adult with membership", str(e))
    
    # 4c: Parent + child + kids membership
    parent_email = f"testparent_{timestamp}@test.com"
    parent_password = None
    try:
        resp = admin_session.post(f"{API_BASE}/admin/members", json={
            "full_name": "Test Parent",
            "email": parent_email,
            "role": "parent",
            "child": {
                "child_name": "Kid",
                "dob": "2015-01-01",
                "gender": "Male"
            },
            "membership_id": "kids_1m",
            "selected_sports": ["basketball"]
        })
        assert_test(resp.status_code == 200, "4c: Parent+child+membership returns 200", f"Got {resp.status_code}")
        data = resp.json()
        user = data.get('user', {})
        assert_test(user.get('role') == 'parent', "4c: User role is parent", f"Got {user.get('role')}")
        child_profile = data.get('child_profile')
        assert_test(child_profile is not None, "4c: Child profile created", f"Got {data.keys()}")
        assert_test('basketball' in child_profile.get('selected_sports', []), "4c: Child has basketball in selected_sports", f"Got {child_profile.get('selected_sports')}")
        membership = data.get('membership')
        assert_test(membership is not None, "4c: Membership created", f"Got {data.keys()}")
        assert_test(membership.get('membership_id') == 'kids_1m', "4c: Membership is kids_1m", f"Got {membership.get('membership_id')}")
        parent_password = data.get('temp_password')
        
        # Login as parent and check children
        test_session = requests.Session()
        resp = test_session.post(f"{API_BASE}/auth/login", json={
            "email": parent_email,
            "password": parent_password
        })
        assert_test(resp.status_code == 200, "4c: Can login as parent", f"Got {resp.status_code}")
        
        resp = test_session.get(f"{API_BASE}/children")
        assert_test(resp.status_code == 200, "4c: GET /children accessible", f"Got {resp.status_code}")
        data = resp.json()
        children = data.get('children', [])
        assert_test(len(children) > 0, "4c: Parent has children", f"Got {len(children)} children")
    except Exception as e:
        assert_test(False, "4c: Parent+child+membership", str(e))
    
    # 4d: With explicit password
    adult4_email = f"testadult4_{timestamp}@test.com"
    custom_password = "customPass123"
    try:
        resp = admin_session.post(f"{API_BASE}/admin/members", json={
            "full_name": "Test Adult 4",
            "email": adult4_email,
            "role": "adult",
            "password": custom_password
        })
        assert_test(resp.status_code == 200, "4d: With explicit password returns 200", f"Got {resp.status_code}")
        
        # Verify can login with custom password
        test_session = requests.Session()
        resp = test_session.post(f"{API_BASE}/auth/login", json={
            "email": adult4_email,
            "password": custom_password
        })
        assert_test(resp.status_code == 200, "4d: Can login with custom password", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "4d: With explicit password", str(e))
    
    # 4e: Duplicate email
    try:
        resp = admin_session.post(f"{API_BASE}/admin/members", json={
            "full_name": "Duplicate",
            "email": adult1_email,
            "role": "adult"
        })
        assert_test(resp.status_code == 409, "4e: Duplicate email returns 409", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "4e: Duplicate email", str(e))
    
    # 4f: Missing required fields
    try:
        resp = admin_session.post(f"{API_BASE}/admin/members", json={
            "role": "adult"
        })
        assert_test(resp.status_code == 400, "4f: Missing full_name/email returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "4f: Missing required fields", str(e))
    
    # 4g: Non-admin trying to create member
    try:
        non_admin_session = requests.Session()
        resp = non_admin_session.post(f"{API_BASE}/auth/register", json={
            "full_name": "Regular User",
            "email": f"regular_{timestamp}@test.com",
            "password": "test123"
        })
        
        resp = non_admin_session.post(f"{API_BASE}/admin/members", json={
            "full_name": "Should Fail",
            "email": f"shouldfail_{timestamp}@test.com",
            "role": "adult"
        })
        assert_test(resp.status_code == 403, "4g: Non-admin returns 403", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "4g: Non-admin access", str(e))
    
    return adult2_email, adult2_password, parent_email, parent_password

def test_member_flow(member_email, member_password, class_id):
    """Test 5: Member flow (checkout, dashboard, bookings)"""
    log("\n=== TEST 5: MEMBER FLOW ===")
    
    member_session = requests.Session()
    
    # Login as member
    try:
        resp = member_session.post(f"{API_BASE}/auth/login", json={
            "email": member_email,
            "password": member_password
        })
        assert_test(resp.status_code == 200, "Member login successful", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Member login", str(e))
        return
    
    # Add another membership
    try:
        resp = member_session.post(f"{API_BASE}/checkout/mock", json={
            "membership_id": "adult_6m"
        })
        assert_test(resp.status_code == 200, "POST /checkout/mock adult_6m returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /checkout/mock", str(e))
    
    # Get dashboard
    try:
        resp = member_session.get(f"{API_BASE}/dashboard")
        assert_test(resp.status_code == 200, "GET /dashboard returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test(data.get('active_membership') is not None, "Dashboard has active_membership", f"Got {data.keys()}")
        payments = data.get('payments', [])
        assert_test(len(payments) >= 1, "Dashboard has payments", f"Got {len(payments)} payments")
    except Exception as e:
        assert_test(False, "GET /dashboard", str(e))
    
    # Get classes
    booking_id = None
    try:
        resp = member_session.get(f"{API_BASE}/classes")
        assert_test(resp.status_code == 200, "GET /classes returns 200", f"Got {resp.status_code}")
        data = resp.json()
        classes = data.get('classes', [])
        assert_test(len(classes) > 0, "Classes list not empty", f"Got {len(classes)} classes")
        
        # Find the basketball class
        basketball_class = next((c for c in classes if c.get('id') == class_id), None)
        if basketball_class:
            assert_test(basketball_class.get('sport') is not None, "Class has sport enriched", f"Got {basketball_class.get('sport')}")
            assert_test(basketball_class.get('booked_count') >= 0, "Class has booked_count", f"Got {basketball_class.get('booked_count')}")
            assert_test(basketball_class.get('is_booked') == False, "Class is_booked=false initially", f"Got {basketball_class.get('is_booked')}")
    except Exception as e:
        assert_test(False, "GET /classes", str(e))
    
    # Book the class
    try:
        resp = member_session.post(f"{API_BASE}/bookings", json={
            "class_id": class_id
        })
        assert_test(resp.status_code == 200, "POST /bookings returns 200", f"Got {resp.status_code}")
        data = resp.json()
        booking = data.get('booking', {})
        booking_id = booking.get('id')
        assert_test(booking_id is not None, "Booking has ID", f"Got {booking}")
    except Exception as e:
        assert_test(False, "POST /bookings", str(e))
    
    # Try duplicate booking
    try:
        resp = member_session.post(f"{API_BASE}/bookings", json={
            "class_id": class_id
        })
        assert_test(resp.status_code == 409, "Duplicate booking returns 409", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Duplicate booking", str(e))
    
    # Check dashboard for upcoming classes
    try:
        resp = member_session.get(f"{API_BASE}/dashboard")
        assert_test(resp.status_code == 200, "GET /dashboard after booking returns 200", f"Got {resp.status_code}")
        data = resp.json()
        upcoming = data.get('upcoming_classes', [])
        assert_test(len(upcoming) >= 1, "Dashboard has upcoming_classes", f"Got {len(upcoming)} upcoming classes")
        if len(upcoming) > 0:
            assert_test(upcoming[0].get('sport_name') == 'Basketball', "Upcoming class is Basketball", f"Got {upcoming[0].get('sport_name')}")
    except Exception as e:
        assert_test(False, "Dashboard upcoming classes", str(e))
    
    # Cancel booking
    if booking_id:
        try:
            resp = member_session.post(f"{API_BASE}/bookings/{booking_id}/cancel")
            assert_test(resp.status_code == 200, "POST /bookings/:id/cancel returns 200", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "POST /bookings/:id/cancel", str(e))
    
    return member_session

def test_pause_resume(member_session):
    """Test 6: Pause/Resume membership"""
    log("\n=== TEST 6: PAUSE / RESUME ===")
    
    # Pause membership
    try:
        resp = member_session.post(f"{API_BASE}/memberships/pause", json={
            "days": 30
        })
        assert_test(resp.status_code == 200, "POST /memberships/pause returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test(data.get('paused_days') == 30, "Paused for 30 days", f"Got {data.get('paused_days')}")
    except Exception as e:
        assert_test(False, "POST /memberships/pause", str(e))
    
    # Try to pause again (should fail)
    try:
        resp = member_session.post(f"{API_BASE}/memberships/pause", json={
            "days": 30
        })
        assert_test(resp.status_code == 400, "Second pause returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Second pause attempt", str(e))
    
    # Resume membership
    old_expiry = None
    try:
        # Get current expiry
        resp = member_session.get(f"{API_BASE}/dashboard")
        data = resp.json()
        active_mem = data.get('active_membership') or data.get('memberships', [{}])[0]
        old_expiry = active_mem.get('expiry_date')
        
        resp = member_session.post(f"{API_BASE}/memberships/resume")
        assert_test(resp.status_code == 200, "POST /memberships/resume returns 200", f"Got {resp.status_code}")
        data = resp.json()
        new_expiry = data.get('new_expiry')
        assert_test(new_expiry is not None, "Resume returns new_expiry", f"Got {data}")
        
        if old_expiry and new_expiry:
            from datetime import datetime
            old_date = datetime.fromisoformat(old_expiry.replace('Z', '+00:00'))
            new_date = datetime.fromisoformat(new_expiry.replace('Z', '+00:00'))
            assert_test(new_date > old_date, "New expiry is after old expiry", f"Old: {old_expiry}, New: {new_expiry}")
    except Exception as e:
        assert_test(False, "POST /memberships/resume", str(e))

def test_kids_sport_restriction(parent_email, parent_password, admin_session):
    """Test 7: Kids sport restriction"""
    log("\n=== TEST 7: KIDS SPORT RESTRICTION ===")
    
    # Create a futsal class as admin
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    futsal_class_id = None
    basketball_class_id = None
    
    try:
        resp = admin_session.post(f"{API_BASE}/admin/classes", json={
            "sport_id": "futsal",
            "coach_name": "Coach Futsal",
            "date": tomorrow,
            "start_time": "19:00",
            "end_time": "20:00",
            "capacity": 10
        })
        assert_test(resp.status_code == 200, "Created futsal class", f"Got {resp.status_code}")
        data = resp.json()
        futsal_class_id = data.get('class', {}).get('id')
    except Exception as e:
        assert_test(False, "Create futsal class", str(e))
    
    try:
        resp = admin_session.post(f"{API_BASE}/admin/classes", json={
            "sport_id": "basketball",
            "coach_name": "Coach Basketball",
            "date": tomorrow,
            "start_time": "20:00",
            "end_time": "21:00",
            "capacity": 10
        })
        assert_test(resp.status_code == 200, "Created basketball class", f"Got {resp.status_code}")
        data = resp.json()
        basketball_class_id = data.get('class', {}).get('id')
    except Exception as e:
        assert_test(False, "Create basketball class", str(e))
    
    # Login as parent
    parent_session = requests.Session()
    try:
        resp = parent_session.post(f"{API_BASE}/auth/login", json={
            "email": parent_email,
            "password": parent_password
        })
        assert_test(resp.status_code == 200, "Parent login successful", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Parent login", str(e))
        return
    
    # Try to book futsal class (should fail)
    if futsal_class_id:
        try:
            resp = parent_session.post(f"{API_BASE}/bookings", json={
                "class_id": futsal_class_id
            })
            assert_test(resp.status_code == 403, "Booking futsal (not in selection) returns 403", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "Book futsal class (should fail)", str(e))
    
    # Try to book basketball class (should succeed)
    if basketball_class_id:
        try:
            resp = parent_session.post(f"{API_BASE}/bookings", json={
                "class_id": basketball_class_id
            })
            assert_test(resp.status_code == 200, "Booking basketball (in selection) returns 200", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "Book basketball class", str(e))

def test_forgot_reset_password():
    """Test 8: Forgot/Reset password"""
    log("\n=== TEST 8: FORGOT/RESET PASSWORD ===")
    
    import time
    timestamp = int(time.time())
    test_email = f"resettest_{timestamp}@test.com"
    
    # Register a test user
    test_session = requests.Session()
    try:
        resp = test_session.post(f"{API_BASE}/auth/register", json={
            "full_name": "Reset Test User",
            "email": test_email,
            "password": "oldpass123"
        })
        assert_test(resp.status_code == 200, "Test user registered", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Register test user for reset", str(e))
        return
    
    # Request password reset
    reset_token = None
    try:
        resp = requests.post(f"{API_BASE}/auth/forgot", json={
            "email": test_email
        })
        assert_test(resp.status_code == 200, "POST /auth/forgot returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test('reset_link' in data, "Forgot response has reset_link", f"Got {data.keys()}")
        assert_test('token' in data, "Forgot response has token", f"Got {data.keys()}")
        assert_test('email_sent' in data, "Forgot response has email_sent", f"Got {data.keys()}")
        reset_token = data.get('token')
    except Exception as e:
        assert_test(False, "POST /auth/forgot", str(e))
    
    # Try reset with invalid token
    try:
        resp = requests.post(f"{API_BASE}/auth/reset", json={
            "token": "invalid_token_12345",
            "password": "newpass123"
        })
        assert_test(resp.status_code == 400, "Reset with invalid token returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Reset with invalid token", str(e))
    
    # Reset with valid token
    if reset_token:
        try:
            resp = requests.post(f"{API_BASE}/auth/reset", json={
                "token": reset_token,
                "password": "newpass123"
            })
            assert_test(resp.status_code == 200, "POST /auth/reset returns 200", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "POST /auth/reset", str(e))
        
        # Try login with old password (should fail)
        try:
            resp = test_session.post(f"{API_BASE}/auth/login", json={
                "email": test_email,
                "password": "oldpass123"
            })
            assert_test(resp.status_code == 401, "Login with old password returns 401", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "Login with old password", str(e))
        
        # Login with new password (should succeed)
        try:
            resp = test_session.post(f"{API_BASE}/auth/login", json={
                "email": test_email,
                "password": "newpass123"
            })
            assert_test(resp.status_code == 200, "Login with new password returns 200", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "Login with new password", str(e))

def test_profile(member_session):
    """Test 9: Profile endpoints"""
    log("\n=== TEST 9: PROFILE ===")
    
    # Update profile
    try:
        resp = member_session.patch(f"{API_BASE}/profile", json={
            "full_name": "Updated Name",
            "phone": "9333333333",
            "address": "Some Address",
            "emergency_contact": "Mom"
        })
        assert_test(resp.status_code == 200, "PATCH /profile returns 200", f"Got {resp.status_code}")
        data = resp.json()
        user = data.get('user', {})
        assert_test(user.get('full_name') == 'Updated Name', "Profile updated full_name", f"Got {user.get('full_name')}")
        assert_test(user.get('phone') == '9333333333', "Profile updated phone", f"Got {user.get('phone')}")
    except Exception as e:
        assert_test(False, "PATCH /profile", str(e))
    
    # Get full profile
    try:
        resp = member_session.get(f"{API_BASE}/profile/full")
        assert_test(resp.status_code == 200, "GET /profile/full returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test('user' in data, "Full profile has user", f"Got {data.keys()}")
        assert_test('children' in data, "Full profile has children", f"Got {data.keys()}")
        assert_test('memberships' in data, "Full profile has memberships", f"Got {data.keys()}")
        assert_test('payments' in data, "Full profile has payments", f"Got {data.keys()}")
    except Exception as e:
        assert_test(False, "GET /profile/full", str(e))

def test_admin_sub_features(admin_session):
    """Test 10: Admin sub-features (coaches, announcements, members, attendance, payments)"""
    log("\n=== TEST 10: ADMIN SUB-FEATURES ===")
    
    # Create coach
    coach_id = None
    try:
        resp = admin_session.post(f"{API_BASE}/admin/coaches", json={
            "full_name": "Coach A",
            "email": "coacha@x.com",
            "sports": ["basketball"],
            "bio": "Experienced coach"
        })
        assert_test(resp.status_code == 200, "POST /admin/coaches returns 200", f"Got {resp.status_code}")
        data = resp.json()
        coach = data.get('coach', {})
        coach_id = coach.get('id')
        assert_test(coach_id is not None, "Coach has ID", f"Got {coach}")
    except Exception as e:
        assert_test(False, "POST /admin/coaches", str(e))
    
    # Get coaches (admin)
    try:
        resp = admin_session.get(f"{API_BASE}/admin/coaches")
        assert_test(resp.status_code == 200, "GET /admin/coaches returns 200", f"Got {resp.status_code}")
        data = resp.json()
        coaches = data.get('coaches', [])
        assert_test(any(c.get('id') == coach_id for c in coaches), "Coach appears in admin list", f"Coach ID {coach_id} not found")
    except Exception as e:
        assert_test(False, "GET /admin/coaches", str(e))
    
    # Get coaches (public)
    try:
        resp = requests.get(f"{API_BASE}/coaches")
        assert_test(resp.status_code == 200, "GET /coaches (public) returns 200", f"Got {resp.status_code}")
        data = resp.json()
        coaches = data.get('coaches', [])
        assert_test(any(c.get('id') == coach_id for c in coaches), "Coach visible in public list", f"Coach ID {coach_id} not found")
    except Exception as e:
        assert_test(False, "GET /coaches (public)", str(e))
    
    # Delete coach
    if coach_id:
        try:
            resp = admin_session.delete(f"{API_BASE}/admin/coaches/{coach_id}")
            assert_test(resp.status_code == 200, "DELETE /admin/coaches/:id returns 200", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "DELETE /admin/coaches/:id", str(e))
    
    # Create announcement
    announcement_id = None
    try:
        resp = admin_session.post(f"{API_BASE}/admin/announcements", json={
            "title": "Holiday",
            "message": "Closed Sunday"
        })
        assert_test(resp.status_code == 200, "POST /admin/announcements returns 200", f"Got {resp.status_code}")
        data = resp.json()
        announcement = data.get('announcement', {})
        announcement_id = announcement.get('id')
        assert_test(announcement_id is not None, "Announcement has ID", f"Got {announcement}")
    except Exception as e:
        assert_test(False, "POST /admin/announcements", str(e))
    
    # Get announcements
    try:
        resp = admin_session.get(f"{API_BASE}/admin/announcements")
        assert_test(resp.status_code == 200, "GET /admin/announcements returns 200", f"Got {resp.status_code}")
        data = resp.json()
        announcements = data.get('announcements', [])
        assert_test(any(a.get('id') == announcement_id for a in announcements), "Announcement appears in list", f"Announcement ID {announcement_id} not found")
    except Exception as e:
        assert_test(False, "GET /admin/announcements", str(e))
    
    # Delete announcement
    if announcement_id:
        try:
            resp = admin_session.delete(f"{API_BASE}/admin/announcements/{announcement_id}")
            assert_test(resp.status_code == 200, "DELETE /admin/announcements/:id returns 200", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "DELETE /admin/announcements/:id", str(e))
    
    # Get members with search
    try:
        resp = admin_session.get(f"{API_BASE}/admin/members?q=Test")
        assert_test(resp.status_code == 200, "GET /admin/members?q=Test returns 200", f"Got {resp.status_code}")
        data = resp.json()
        members = data.get('members', [])
        assert_test(isinstance(members, list), "Members is a list", f"Got {type(members)}")
    except Exception as e:
        assert_test(False, "GET /admin/members with search", str(e))
    
    # Get member detail
    try:
        # Get a user ID first
        resp = admin_session.get(f"{API_BASE}/admin/members")
        data = resp.json()
        members = data.get('members', [])
        if len(members) > 0:
            user_id = members[0].get('id')
            resp = admin_session.get(f"{API_BASE}/admin/members/{user_id}/detail")
            assert_test(resp.status_code == 200, "GET /admin/members/:id/detail returns 200", f"Got {resp.status_code}")
            data = resp.json()
            assert_test('user' in data, "Member detail has user", f"Got {data.keys()}")
            assert_test('memberships' in data, "Member detail has memberships", f"Got {data.keys()}")
            assert_test('payments' in data, "Member detail has payments", f"Got {data.keys()}")
            assert_test('bookings' in data, "Member detail has bookings", f"Got {data.keys()}")
    except Exception as e:
        assert_test(False, "GET /admin/members/:id/detail", str(e))
    
    # Update member
    try:
        resp = admin_session.get(f"{API_BASE}/admin/members")
        data = resp.json()
        members = data.get('members', [])
        if len(members) > 0:
            user_id = members[0].get('id')
            resp = admin_session.patch(f"{API_BASE}/admin/members/{user_id}", json={
                "full_name": "Renamed User"
            })
            assert_test(resp.status_code == 200, "PATCH /admin/members/:id returns 200", f"Got {resp.status_code}")
            data = resp.json()
            user = data.get('user', {})
            assert_test(user.get('full_name') == 'Renamed User', "Member name updated", f"Got {user.get('full_name')}")
    except Exception as e:
        assert_test(False, "PATCH /admin/members/:id", str(e))
    
    # Deactivate member
    try:
        resp = admin_session.get(f"{API_BASE}/admin/members")
        data = resp.json()
        members = data.get('members', [])
        # Find a member with active membership
        target_user_id = None
        for m in members:
            if m.get('latest_membership') and m.get('latest_membership', {}).get('status') == 'active':
                target_user_id = m.get('id')
                break
        
        if target_user_id:
            resp = admin_session.post(f"{API_BASE}/admin/members/{target_user_id}/deactivate")
            assert_test(resp.status_code == 200, "POST /admin/members/:id/deactivate returns 200", f"Got {resp.status_code}")
            
            # Verify memberships are expired
            resp = admin_session.get(f"{API_BASE}/admin/members/{target_user_id}/detail")
            data = resp.json()
            memberships = data.get('memberships', [])
            active_count = sum(1 for m in memberships if m.get('status') == 'active')
            assert_test(active_count == 0, "No active memberships after deactivation", f"Found {active_count} active memberships")
    except Exception as e:
        assert_test(False, "POST /admin/members/:id/deactivate", str(e))
    
    # Get payments
    try:
        resp = admin_session.get(f"{API_BASE}/admin/payments")
        assert_test(resp.status_code == 200, "GET /admin/payments returns 200", f"Got {resp.status_code}")
        data = resp.json()
        payments = data.get('payments', [])
        assert_test(isinstance(payments, list), "Payments is a list", f"Got {type(payments)}")
        if len(payments) > 0:
            assert_test('user_name' in payments[0], "Payment has user_name enriched", f"Got {payments[0].keys()}")
    except Exception as e:
        assert_test(False, "GET /admin/payments", str(e))

def test_security():
    """Test 11: Security checks"""
    log("\n=== TEST 11: SECURITY ===")
    
    # Test without cookie
    try:
        resp = requests.get(f"{API_BASE}/dashboard")
        assert_test(resp.status_code == 401, "GET /dashboard without auth returns 401", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Dashboard without auth", str(e))
    
    # Test non-admin trying admin endpoint
    try:
        non_admin_session = requests.Session()
        import time
        timestamp = int(time.time())
        resp = non_admin_session.post(f"{API_BASE}/auth/register", json={
            "full_name": "Non Admin",
            "email": f"nonadmin_{timestamp}@test.com",
            "password": "test123"
        })
        
        resp = non_admin_session.get(f"{API_BASE}/admin/stats")
        assert_test(resp.status_code == 403, "Non-admin trying /admin/* returns 403", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Non-admin access to admin endpoint", str(e))

def main():
    """Run all tests"""
    log("=" * 80)
    log("FLOWTERNITY BACKEND COMPREHENSIVE TEST")
    log(f"Base URL: {BASE_URL}")
    log(f"API Base: {API_BASE}")
    log("=" * 80)
    
    # Run tests in sequence
    test_health()
    admin_session = test_auth()
    class_id = test_admin_classes_stats(admin_session)
    adult2_email, adult2_password, parent_email, parent_password = test_admin_register_member(admin_session)
    
    if adult2_email and adult2_password and class_id:
        member_session = test_member_flow(adult2_email, adult2_password, class_id)
        if member_session:
            test_pause_resume(member_session)
            test_profile(member_session)
    
    if parent_email and parent_password and admin_session:
        test_kids_sport_restriction(parent_email, parent_password, admin_session)
    
    test_forgot_reset_password()
    test_admin_sub_features(admin_session)
    test_security()
    
    # Print summary
    log("\n" + "=" * 80)
    log("TEST SUMMARY")
    log("=" * 80)
    log(f"Total Tests: {total_tests}")
    log(f"Passed: {passed_tests}")
    log(f"Failed: {len(failed_tests)}")
    log(f"Pass Rate: {(passed_tests/total_tests*100):.1f}%")
    
    if failed_tests:
        log("\n" + "=" * 80)
        log("FAILED TESTS:")
        log("=" * 80)
        for i, failure in enumerate(failed_tests, 1):
            log(f"{i}. {failure}")
    
    log("\n" + "=" * 80)
    
    # Exit with appropriate code
    sys.exit(0 if len(failed_tests) == 0 else 1)

if __name__ == "__main__":
    main()
