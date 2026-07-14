#!/usr/bin/env python3
"""
Backend Test for Flowternity Sports Platform - Iteration 4
Tests NEW endpoints added in Iteration 4 + regression tests
"""

import requests
import json
from datetime import datetime, timedelta
import sys
import os
import time

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
API_BASE = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@flowternity.test"
ADMIN_PASSWORD = "Admin@1234"

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

def test_trial_endpoints():
    """Test 1: Public trial endpoints (no auth required)"""
    log("\n=== TEST 1: PUBLIC TRIAL ENDPOINTS ===")
    
    # Test GET /api/trial/classes
    try:
        resp = requests.get(f"{API_BASE}/trial/classes")
        assert_test(resp.status_code == 200, "GET /trial/classes returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test('classes' in data, "Response has classes array", f"Got keys: {data.keys()}")
        
        if data.get('classes'):
            cls = data['classes'][0]
            assert_test('seats_left' in cls, "Class has seats_left field", f"Got keys: {cls.keys()}")
            assert_test('sport' in cls, "Class has sport object", f"Got keys: {cls.keys()}")
            assert_test('booked_count' in cls, "Class has booked_count field", f"Got keys: {cls.keys()}")
    except Exception as e:
        assert_test(False, "GET /trial/classes", str(e))
    
    # Test GET /api/trial/classes with sport filter
    try:
        # First get config to get a valid sport_id
        config_resp = requests.get(f"{API_BASE}/config")
        sports = config_resp.json().get('sports', [])
        if sports:
            sport_id = sports[0]['id']
            resp = requests.get(f"{API_BASE}/trial/classes?sport={sport_id}")
            assert_test(resp.status_code == 200, "GET /trial/classes?sport=X returns 200", f"Got {resp.status_code}")
            data = resp.json()
            # All returned classes should match the sport filter
            if data.get('classes'):
                all_match = all(c.get('sport', {}).get('id') == sport_id for c in data['classes'])
                assert_test(all_match, "Sport filter works correctly", f"Classes: {len(data['classes'])}")
    except Exception as e:
        assert_test(False, "GET /trial/classes with sport filter", str(e))
    
    # Test POST /api/trial/book with valid data
    try:
        # Get a valid sport_id
        config_resp = requests.get(f"{API_BASE}/config")
        sports = config_resp.json().get('sports', [])
        sport_id = sports[0]['id'] if sports else 'basketball'
        
        unique_email = f"triallead{int(time.time())}@test.com"
        resp = requests.post(f"{API_BASE}/trial/book", json={
            "full_name": "Trial User",
            "email": unique_email,
            "phone": "+919876543210",
            "sport_id": sport_id,
            "message": "Interested in trial class"
        })
        assert_test(resp.status_code == 200, "POST /trial/book with valid data returns 200", f"Got {resp.status_code}: {resp.text}")
        data = resp.json()
        assert_test('lead' in data, "Response has lead object", f"Got keys: {data.keys()}")
        assert_test('email_sent' in data, "Response has email_sent field", f"Got keys: {data.keys()}")
        assert_test('class' in data, "Response has class field", f"Got keys: {data.keys()}")
        
        # Store for duplicate test
        test_email = unique_email
    except Exception as e:
        assert_test(False, "POST /trial/book with valid data", str(e))
        test_email = None
    
    # Test POST /api/trial/book with same email (should return 409)
    if test_email:
        try:
            resp = requests.post(f"{API_BASE}/trial/book", json={
                "full_name": "Trial User",
                "email": test_email,
                "phone": "+919876543210",
                "sport_id": sport_id
            })
            assert_test(resp.status_code == 409, "POST /trial/book duplicate email returns 409", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "POST /trial/book duplicate email", str(e))
    
    # Test POST /api/trial/book with missing fields
    try:
        resp = requests.post(f"{API_BASE}/trial/book", json={
            "full_name": "Trial User",
            "email": "test@test.com"
            # Missing phone and sport_id
        })
        assert_test(resp.status_code == 400, "POST /trial/book missing fields returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /trial/book missing fields", str(e))
    
    # Test POST /api/trial/book with class_id
    try:
        # Get a class from trial/classes
        classes_resp = requests.get(f"{API_BASE}/trial/classes")
        classes = classes_resp.json().get('classes', [])
        if classes:
            class_id = classes[0]['id']
            unique_email2 = f"triallead{int(time.time())+1}@test.com"
            resp = requests.post(f"{API_BASE}/trial/book", json={
                "full_name": "Trial User 2",
                "email": unique_email2,
                "phone": "+919876543211",
                "sport_id": sport_id,
                "class_id": class_id
            })
            assert_test(resp.status_code == 200, "POST /trial/book with class_id returns 200", f"Got {resp.status_code}")
            data = resp.json()
            assert_test(data.get('class') is not None, "Response has class object populated", f"class: {data.get('class')}")
    except Exception as e:
        assert_test(False, "POST /trial/book with class_id", str(e))

def test_register_and_pay():
    """Test 2: Combined register + pay endpoint"""
    log("\n=== TEST 2: REGISTER + PAY COMBINED ENDPOINT ===")
    
    # Test adult flow
    try:
        unique_email = f"newadult{int(time.time())}@test.com"
        resp = requests.post(f"{API_BASE}/checkout/register-and-pay", json={
            "full_name": "New Adult User",
            "email": unique_email,
            "password": "Test1234",
            "phone": "+919000000001",
            "role": "adult",
            "membership_id": "adult_3m"
        })
        assert_test(resp.status_code == 200, "POST /checkout/register-and-pay adult flow returns 200", f"Got {resp.status_code}: {resp.text}")
        data = resp.json()
        assert_test('user' in data, "Response has user object", f"Got keys: {data.keys()}")
        assert_test('user_membership' in data, "Response has user_membership object", f"Got keys: {data.keys()}")
        assert_test('payment' in data, "Response has payment object", f"Got keys: {data.keys()}")
        
        # Verify cookie is set by checking /auth/me
        cookies = resp.cookies
        me_resp = requests.get(f"{API_BASE}/auth/me", cookies=cookies)
        assert_test(me_resp.status_code == 200, "GET /auth/me after register-and-pay returns 200", f"Got {me_resp.status_code}")
        me_data = me_resp.json()
        assert_test(me_data.get('user', {}).get('email') == unique_email, "Auth cookie set correctly", f"Got email: {me_data.get('user', {}).get('email')}")
    except Exception as e:
        assert_test(False, "POST /checkout/register-and-pay adult flow", str(e))
    
    # Test parent + kid flow
    try:
        unique_email = f"newparent{int(time.time())}@test.com"
        resp = requests.post(f"{API_BASE}/checkout/register-and-pay", json={
            "full_name": "New Parent User",
            "email": unique_email,
            "password": "Test1234",
            "phone": "+919000000002",
            "role": "parent",
            "membership_id": "kids_1m",
            "selected_sports": ["basketball"],
            "child": {
                "child_name": "Kid A",
                "dob": "2015-01-01",
                "gender": "Male"
            }
        })
        assert_test(resp.status_code == 200, "POST /checkout/register-and-pay parent+kid flow returns 200", f"Got {resp.status_code}: {resp.text}")
        data = resp.json()
        assert_test('child_profile' in data, "Response has child_profile object", f"Got keys: {data.keys()}")
        assert_test(data.get('child_profile') is not None, "child_profile is populated", f"child_profile: {data.get('child_profile')}")
    except Exception as e:
        assert_test(False, "POST /checkout/register-and-pay parent+kid flow", str(e))
    
    # Test missing password
    try:
        resp = requests.post(f"{API_BASE}/checkout/register-and-pay", json={
            "full_name": "Test User",
            "email": "test@test.com",
            "membership_id": "adult_3m"
            # Missing password
        })
        assert_test(resp.status_code == 400, "POST /checkout/register-and-pay missing password returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /checkout/register-and-pay missing password", str(e))
    
    # Test missing membership_id
    try:
        resp = requests.post(f"{API_BASE}/checkout/register-and-pay", json={
            "full_name": "Test User",
            "email": "test@test.com",
            "password": "Test1234"
            # Missing membership_id
        })
        assert_test(resp.status_code == 400, "POST /checkout/register-and-pay missing membership_id returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /checkout/register-and-pay missing membership_id", str(e))
    
    # Test kids membership without child info
    try:
        unique_email = f"nokid{int(time.time())}@test.com"
        resp = requests.post(f"{API_BASE}/checkout/register-and-pay", json={
            "full_name": "Parent No Kid",
            "email": unique_email,
            "password": "Test1234",
            "phone": "+919000000003",
            "role": "parent",
            "membership_id": "kids_1m",
            "selected_sports": ["basketball"]
            # Missing child info
        })
        assert_test(resp.status_code == 400, "POST /checkout/register-and-pay kids without child returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /checkout/register-and-pay kids without child", str(e))
    
    # Test kids membership without selected_sports
    try:
        unique_email = f"nosports{int(time.time())}@test.com"
        resp = requests.post(f"{API_BASE}/checkout/register-and-pay", json={
            "full_name": "Parent No Sports",
            "email": unique_email,
            "password": "Test1234",
            "phone": "+919000000004",
            "role": "parent",
            "membership_id": "kids_1m",
            "child": {
                "child_name": "Kid B",
                "dob": "2015-01-01",
                "gender": "Male"
            }
            # Missing selected_sports
        })
        assert_test(resp.status_code == 400, "POST /checkout/register-and-pay kids without selected_sports returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /checkout/register-and-pay kids without selected_sports", str(e))
    
    # Test duplicate email
    try:
        resp = requests.post(f"{API_BASE}/checkout/register-and-pay", json={
            "full_name": "Admin User",
            "email": ADMIN_EMAIL,
            "password": "Test1234",
            "phone": "+919000000005",
            "role": "adult",
            "membership_id": "adult_3m"
        })
        assert_test(resp.status_code == 409, "POST /checkout/register-and-pay duplicate email returns 409", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /checkout/register-and-pay duplicate email", str(e))
    
    # Test invalid membership_id
    try:
        unique_email = f"invalidmem{int(time.time())}@test.com"
        resp = requests.post(f"{API_BASE}/checkout/register-and-pay", json={
            "full_name": "Invalid Membership",
            "email": unique_email,
            "password": "Test1234",
            "phone": "+919000000006",
            "role": "adult",
            "membership_id": "invalid_membership"
        })
        assert_test(resp.status_code == 400, "POST /checkout/register-and-pay invalid membership_id returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /checkout/register-and-pay invalid membership_id", str(e))

def test_admin_membership_management():
    """Test 3: Admin grant/extend/expire membership + refund payment"""
    log("\n=== TEST 3: ADMIN MEMBERSHIP MANAGEMENT ===")
    
    # Login as admin
    session = requests.Session()
    try:
        login_resp = session.post(f"{API_BASE}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert_test(login_resp.status_code == 200, "Admin login successful", f"Got {login_resp.status_code}")
    except Exception as e:
        assert_test(False, "Admin login", str(e))
        return
    
    # Create a target user for grant test
    target_user_id = None
    try:
        unique_email = f"granttarget{int(time.time())}@test.com"
        reg_resp = requests.post(f"{API_BASE}/auth/register", json={
            "full_name": "Grant Target User",
            "email": unique_email,
            "password": "Test1234",
            "phone": "+919111111111",
            "role": "adult"
        })
        if reg_resp.status_code == 200:
            target_user_id = reg_resp.json().get('user', {}).get('id')
            log(f"Created target user: {target_user_id}")
    except Exception as e:
        log(f"Failed to create target user: {e}", "ERROR")
    
    # Test POST /api/admin/members/:uid/grant-membership
    granted_membership_id = None
    granted_payment_id = None
    if target_user_id:
        try:
            resp = session.post(f"{API_BASE}/admin/members/{target_user_id}/grant-membership", json={
                "membership_id": "adult_3m",
                "note": "Test grant"
            })
            assert_test(resp.status_code == 200, "POST /admin/members/:uid/grant-membership returns 200", f"Got {resp.status_code}: {resp.text}")
            data = resp.json()
            assert_test('user_membership' in data, "Response has user_membership object", f"Got keys: {data.keys()}")
            granted_membership_id = data.get('user_membership', {}).get('id')
            
            # Verify payment was created with method="admin_granted" and amount=0
            payments_resp = session.get(f"{API_BASE}/admin/payments?limit=10")
            if payments_resp.status_code == 200:
                payments = payments_resp.json().get('payments', [])
                admin_payment = next((p for p in payments if p.get('method') == 'admin_granted' and p.get('user_membership_id') == granted_membership_id), None)
                assert_test(admin_payment is not None, "Admin granted payment created", f"Found payment: {admin_payment}")
                if admin_payment:
                    assert_test(admin_payment.get('amount') == 0, "Admin granted payment has amount=0", f"Got amount: {admin_payment.get('amount')}")
                    granted_payment_id = admin_payment.get('id')
        except Exception as e:
            assert_test(False, "POST /admin/members/:uid/grant-membership", str(e))
    
    # Test kids grant without child_profile_id
    try:
        if target_user_id:
            resp = session.post(f"{API_BASE}/admin/members/{target_user_id}/grant-membership", json={
                "membership_id": "kids_1m"
                # Missing child_profile_id
            })
            assert_test(resp.status_code == 400, "POST /admin/members/:uid/grant-membership kids without child_profile_id returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /admin/members/:uid/grant-membership kids without child_profile_id", str(e))
    
    # Test POST /api/admin/memberships/:mid/extend
    if granted_membership_id:
        try:
            # Get current expiry
            detail_resp = session.get(f"{API_BASE}/admin/members/{target_user_id}/detail")
            if detail_resp.status_code == 200:
                memberships = detail_resp.json().get('memberships', [])
                current_membership = next((m for m in memberships if m.get('id') == granted_membership_id), None)
                if current_membership:
                    old_expiry = current_membership.get('expiry_date')
                    
                    resp = session.post(f"{API_BASE}/admin/memberships/{granted_membership_id}/extend", json={
                        "days": 15,
                        "note": "Test extension"
                    })
                    assert_test(resp.status_code == 200, "POST /admin/memberships/:mid/extend returns 200", f"Got {resp.status_code}: {resp.text}")
                    data = resp.json()
                    assert_test('expiry_date' in data, "Response has expiry_date", f"Got keys: {data.keys()}")
                    
                    # Verify expiry date was extended
                    new_expiry = data.get('expiry_date')
                    if old_expiry and new_expiry:
                        old_date = datetime.fromisoformat(old_expiry.replace('Z', '+00:00'))
                        new_date = datetime.fromisoformat(new_expiry.replace('Z', '+00:00'))
                        diff_days = (new_date - old_date).days
                        assert_test(diff_days == 15, "Expiry date extended by 15 days", f"Extended by {diff_days} days")
        except Exception as e:
            assert_test(False, "POST /admin/memberships/:mid/extend", str(e))
    
    # Test POST /api/admin/memberships/:mid/extend with invalid days
    if granted_membership_id:
        try:
            resp = session.post(f"{API_BASE}/admin/memberships/{granted_membership_id}/extend", json={
                "days": 0
            })
            assert_test(resp.status_code == 400, "POST /admin/memberships/:mid/extend days=0 returns 400", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "POST /admin/memberships/:mid/extend days=0", str(e))
        
        try:
            resp = session.post(f"{API_BASE}/admin/memberships/{granted_membership_id}/extend", json={
                "days": 400
            })
            assert_test(resp.status_code == 400, "POST /admin/memberships/:mid/extend days=400 returns 400", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "POST /admin/memberships/:mid/extend days=400", str(e))
    
    # Test POST /api/admin/memberships/:mid/expire
    if granted_membership_id:
        try:
            resp = session.post(f"{API_BASE}/admin/memberships/{granted_membership_id}/expire")
            assert_test(resp.status_code == 200, "POST /admin/memberships/:mid/expire returns 200", f"Got {resp.status_code}: {resp.text}")
            
            # Verify membership status is expired
            detail_resp = session.get(f"{API_BASE}/admin/members/{target_user_id}/detail")
            if detail_resp.status_code == 200:
                memberships = detail_resp.json().get('memberships', [])
                expired_membership = next((m for m in memberships if m.get('id') == granted_membership_id), None)
                if expired_membership:
                    assert_test(expired_membership.get('status') == 'expired', "Membership status is expired", f"Got status: {expired_membership.get('status')}")
        except Exception as e:
            assert_test(False, "POST /admin/memberships/:mid/expire", str(e))
    
    # Test POST /api/admin/payments/:pid/refund
    if granted_payment_id:
        try:
            resp = session.post(f"{API_BASE}/admin/payments/{granted_payment_id}/refund")
            assert_test(resp.status_code == 200, "POST /admin/payments/:pid/refund returns 200", f"Got {resp.status_code}: {resp.text}")
            
            # Verify payment status is refunded
            payments_resp = session.get(f"{API_BASE}/admin/payments?limit=50")
            if payments_resp.status_code == 200:
                payments = payments_resp.json().get('payments', [])
                refunded_payment = next((p for p in payments if p.get('id') == granted_payment_id), None)
                if refunded_payment:
                    assert_test(refunded_payment.get('status') == 'refunded', "Payment status is refunded", f"Got status: {refunded_payment.get('status')}")
        except Exception as e:
            assert_test(False, "POST /admin/payments/:pid/refund", str(e))
        
        # Test refund same payment again (should return 400)
        try:
            resp = session.post(f"{API_BASE}/admin/payments/{granted_payment_id}/refund")
            assert_test(resp.status_code == 400, "POST /admin/payments/:pid/refund already refunded returns 400", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "POST /admin/payments/:pid/refund already refunded", str(e))
    
    # Test refund non-existent payment
    try:
        resp = session.post(f"{API_BASE}/admin/payments/nonexistent-id/refund")
        assert_test(resp.status_code == 404, "POST /admin/payments/:pid/refund non-existent returns 404", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /admin/payments/:pid/refund non-existent", str(e))
    
    # Test non-admin access
    try:
        non_admin_session = requests.Session()
        # Create and login as non-admin user
        unique_email = f"nonadmin{int(time.time())}@test.com"
        reg_resp = non_admin_session.post(f"{API_BASE}/auth/register", json={
            "full_name": "Non Admin",
            "email": unique_email,
            "password": "Test1234"
        })
        if reg_resp.status_code == 200:
            # Try to grant membership as non-admin
            resp = non_admin_session.post(f"{API_BASE}/admin/members/{target_user_id}/grant-membership", json={
                "membership_id": "adult_3m"
            })
            assert_test(resp.status_code == 403, "Non-admin grant-membership returns 403", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Non-admin access test", str(e))

def test_admin_trial_leads():
    """Test 4: Admin trial-leads endpoints"""
    log("\n=== TEST 4: ADMIN TRIAL-LEADS ===")
    
    # Login as admin
    session = requests.Session()
    try:
        login_resp = session.post(f"{API_BASE}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert_test(login_resp.status_code == 200, "Admin login successful", f"Got {login_resp.status_code}")
    except Exception as e:
        assert_test(False, "Admin login", str(e))
        return
    
    # Test GET /api/admin/trial-leads
    lead_id = None
    try:
        resp = session.get(f"{API_BASE}/admin/trial-leads")
        assert_test(resp.status_code == 200, "GET /admin/trial-leads returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test('leads' in data, "Response has leads array", f"Got keys: {data.keys()}")
        
        if data.get('leads'):
            lead = data['leads'][0]
            assert_test('sport_name' in lead, "Lead has sport_name field", f"Got keys: {lead.keys()}")
            lead_id = lead.get('id')
    except Exception as e:
        assert_test(False, "GET /admin/trial-leads", str(e))
    
    # Test PATCH /api/admin/trial-leads/:id with valid status
    if lead_id:
        try:
            resp = session.patch(f"{API_BASE}/admin/trial-leads/{lead_id}", json={
                "status": "attended"
            })
            assert_test(resp.status_code == 200, "PATCH /admin/trial-leads/:id valid status returns 200", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "PATCH /admin/trial-leads/:id valid status", str(e))
    
    # Test PATCH /api/admin/trial-leads/:id with invalid status
    if lead_id:
        try:
            resp = session.patch(f"{API_BASE}/admin/trial-leads/{lead_id}", json={
                "status": "invalid_status"
            })
            assert_test(resp.status_code == 400, "PATCH /admin/trial-leads/:id invalid status returns 400", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "PATCH /admin/trial-leads/:id invalid status", str(e))

def test_pagination():
    """Test 5: Pagination on admin endpoints"""
    log("\n=== TEST 5: PAGINATION ===")
    
    # Login as admin
    session = requests.Session()
    try:
        login_resp = session.post(f"{API_BASE}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert_test(login_resp.status_code == 200, "Admin login successful", f"Got {login_resp.status_code}")
    except Exception as e:
        assert_test(False, "Admin login", str(e))
        return
    
    # Test GET /api/admin/members with pagination
    try:
        resp = session.get(f"{API_BASE}/admin/members?page=1&limit=5")
        assert_test(resp.status_code == 200, "GET /admin/members?page=1&limit=5 returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test('members' in data, "Response has members array", f"Got keys: {data.keys()}")
        assert_test('total' in data, "Response has total field", f"Got keys: {data.keys()}")
        assert_test('page' in data, "Response has page field", f"Got keys: {data.keys()}")
        assert_test('limit' in data, "Response has limit field", f"Got keys: {data.keys()}")
        assert_test(len(data.get('members', [])) <= 5, "Members array length <= 5", f"Got {len(data.get('members', []))} members")
    except Exception as e:
        assert_test(False, "GET /admin/members with pagination", str(e))
    
    # Test GET /api/admin/members with search query
    try:
        resp = session.get(f"{API_BASE}/admin/members?q=admin")
        assert_test(resp.status_code == 200, "GET /admin/members?q=admin returns 200", f"Got {resp.status_code}")
        data = resp.json()
        # Should match by name/email/phone (case-insensitive)
        if data.get('members'):
            # At least one member should match "admin" in name or email
            has_match = any('admin' in m.get('full_name', '').lower() or 'admin' in m.get('email', '').lower() for m in data['members'])
            assert_test(has_match, "Search query matches members", f"Found {len(data['members'])} members")
    except Exception as e:
        assert_test(False, "GET /admin/members with search query", str(e))
    
    # Test GET /api/admin/payments with pagination
    try:
        resp = session.get(f"{API_BASE}/admin/payments?page=1&limit=5")
        assert_test(resp.status_code == 200, "GET /admin/payments?page=1&limit=5 returns 200", f"Got {resp.status_code}")
        data = resp.json()
        assert_test('payments' in data, "Response has payments array", f"Got keys: {data.keys()}")
        assert_test('total' in data, "Response has total field", f"Got keys: {data.keys()}")
        assert_test('page' in data, "Response has page field", f"Got keys: {data.keys()}")
        assert_test('limit' in data, "Response has limit field", f"Got keys: {data.keys()}")
        assert_test(len(data.get('payments', [])) <= 5, "Payments array length <= 5", f"Got {len(data.get('payments', []))} payments")
    except Exception as e:
        assert_test(False, "GET /admin/payments with pagination", str(e))

def test_regression():
    """Test 6: Regression - verify existing endpoints still work"""
    log("\n=== TEST 6: REGRESSION TESTS ===")
    
    # Test GET /api/config
    try:
        resp = requests.get(f"{API_BASE}/config")
        assert_test(resp.status_code == 200, "REGRESSION: GET /config returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: GET /config", str(e))
    
    # Test POST /api/auth/login
    session = requests.Session()
    try:
        resp = session.post(f"{API_BASE}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert_test(resp.status_code == 200, "REGRESSION: POST /auth/login returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: POST /auth/login", str(e))
        return
    
    # Test GET /api/auth/me
    try:
        resp = session.get(f"{API_BASE}/auth/me")
        assert_test(resp.status_code == 200, "REGRESSION: GET /auth/me returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: GET /auth/me", str(e))
    
    # Test POST /api/admin/classes
    try:
        # Get a valid sport_id
        config_resp = requests.get(f"{API_BASE}/config")
        sports = config_resp.json().get('sports', [])
        sport_id = sports[0]['id'] if sports else 'basketball'
        
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        resp = session.post(f"{API_BASE}/admin/classes", json={
            "sport_id": sport_id,
            "coach_name": "Test Coach",
            "date": tomorrow,
            "start_time": "10:00",
            "end_time": "11:00",
            "capacity": 20
        })
        assert_test(resp.status_code == 200, "REGRESSION: POST /admin/classes returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: POST /admin/classes", str(e))
    
    # Test POST /api/admin/members
    try:
        unique_email = f"regtest{int(time.time())}@test.com"
        resp = session.post(f"{API_BASE}/admin/members", json={
            "full_name": "Regression Test User",
            "email": unique_email,
            "phone": "+919222222222",
            "role": "adult"
        })
        assert_test(resp.status_code == 200, "REGRESSION: POST /admin/members returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: POST /admin/members", str(e))
    
    # Test GET /api/dashboard
    try:
        resp = session.get(f"{API_BASE}/dashboard")
        assert_test(resp.status_code == 200, "REGRESSION: GET /dashboard returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: GET /dashboard", str(e))
    
    # Test POST /api/checkout/mock (existing flow)
    try:
        # Create a new user with membership for this test
        unique_email = f"mocktest{int(time.time())}@test.com"
        user_session = requests.Session()
        reg_resp = user_session.post(f"{API_BASE}/auth/register", json={
            "full_name": "Mock Test User",
            "email": unique_email,
            "password": "Test1234",
            "role": "adult"
        })
        if reg_resp.status_code == 200:
            resp = user_session.post(f"{API_BASE}/checkout/mock", json={
                "membership_id": "adult_3m"
            })
            assert_test(resp.status_code == 200, "REGRESSION: POST /checkout/mock returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: POST /checkout/mock", str(e))

def main():
    """Run all tests"""
    log("=" * 80)
    log("FLOWTERNITY SPORTS PLATFORM - ITERATION 4 BACKEND TESTS")
    log(f"Testing against: {API_BASE}")
    log("=" * 80)
    
    try:
        test_trial_endpoints()
        test_register_and_pay()
        test_admin_membership_management()
        test_admin_trial_leads()
        test_pagination()
        test_regression()
    except Exception as e:
        log(f"Fatal error during testing: {e}", "ERROR")
    
    # Print summary
    log("\n" + "=" * 80)
    log("TEST SUMMARY")
    log("=" * 80)
    log(f"Total Tests: {total_tests}")
    log(f"Passed: {passed_tests}")
    log(f"Failed: {len(failed_tests)}")
    
    if failed_tests:
        log("\nFailed Tests:")
        for failure in failed_tests:
            log(f"  ❌ {failure}", "FAIL")
    
    log("=" * 80)
    
    # Exit with appropriate code
    sys.exit(0 if len(failed_tests) == 0 else 1)

if __name__ == "__main__":
    main()
