#!/usr/bin/env python3
"""
Flowternity Backend Test - Iteration 5
Tests Razorpay real checkout, Karate sport, Metrics/Levels, Bulk scheduling
"""

import requests
import json
import hmac
import hashlib
from datetime import datetime, timedelta
import sys
import os

# Load environment variables
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
API_BASE = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@flowternity.com"
ADMIN_PASSWORD = "AdminPass1"
RAZORPAY_KEY_SECRET = "VZ62k8UDDhrU2386MxBMLjUj"

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

def compute_razorpay_signature(order_id, payment_id, secret):
    """Compute HMAC-SHA256 signature for Razorpay verification"""
    message = f"{order_id}|{payment_id}"
    signature = hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature

def test_razorpay_checkout():
    """Test A: Razorpay Real Checkout"""
    log("\n=== TEST A: RAZORPAY REAL CHECKOUT ===")
    
    # A1: Test /checkout/order without auth -> 401
    try:
        resp = requests.post(f"{API_BASE}/checkout/order", json={"membership_id": "adult_3m"})
        assert_test(resp.status_code == 401, "POST /checkout/order without auth returns 401", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /checkout/order without auth", str(e))
    
    # A2: Register a new user for testing
    test_email = f"razorpay_test_{int(datetime.now().timestamp())}@flowternity.com"
    session = requests.Session()
    try:
        resp = session.post(f"{API_BASE}/auth/register", json={
            "full_name": "Razorpay Test User",
            "email": test_email,
            "password": "TestPass123",
            "role": "adult"
        })
        assert_test(resp.status_code == 200, "Register test user for Razorpay", f"Got {resp.status_code}")
        if resp.status_code == 200:
            log(f"Created test user: {test_email}")
    except Exception as e:
        assert_test(False, "Register test user", str(e))
        return
    
    # A3: Test /checkout/order with invalid membership -> 400
    try:
        resp = session.post(f"{API_BASE}/checkout/order", json={"membership_id": "invalid_membership"})
        assert_test(resp.status_code == 400, "POST /checkout/order with invalid membership returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /checkout/order invalid membership", str(e))
    
    # A4: Test /checkout/order with adult_3m -> 200 (real Razorpay order)
    order_id = None
    try:
        resp = session.post(f"{API_BASE}/checkout/order", json={"membership_id": "adult_3m"})
        assert_test(resp.status_code == 200, "POST /checkout/order adult_3m returns 200", f"Got {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            assert_test('order_id' in data, "Response has order_id", f"Got {data.keys()}")
            assert_test(data.get('amount') == 800000, "Amount is 800000 paise (₹8000)", f"Got {data.get('amount')}")
            assert_test(data.get('currency') == 'INR', "Currency is INR", f"Got {data.get('currency')}")
            assert_test(data.get('key_id') == 'rzp_test_TG3JE6R2NsRsfT', "Key ID matches", f"Got {data.get('key_id')}")
            order_id = data.get('order_id')
            log(f"Created Razorpay order: {order_id}")
    except Exception as e:
        assert_test(False, "POST /checkout/order adult_3m", str(e))
    
    # A5: Test /checkout/register-order with new email + adult_3m -> 200
    new_email = f"register_order_{int(datetime.now().timestamp())}@flowternity.com"
    new_order_id = None
    try:
        resp = requests.post(f"{API_BASE}/checkout/register-order", json={
            "full_name": "Register Order Test",
            "email": new_email,
            "password": "TestPass123",
            "phone": "9876543210",
            "role": "adult",
            "membership_id": "adult_3m"
        })
        assert_test(resp.status_code == 200, "POST /checkout/register-order new email returns 200", f"Got {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            assert_test('order_id' in data, "Response has order_id", f"Got {data.keys()}")
            assert_test('user' in data, "Response has user", f"Got {data.keys()}")
            new_order_id = data.get('order_id')
            log(f"Created user + order via register-order: {new_email}, order: {new_order_id}")
    except Exception as e:
        assert_test(False, "POST /checkout/register-order new email", str(e))
    
    # A6: Test /checkout/register-order duplicate email -> 409
    try:
        resp = requests.post(f"{API_BASE}/checkout/register-order", json={
            "full_name": "Duplicate Test",
            "email": new_email,
            "password": "TestPass123",
            "membership_id": "adult_3m"
        })
        assert_test(resp.status_code == 409, "POST /checkout/register-order duplicate email returns 409", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /checkout/register-order duplicate email", str(e))
    
    # A7: Test /checkout/register-order kids without child -> 400
    try:
        resp = requests.post(f"{API_BASE}/checkout/register-order", json={
            "full_name": "Parent Test",
            "email": f"parent_no_child_{int(datetime.now().timestamp())}@flowternity.com",
            "password": "TestPass123",
            "role": "parent",
            "membership_id": "kids_1m"
        })
        assert_test(resp.status_code == 400, "POST /checkout/register-order kids without child returns 400", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /checkout/register-order kids without child", str(e))
    
    # A8: Test /checkout/verify with fake signature -> 400
    if order_id:
        try:
            resp = requests.post(f"{API_BASE}/checkout/verify", json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": "pay_FAKE_PAYMENT",
                "razorpay_signature": "fake_signature_12345"
            })
            assert_test(resp.status_code == 400, "POST /checkout/verify fake signature returns 400", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "POST /checkout/verify fake signature", str(e))
    
    # A9: Test /checkout/verify with VALID signature -> 200
    if order_id:
        try:
            payment_id = "pay_TEST_MOCK_PAYMENT_123"
            valid_signature = compute_razorpay_signature(order_id, payment_id, RAZORPAY_KEY_SECRET)
            log(f"Computed signature: {valid_signature}")
            
            resp = requests.post(f"{API_BASE}/checkout/verify", json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": valid_signature
            })
            assert_test(resp.status_code == 200, "POST /checkout/verify valid signature returns 200", f"Got {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                assert_test(data.get('ok') == True, "Verify response ok=true", f"Got {data}")
                assert_test('payment' in data, "Response has payment", f"Got {data.keys()}")
                assert_test('user_membership' in data, "Response has user_membership", f"Got {data.keys()}")
                if 'payment' in data:
                    assert_test(data['payment'].get('status') == 'success', "Payment status is success", f"Got {data['payment'].get('status')}")
                if 'user_membership' in data:
                    assert_test(data['user_membership'].get('status') == 'active', "Membership status is active", f"Got {data['user_membership'].get('status')}")
        except Exception as e:
            assert_test(False, "POST /checkout/verify valid signature", str(e))
    
    # A10: Test replay same verify -> 200 with already_processed=true
    if order_id:
        try:
            payment_id = "pay_TEST_MOCK_PAYMENT_123"
            valid_signature = compute_razorpay_signature(order_id, payment_id, RAZORPAY_KEY_SECRET)
            
            resp = requests.post(f"{API_BASE}/checkout/verify", json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": valid_signature
            })
            assert_test(resp.status_code == 200, "POST /checkout/verify replay returns 200", f"Got {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                assert_test(data.get('already_processed') == True, "Replay returns already_processed=true", f"Got {data}")
        except Exception as e:
            assert_test(False, "POST /checkout/verify replay", str(e))

def test_karate():
    """Test B: Karate Sport"""
    log("\n=== TEST B: KARATE SPORT ===")
    
    # B1: Test GET /config includes karate with status='active'
    try:
        resp = requests.get(f"{API_BASE}/config")
        assert_test(resp.status_code == 200, "GET /config returns 200", f"Got {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            sports = data.get('sports', [])
            karate = next((s for s in sports if s['id'] == 'karate'), None)
            assert_test(karate is not None, "Config includes karate sport", f"Sports: {[s['id'] for s in sports]}")
            if karate:
                assert_test(karate.get('status') == 'active', "Karate status is active", f"Got {karate.get('status')}")
    except Exception as e:
        assert_test(False, "GET /config karate check", str(e))
    
    # B2: Test GET /trial/classes?sport=karate -> 200
    try:
        resp = requests.get(f"{API_BASE}/trial/classes?sport=karate")
        assert_test(resp.status_code == 200, "GET /trial/classes?sport=karate returns 200", f"Got {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            assert_test('classes' in data, "Response has classes array", f"Got {data.keys()}")
    except Exception as e:
        assert_test(False, "GET /trial/classes?sport=karate", str(e))

def test_metrics_levels():
    """Test C: Metrics + Kids Levels"""
    log("\n=== TEST C: METRICS + KIDS LEVELS ===")
    
    # C1: Test GET /metrics/catalog -> {catalog, levels}
    try:
        resp = requests.get(f"{API_BASE}/metrics/catalog")
        assert_test(resp.status_code == 200, "GET /metrics/catalog returns 200", f"Got {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            assert_test('catalog' in data, "Response has catalog", f"Got {data.keys()}")
            assert_test('levels' in data, "Response has levels", f"Got {data.keys()}")
            if 'levels' in data:
                assert_test(len(data['levels']) == 7, "Levels array has 7 items", f"Got {len(data['levels'])} levels")
    except Exception as e:
        assert_test(False, "GET /metrics/catalog", str(e))
    
    # C2: Test GET /metrics/catalog?sport=basketball
    try:
        resp = requests.get(f"{API_BASE}/metrics/catalog?sport=basketball")
        assert_test(resp.status_code == 200, "GET /metrics/catalog?sport=basketball returns 200", f"Got {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            assert_test(data.get('sport_id') == 'basketball', "Response has sport_id=basketball", f"Got {data.get('sport_id')}")
            assert_test('metrics' in data, "Response has metrics", f"Got {data.keys()}")
            assert_test('levels' in data, "Response has levels", f"Got {data.keys()}")
    except Exception as e:
        assert_test(False, "GET /metrics/catalog?sport=basketball", str(e))
    
    # C3: Test GET /metrics/catalog?sport=futsal -> GENERIC_METRICS
    try:
        resp = requests.get(f"{API_BASE}/metrics/catalog?sport=futsal")
        assert_test(resp.status_code == 200, "GET /metrics/catalog?sport=futsal returns 200", f"Got {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            metrics = data.get('metrics', [])
            # Check for generic metrics like technique, speed, endurance
            metric_keys = [m.get('key') for m in metrics]
            assert_test('technique' in metric_keys, "Futsal has generic metric 'technique'", f"Got {metric_keys}")
    except Exception as e:
        assert_test(False, "GET /metrics/catalog?sport=futsal", str(e))
    
    # Setup: Create admin, adult user, parent with child for performance tests
    admin_session = requests.Session()
    adult_session = requests.Session()
    parent_session = requests.Session()
    
    adult_id = None
    child_id = None
    
    # Login as admin
    try:
        resp = admin_session.post(f"{API_BASE}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if resp.status_code != 200:
            # Try to register admin
            resp = admin_session.post(f"{API_BASE}/auth/register", json={
                "full_name": "Admin User",
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
                "role": "admin"
            })
        assert_test(resp.status_code == 200, "Admin login/register", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Admin login", str(e))
    
    # Create adult user
    adult_email = f"adult_perf_{int(datetime.now().timestamp())}@flowternity.com"
    try:
        resp = adult_session.post(f"{API_BASE}/auth/register", json={
            "full_name": "Adult Performance Test",
            "email": adult_email,
            "password": "TestPass123",
            "role": "adult"
        })
        assert_test(resp.status_code == 200, "Create adult user for performance test", f"Got {resp.status_code}")
        if resp.status_code == 200:
            adult_id = resp.json().get('user', {}).get('id')
            log(f"Created adult user: {adult_email}, ID: {adult_id}")
    except Exception as e:
        assert_test(False, "Create adult user", str(e))
    
    # Create parent with child
    parent_email = f"parent_perf_{int(datetime.now().timestamp())}@flowternity.com"
    try:
        resp = parent_session.post(f"{API_BASE}/auth/register", json={
            "full_name": "Parent Performance Test",
            "email": parent_email,
            "password": "TestPass123",
            "role": "parent"
        })
        assert_test(resp.status_code == 200, "Create parent user for performance test", f"Got {resp.status_code}")
        
        # Create child profile
        if resp.status_code == 200:
            resp = parent_session.post(f"{API_BASE}/children", json={
                "child_name": "Test Child",
                "dob": "2015-05-15",
                "gender": "male",
                "selected_sports": ["basketball", "karate"]
            })
            assert_test(resp.status_code == 200, "Create child profile", f"Got {resp.status_code}")
            if resp.status_code == 200:
                child_id = resp.json().get('child', {}).get('id')
                log(f"Created child: {child_id}")
    except Exception as e:
        assert_test(False, "Create parent with child", str(e))
    
    # C4: Test GET /athletes/:target_id/performance - adult viewing self
    if adult_id:
        try:
            resp = adult_session.get(f"{API_BASE}/athletes/{adult_id}/performance")
            assert_test(resp.status_code == 200, "GET /athletes/:self/performance returns 200", f"Got {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                assert_test('sports' in data, "Response has sports", f"Got {data.keys()}")
                assert_test('levels_catalog' in data, "Response has levels_catalog", f"Got {data.keys()}")
        except Exception as e:
            assert_test(False, "GET /athletes/:self/performance", str(e))
    
    # C5: Test GET /athletes/:child_id/performance - parent viewing own child
    if child_id:
        try:
            resp = parent_session.get(f"{API_BASE}/athletes/{child_id}/performance")
            assert_test(resp.status_code == 200, "GET /athletes/:child/performance (parent) returns 200", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "GET /athletes/:child/performance (parent)", str(e))
    
    # C6: Test GET /athletes/:child_id/performance - adult viewing another's child -> 403
    if child_id:
        try:
            resp = adult_session.get(f"{API_BASE}/athletes/{child_id}/performance")
            assert_test(resp.status_code == 403, "GET /athletes/:other_child/performance returns 403", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "GET /athletes/:other_child/performance", str(e))
    
    # C7: Test GET /athletes/:target_id/performance - admin viewing anyone
    if adult_id:
        try:
            resp = admin_session.get(f"{API_BASE}/athletes/{adult_id}/performance")
            assert_test(resp.status_code == 200, "GET /athletes/:any/performance (admin) returns 200", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "GET /athletes/:any/performance (admin)", str(e))
    
    # C8: Test PATCH /admin/athletes/:target_id/metrics - admin only
    if adult_id:
        try:
            resp = admin_session.patch(f"{API_BASE}/admin/athletes/{adult_id}/metrics", json={
                "sport_id": "basketball",
                "scores": {
                    "dribbling_control": 8.5,
                    "layups_left": 7.0,
                    "free_throw_pct": 9.2,
                    "unknown_metric": 5.0  # Should be silently dropped
                }
            })
            assert_test(resp.status_code == 200, "PATCH /admin/athletes/:id/metrics returns 200", f"Got {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                assert_test(data.get('ok') == True, "Response ok=true", f"Got {data}")
                scores = data.get('scores', {})
                assert_test('dribbling_control' in scores, "Scores include dribbling_control", f"Got {scores}")
                assert_test('unknown_metric' not in scores, "Unknown metric silently dropped", f"Got {scores}")
                # Check clamping (values should be 0-10)
                assert_test(all(0 <= v <= 10 for v in scores.values()), "All scores clamped to 0-10", f"Got {scores}")
        except Exception as e:
            assert_test(False, "PATCH /admin/athletes/:id/metrics", str(e))
    
    # C9: Test PATCH /admin/athletes/:target_id/metrics - non-admin -> 403
    if adult_id:
        try:
            resp = adult_session.patch(f"{API_BASE}/admin/athletes/{adult_id}/metrics", json={
                "sport_id": "basketball",
                "scores": {"dribbling_control": 8.0}
            })
            assert_test(resp.status_code == 403, "PATCH /admin/athletes/:id/metrics (non-admin) returns 403", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "PATCH /admin/athletes/:id/metrics (non-admin)", str(e))
    
    # C10: Test PATCH /admin/athletes/:target_id/level - admin only
    if child_id:
        try:
            resp = admin_session.patch(f"{API_BASE}/admin/athletes/{child_id}/level", json={
                "sport_id": "basketball",
                "level": 3
            })
            assert_test(resp.status_code == 200, "PATCH /admin/athletes/:id/level returns 200", f"Got {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                assert_test(data.get('level') == 3, "Level set to 3", f"Got {data.get('level')}")
                assert_test('level_info' in data, "Response has level_info", f"Got {data.keys()}")
                if 'level_info' in data:
                    assert_test(data['level_info'].get('name') == 'RHYTHM', "Level 3 is RHYTHM", f"Got {data['level_info']}")
        except Exception as e:
            assert_test(False, "PATCH /admin/athletes/:id/level", str(e))
    
    # C11: Test PATCH /admin/athletes/:target_id/level - invalid level -> 400
    if child_id:
        try:
            resp = admin_session.patch(f"{API_BASE}/admin/athletes/{child_id}/level", json={
                "sport_id": "basketball",
                "level": 8  # Invalid (must be 1-7)
            })
            assert_test(resp.status_code == 400, "PATCH /admin/athletes/:id/level invalid level returns 400", f"Got {resp.status_code}")
        except Exception as e:
            assert_test(False, "PATCH /admin/athletes/:id/level invalid", str(e))
    
    # C12: Test GET /admin/athletes/:target_id/performance - admin view with enrolled sports
    if adult_id:
        try:
            resp = admin_session.get(f"{API_BASE}/admin/athletes/{adult_id}/performance")
            assert_test(resp.status_code == 200, "GET /admin/athletes/:id/performance returns 200", f"Got {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                assert_test('subject' in data, "Response has subject", f"Got {data.keys()}")
                assert_test('sports' in data, "Response has sports", f"Got {data.keys()}")
        except Exception as e:
            assert_test(False, "GET /admin/athletes/:id/performance", str(e))

def test_bulk_scheduling():
    """Test D: Bulk Class/Game Scheduling"""
    log("\n=== TEST D: BULK CLASS/GAME SCHEDULING ===")
    
    # Login as admin
    admin_session = requests.Session()
    try:
        resp = admin_session.post(f"{API_BASE}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert_test(resp.status_code == 200, "Admin login for bulk scheduling", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "Admin login", str(e))
        return
    
    # D1: Test POST /admin/classes/bulk - non-admin -> 403
    try:
        non_admin_session = requests.Session()
        resp = non_admin_session.post(f"{API_BASE}/admin/classes/bulk", json={
            "sport_id": "basketball",
            "coach_name": "Coach Test",
            "capacity": 20,
            "start_date": "2025-01-20",
            "end_date": "2025-01-24",
            "weekdays": [1, 3, 5],
            "slots": [{"start_time": "10:00", "end_time": "11:00"}]
        })
        assert_test(resp.status_code == 403, "POST /admin/classes/bulk (non-admin) returns 403", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "POST /admin/classes/bulk (non-admin)", str(e))
    
    # D2: Test POST /admin/classes/bulk - valid request
    created_class_ids = []
    try:
        start_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=21)).strftime("%Y-%m-%d")
        
        resp = admin_session.post(f"{API_BASE}/admin/classes/bulk", json={
            "sport_id": "basketball",
            "coach_name": "Coach Bulk Test",
            "capacity": 20,
            "start_date": start_date,
            "end_date": end_date,
            "weekdays": [1, 3, 5],  # Mon, Wed, Fri
            "slots": [
                {"start_time": "10:00", "end_time": "11:00"},
                {"start_time": "16:00", "end_time": "17:00"}
            ]
        })
        assert_test(resp.status_code == 200, "POST /admin/classes/bulk returns 200", f"Got {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            assert_test(data.get('ok') == True, "Response ok=true", f"Got {data}")
            assert_test('count' in data, "Response has count", f"Got {data.keys()}")
            assert_test('classes' in data, "Response has classes array", f"Got {data.keys()}")
            count = data.get('count', 0)
            # 2 weeks, 3 days per week, 2 slots = 6 * 2 = 12 classes (approximately)
            assert_test(count > 0, f"Created {count} classes", f"Got {count}")
            if 'classes' in data:
                created_class_ids = [c['id'] for c in data['classes']]
                log(f"Created {len(created_class_ids)} classes via bulk")
    except Exception as e:
        assert_test(False, "POST /admin/classes/bulk", str(e))
    
    # D3: Test POST /admin/classes/bulk-rows - mixed valid/invalid
    try:
        future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        resp = admin_session.post(f"{API_BASE}/admin/classes/bulk-rows", json={
            "rows": [
                {
                    "sport_id": "basketball",
                    "coach_name": "Coach Row 1",
                    "date": future_date,
                    "start_time": "09:00",
                    "end_time": "10:00",
                    "capacity": 15
                },
                {
                    "sport_id": "invalid_sport",  # Invalid
                    "date": future_date,
                    "start_time": "10:00",
                    "end_time": "11:00",
                    "capacity": 15
                },
                {
                    "sport_id": "futsal",
                    "coach_name": "Coach Row 3",
                    "date": future_date,
                    "start_time": "11:00",
                    "end_time": "12:00",
                    "capacity": 20
                }
            ]
        })
        assert_test(resp.status_code == 200, "POST /admin/classes/bulk-rows returns 200", f"Got {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            assert_test(data.get('imported') == 2, "Imported 2 valid rows", f"Got {data.get('imported')}")
            assert_test(len(data.get('errors', [])) == 1, "1 error for invalid row", f"Got {data.get('errors')}")
    except Exception as e:
        assert_test(False, "POST /admin/classes/bulk-rows", str(e))
    
    # D4: Test PATCH /admin/classes/bulk-update
    if created_class_ids:
        try:
            # Update first 2 classes
            ids_to_update = created_class_ids[:2]
            resp = admin_session.patch(f"{API_BASE}/admin/classes/bulk-update", json={
                "ids": ids_to_update,
                "updates": {
                    "coach_name": "Coach Updated",
                    "capacity": 25
                }
            })
            assert_test(resp.status_code == 200, "PATCH /admin/classes/bulk-update returns 200", f"Got {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                assert_test(data.get('modified') >= 1, "Modified at least 1 class", f"Got {data.get('modified')}")
        except Exception as e:
            assert_test(False, "PATCH /admin/classes/bulk-update", str(e))
    
    # D5: Test POST /admin/classes/bulk-delete
    if created_class_ids:
        try:
            # Delete all created classes
            resp = admin_session.post(f"{API_BASE}/admin/classes/bulk-delete", json={
                "ids": created_class_ids
            })
            assert_test(resp.status_code == 200, "POST /admin/classes/bulk-delete returns 200", f"Got {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                assert_test(data.get('deleted') == len(created_class_ids), f"Deleted {len(created_class_ids)} classes", f"Got {data.get('deleted')}")
        except Exception as e:
            assert_test(False, "POST /admin/classes/bulk-delete", str(e))
    
    # D6: Test POST /admin/games/bulk
    try:
        start_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        
        resp = admin_session.post(f"{API_BASE}/admin/games/bulk", json={
            "sport_id": "futsal",
            "host_name": "Host Bulk Test",
            "max_players": 10,
            "skill_level": "intermediate",
            "title": "Futsal Pickup Game",
            "description": "Weekly futsal game",
            "start_date": start_date,
            "end_date": end_date,
            "weekdays": [6],  # Saturday
            "slots": [{"start_time": "18:00", "end_time": "19:30"}]
        })
        assert_test(resp.status_code == 200, "POST /admin/games/bulk returns 200", f"Got {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            assert_test(data.get('ok') == True, "Response ok=true", f"Got {data}")
            assert_test('count' in data, "Response has count", f"Got {data.keys()}")
            log(f"Created {data.get('count')} games via bulk")
    except Exception as e:
        assert_test(False, "POST /admin/games/bulk", str(e))

def test_regression():
    """Test E: Regression - Quick check of existing endpoints"""
    log("\n=== TEST E: REGRESSION ===")
    
    # E1: GET /config
    try:
        resp = requests.get(f"{API_BASE}/config")
        assert_test(resp.status_code == 200, "REGRESSION: GET /config returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: GET /config", str(e))
    
    # E2: POST /auth/login
    session = requests.Session()
    try:
        resp = session.post(f"{API_BASE}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert_test(resp.status_code == 200, "REGRESSION: POST /auth/login returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: POST /auth/login", str(e))
    
    # E3: GET /dashboard (auth required)
    try:
        resp = session.get(f"{API_BASE}/dashboard")
        assert_test(resp.status_code == 200, "REGRESSION: GET /dashboard returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: GET /dashboard", str(e))
    
    # E4: GET /admin/classes
    try:
        resp = session.get(f"{API_BASE}/admin/classes")
        assert_test(resp.status_code == 200, "REGRESSION: GET /admin/classes returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: GET /admin/classes", str(e))
    
    # E5: GET /admin/stats
    try:
        resp = session.get(f"{API_BASE}/admin/stats")
        assert_test(resp.status_code == 200, "REGRESSION: GET /admin/stats returns 200", f"Got {resp.status_code}")
    except Exception as e:
        assert_test(False, "REGRESSION: GET /admin/stats", str(e))

def main():
    """Run all tests"""
    log("=" * 80)
    log("FLOWTERNITY BACKEND TEST - ITERATION 5")
    log("Testing: Razorpay, Karate, Metrics/Levels, Bulk Scheduling")
    log("=" * 80)
    
    test_razorpay_checkout()
    test_karate()
    test_metrics_levels()
    test_bulk_scheduling()
    test_regression()
    
    # Summary
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
    
    success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    log(f"\nSuccess Rate: {success_rate:.1f}%")
    
    if len(failed_tests) == 0:
        log("\n🎉 ALL TESTS PASSED!", "SUCCESS")
        sys.exit(0)
    else:
        log(f"\n⚠️  {len(failed_tests)} TEST(S) FAILED", "FAIL")
        sys.exit(1)

if __name__ == "__main__":
    main()
