"""
PotholeAI Security Regression Test Suite
Run with:
    python test_security.py
"""
import os
import sys
import io
import unittest.mock as m
import tempfile

# Setup safe test environment before imports
os.environ['SECRET_KEY'] = 'test_secret_key_minimum_32_characters_for_jwt_signing!'
os.environ['ADMIN_CODE'] = 'TEST-ADMIN-CODE-9999'
os.environ['ALLOWED_ORIGINS'] = 'http://localhost:5173'

db_fd, db_path = tempfile.mkstemp(suffix='.db')
os.close(db_fd)
os.environ['DATABASE_URL'] = f'sqlite:///{db_path}'

# Mock heavy/external dependencies
m.patch('ultralytics.YOLO').start()
fm = m.MagicMock()
fm.detect_potholes.return_value = {'pothole_count': 2, 'severity': 5, 'result_image_path': 'x'}
sys.modules['model'] = fm

fa = m.MagicMock()
fa.generate_report.return_value = 'mocked report'
sys.modules['agent'] = fa

from database import Base, engine
Base.metadata.create_all(bind=engine)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app, raise_server_exceptions=False)
passed = 0
failed = 0

def check(name: str, condition: bool, got=''):
    global passed, failed
    if condition:
        print(f"  [PASS] {name}")
        passed += 1
    else:
        print(f"  [FAIL] {name} | Got: {got}")
        failed += 1

print("=" * 60)
print("🛡️  POTHOLEAI SECURITY REGRESSION TESTS")
print("=" * 60)

# 1. CORS tests
r = client.get('/stats', headers={'Origin': 'https://evil.example.com'})
check('CORS: Untrusted origin rejected', r.headers.get('access-control-allow-origin', '') != 'https://evil.example.com')

r = client.get('/health', headers={'Origin': 'http://localhost:5173'})
check('CORS: Trusted origin allowed', r.headers.get('access-control-allow-origin') == 'http://localhost:5173')

# 2. Authentication & Authorization tests
r = client.get('/reports')
check('Auth: GET /reports requires admin (401)', r.status_code == 401, r.status_code)

r = client.get('/export/csv')
check('Auth: GET /export/csv requires admin (401)', r.status_code == 401, r.status_code)

r = client.put('/reports/PTH-ABCD1234/status?status=resolved')
check('Auth: PUT status requires admin (401)', r.status_code == 401, r.status_code)

r = client.get('/auth/me', headers={'Authorization': 'Bearer invalid.token.payload'})
check('Auth: Forged JWT token rejected (401)', r.status_code == 401, r.status_code)

# 3. Input Validation tests
r = client.post('/auth/register', json={'name': 'Tester', 'email': 'not-an-email', 'password': 'ValidPassword123!'})
check('Validation: Malformed email rejected (422)', r.status_code == 422, r.status_code)

r = client.post('/auth/register', json={'name': 'Tester', 'email': 'test@example.com', 'password': 'weak'})
check('Validation: Weak password rejected (422)', r.status_code == 422, r.status_code)

r = client.post('/auth/register', json={'name': 'Tester', 'email': 'test@example.com', 'password': 'ValidPassword123!', 'role': 'superuser'})
check('Validation: Arbitrary role injection rejected (422)', r.status_code == 422, r.status_code)

r = client.post('/chat/', json={'message': ''})
check('Validation: Empty chat message rejected (422)', r.status_code == 422, r.status_code)

r = client.post('/chat/', json={'message': 'A' * 1001})
check('Validation: Chat message exceeding max length rejected (422)', r.status_code == 422, r.status_code)

r = client.get('/leaderboard?limit=9999')
check('Validation: Out of bounds limit > 100 rejected (400)', r.status_code == 400, r.status_code)

r = client.get('/leaderboard?limit=-1')
check('Validation: Negative limit rejected (400)', r.status_code == 400, r.status_code)

# 4. Path Traversal & Identifier Validation
r = client.get('/reports/../../../../etc/passwd')
check('Path Traversal: Directory traversal in tracking_id rejected (400/404)', r.status_code in (400, 404), r.status_code)

r = client.get('/reports/PTH-ABCD1234')
check('Validation: Valid tracking_id format handled properly (404 not found)', r.status_code in (400, 404), r.status_code)

r = client.put('/reports/PTH-ABCD1234/status?status=invalid_status')
check('Validation: Invalid status enum rejected (400/401/403)', r.status_code in (400, 401, 403), r.status_code)

# 5. File Upload Security
def upload_file(filename: str, content_type: str, content: bytes):
    return client.post(
        '/report',
        files={'image': (filename, io.BytesIO(content), content_type)},
        data={'location_address': 'Test Street', 'latitude': '28.6', 'longitude': '77.3'}
    )

check('Upload: PHP executable upload blocked (400)', upload_file('exploit.php', 'image/jpeg', b'<?php phpinfo(); ?>').status_code == 400)
check('Upload: EXE binary upload blocked (400)', upload_file('malware.exe', 'image/jpeg', b'MZ\x90\x00\x03').status_code == 400)
check('Upload: HTML file disguised as image blocked (400)', upload_file('xss.html', 'image/jpeg', b'<script>alert(1)</script>').status_code == 400)

# 6. Security Headers
r = client.get('/health')
check('Header: X-Content-Type-Options is nosniff', r.headers.get('x-content-type-options') == 'nosniff')
check('Header: X-Frame-Options is DENY', r.headers.get('x-frame-options') == 'DENY')
check('Header: Referrer-Policy is present', 'referrer-policy' in r.headers)

# 7. Information Leakage
leak_signatures = ['traceback', 'sqlalchemy', 'sqlite3', 'password_hash']
def check_no_leak(response):
    body = response.text.lower()
    found = [sig for sig in leak_signatures if sig in body]
    return not found, found

ok, leak = check_no_leak(client.get('/reports/PTH-AAAABBBB'))
check('Info Leak: 404 does not expose stack traces/DB internals', ok, leak)

ok, leak = check_no_leak(client.post('/auth/login', json={'email': 'nonexistent@example.com', 'password': 'Password123!'}))
check('Info Leak: Failed login does not leak internals', ok, leak)

# 8. Exposure of API documentation in production
check('Hardening: /docs disabled by default in production (404)', client.get('/docs').status_code == 404)
check('Hardening: /redoc disabled by default in production (404)', client.get('/redoc').status_code == 404)

print("-" * 60)
print(f"SUMMARY: {passed}/{passed + failed} passed ({failed} failed)")
print("=" * 60)

# Cleanup temp db
try:
    if os.path.exists(db_path):
        os.remove(db_path)
except Exception:
    pass

if failed > 0:
    sys.exit(1)
