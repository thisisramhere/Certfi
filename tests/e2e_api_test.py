#!/usr/bin/env python3
"""CertiFlow End-to-End API Test Script"""

import urllib.request
import json
import sys
import io
import os

BASE = 'http://localhost:8000/api/v1'
RESULTS = []
BUGS = []


def api_call(method, path, data=None, token=None, raw=False):
    url = BASE + path
    headers = {}
    if data:
        headers['Content-Type'] = 'application/json'
    if token:
        headers['Authorization'] = f'Bearer {token}'
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        if raw:
            return resp.status, resp.read()
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode())
        except Exception:
            err_body = {'detail': str(e)}
        return e.code, err_body


def api_call_multipart(method, path, fields, files, token=None):
    """Send multipart form data using stdlib only."""
    import mimetypes
    boundary = '----TestBoundary12345'
    body = io.BytesIO()

    for key, value in fields.items():
        body.write(f'--{boundary}\r\n'.encode())
        body.write(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode())
        body.write(f'{value}\r\n'.encode())

    for key, (filename, filedata, content_type) in files.items():
        body.write(f'--{boundary}\r\n'.encode())
        body.write(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"\r\n'.encode())
        body.write(f'Content-Type: {content_type}\r\n\r\n'.encode())
        body.write(filedata)
        body.write(b'\r\n')

    body.write(f'--{boundary}--\r\n'.encode())
    body.seek(0)

    url = BASE + path
    headers = {
        'Content-Type': f'multipart/form-data; boundary={boundary}',
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'

    req = urllib.request.Request(url, data=body.read(), headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode())
        except Exception:
            err_body = {'detail': str(e)}
        return e.code, err_body


def log(phase, step, status, detail=''):
    icon = 'PASS' if status else 'FAIL'
    line = f'  [{icon}] {step}'
    if detail:
        line += f' -> {detail}'
    print(line)
    RESULTS.append((phase, step, status, detail))
    if not status:
        BUGS.append(f'{phase}: {step} - {detail}')


def test_auth():
    phase = 'Phase 3: Authentication'
    print(f'\n=== {phase} ===')

    # Register
    code, body = api_call('POST', '/auth/register', {
        'email': 'e2e@certfi.com',
        'password': 'SecurePass123!',
        'full_name': 'E2E Test User',
        'role': 'admin'
    })
    log(phase, 'Register user', code in [201, 409], f'{code}')

    # Login
    code, body = api_call('POST', '/auth/login', {
        'email': 'e2e@certfi.com',
        'password': 'SecurePass123!'
    })
    token = None
    refresh_token = None
    if code == 200 and 'token_pair' in body:
        token = body['token_pair']['access_token']
        refresh_token = body['token_pair']['refresh_token']
        log(phase, 'Login', True, f'user={body["user"]["email"]}')
    else:
        log(phase, 'Login', False, f'{code}: {body}')
        return None, None

    # Get current user
    code, body = api_call('GET', '/auth/me', token=token)
    log(phase, 'Get current user', code == 200 and body.get('email') == 'e2e@certfi.com', f'{code}')

    # Refresh token
    code, body = api_call('POST', '/auth/refresh', {'refresh_token': refresh_token})
    log(phase, 'Refresh token', code == 200 and 'access_token' in body, f'{code}')

    # Invalid login
    code, body = api_call('POST', '/auth/login', {
        'email': 'e2e@certfi.com',
        'password': 'wrongpassword'
    })
    log(phase, 'Invalid password rejected', code == 401, f'{code}')

    # Unauthorized access
    code, body = api_call('GET', '/auth/me', token='invalidtoken')
    log(phase, 'Unauthorized access rejected', code == 401, f'{code}')

    # Logout
    code, body = api_call('POST', '/auth/logout', token=token)
    log(phase, 'Logout', code == 200, f'{code}')

    return token, refresh_token


def test_organization(token):
    phase = 'Phase 5: Organization'
    print(f'\n=== {phase} ===')

    # Create organization
    code, body = api_call('POST', '/organizations/', {
        'name': 'E2E Test Org',
        'description': 'Organization created during E2E testing'
    }, token=token)
    org_id = None
    if code in [200, 201]:
        org_id = body.get('id') or (body.get('organization', {}) if isinstance(body.get('organization'), dict) else {}).get('id')
        log(phase, 'Create organization', True, f'{code}: org_id={org_id}')
    elif code == 409:
        # Already exists - try to get the user's org_id from the user record
        _, me_body = api_call('GET', '/auth/me', token=token)
        org_id = me_body.get('organization_id')
        log(phase, 'Create organization (already exists)', True, f'{code}: org_id={org_id}')
    else:
        log(phase, 'Create organization', False, f'{code}: {body}')

    # Get organization
    if org_id:
        code, body = api_call('GET', f'/organizations/{org_id}', token=token)
        log(phase, 'Get organization', code == 200, f'{code}')
    else:
        log(phase, 'Get organization', False, 'No org_id')

    # Update organization
    if org_id:
        code, body = api_call('PUT', f'/organizations/{org_id}', {
            'name': 'E2E Test Org Updated',
            'description': 'Updated during testing'
        }, token=token)
        log(phase, 'Update organization', code == 200, f'{code}')

    return org_id


def test_templates(token):
    phase = 'Phase 6: Templates'
    print(f'\n=== {phase} ===')

    # Create template via multipart
    png_data = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100  # Minimal PNG header
    code, body = api_call_multipart('POST', '/templates/', {
        'name': 'E2E Test Template',
        'description': 'Created during E2E testing',
        'file_type': 'png',
        'width': '1200',
        'height': '850',
        'dpi': '300',
        'background_color': '#FFFFFF'
    }, {
        'file': ('test_template.png', png_data, 'image/png')
    }, token=token)
    template_id = body.get('id')
    log(phase, 'Create template', code in [200, 201], f'{code}: id={template_id}')

    # List templates
    code, body = api_call('GET', '/templates/', token=token)
    tpl_list = body if isinstance(body, list) else []
    log(phase, 'List templates', code == 200, f'{code}: count={len(tpl_list)}')

    # Get template by ID
    if template_id:
        code, body = api_call('GET', f'/templates/{template_id}', token=token)
        log(phase, 'Get template by ID', code == 200, f'{code}')

        # Update template
        code, body = api_call('PUT', f'/templates/{template_id}', {
            'name': 'E2E Test Template Updated'
        }, token=token)
        log(phase, 'Update template', code == 200, f'{code}')

        # Get placeholders
        code, body = api_call('GET', f'/templates/{template_id}/placeholders', token=token)
        placeholders = body if isinstance(body, list) else []
        log(phase, 'Get placeholders', code == 200, f'{code}: count={len(placeholders)}')

        # Add placeholder
        code, body = api_call('POST', f'/templates/{template_id}/placeholders', {
            'type': 'name',
            'x': 100,
            'y': 200,
            'width': 400,
            'height': 50,
            'font_family': 'Helvetica',
            'font_size': 24,
            'font_weight': 'bold',
            'font_color': '#000000',
            'alignment': 'center',
            'rotation': 0,
            'opacity': 1.0,
            'is_required': True
        }, token=token)
        placeholder_id = body.get('id')
        log(phase, 'Add placeholder', code in [200, 201], f'{code}: id={placeholder_id}')

        # Update placeholder
        if placeholder_id:
            code, body = api_call('PUT', f'/templates/{template_id}/placeholders/{placeholder_id}', {
                'font_size': 32
            }, token=token)
            log(phase, 'Update placeholder', code == 200, f'{code}')
    else:
        log(phase, 'Template CRUD', False, 'No template_id')

    return template_id


def test_participants(token):
    phase = 'Phase 8: Participants'
    print(f'\n=== {phase} ===')

    # Import via CSV with unique timestamp-based emails
    import time
    ts = int(time.time())
    csv_content = f'name,email,event,position\nAlice Johnson,alice-{ts}@e2e-test.com,Annual Conference,Speaker\nBob Smith,bob-{ts}@e2e-test.com,Annual Conference,Attendee\nCarol White,carol-{ts}@e2e-test.com,Hackathon,Winner'.encode()
    code, body = api_call_multipart('POST', '/participants/import', {}, {
        'file': ('participants.csv', csv_content, 'text/csv')
    }, token=token)
    log(phase, 'Import CSV', code in [200, 201], f'{code}: created={body.get("created", "?")}')

    # List participants
    code, body = api_call('GET', '/participants/', token=token)
    p_list = body if isinstance(body, list) else []
    log(phase, 'List participants', code == 200, f'{code}: count={len(p_list)}')

    # Search participants
    code, body = api_call('GET', '/participants/?search=alice', token=token)
    log(phase, 'Search participants', code == 200, f'{code}')

    # Delete participant
    if p_list:
        pid = p_list[0].get('id')
        if pid:
            code, body = api_call('DELETE', f'/participants/{pid}', token=token)
            log(phase, 'Delete participant', code in [200, 204], f'{code}')

    # Re-list to get fresh participant IDs
    code, body = api_call('GET', '/participants/', token=token)
    return body if isinstance(body, list) else []


def test_certificates(token, template_id, participants):
    phase = 'Phase 9: Certificate Generation'
    print(f'\n=== {phase} ===')

    if not template_id:
        log(phase, 'Generate certificate', False, 'No template_id')
        return []

    if not participants:
        log(phase, 'Generate certificate', False, 'No participants')
        return []

    # Generate single certificate
    code, body = api_call('POST', '/certificates/generate', [{
        'participant_id': participants[0]['id'],
        'template_id': template_id,
        'participant_name': participants[0].get('name', 'Test'),
        'participant_email': participants[0].get('email', 'test@e2e.com'),
        'participant_event': participants[0].get('event', 'Conference'),
        'template_name': 'E2E Test Template'
    }], token=token)
    log(phase, 'Generate single certificate', code in [200, 201], f'{code}')

    # List certificates
    code, body = api_call('GET', '/certificates/', token=token)
    cert_list = body if isinstance(body, list) else []
    log(phase, 'List certificates', code == 200, f'{code}: count={len(cert_list)}')

    # Bulk generate remaining
    if len(participants) > 1:
        certs_data = [{
            'participant_id': p['id'],
            'template_id': template_id,
            'participant_name': p.get('name', 'Test'),
            'participant_email': p.get('email', 'test@e2e.com'),
            'participant_event': p.get('event', 'Conference'),
            'template_name': 'E2E Test Template'
        } for p in participants[1:]]
        code, body = api_call('POST', '/certificates/generate', certs_data, token=token)
        log(phase, 'Bulk generate certificates', code in [200, 201], f'{code}: count={len(certs_data)}')

    # Re-fetch certificates after generation
    code, body = api_call('GET', '/certificates/', token=token)
    cert_list = body if isinstance(body, list) else []
    log(phase, 'Re-list certificates after generate', code == 200, f'{code}: count={len(cert_list)}')

    # Get certificate by ID
    if cert_list:
        cid = cert_list[0].get('certificate_id')
        if cid:
            code, body = api_call('GET', f'/certificates/{cid}', token=token)
            log(phase, 'Get certificate by ID', code == 200, f'{code}')

    return cert_list


def test_verification(token, cert_list):
    phase = 'Phase 10: Verification'
    print(f'\n=== {phase} ===')

    if not cert_list:
        log(phase, 'Verify certificate', False, 'No certificates to verify')
        return

    # Verify a recently generated certificate (find one with status=generated)
    generated = [c for c in cert_list if c.get('status') == 'generated']
    verify_target = generated[-1] if generated else cert_list[-1]
    cid = verify_target.get('certificate_id')
    if cid:
        code, body = api_call('GET', f'/verify/{cid}', token=token)
        log(phase, f'Verify certificate ({cid})', code == 200, f'{code}: status={body.get("status", "?")}')

    # Verify invalid certificate
    code, body = api_call('GET', '/verify/CERT-INVALID-000000')
    log(phase, 'Verify invalid certificate', code in [404, 400, 200], f'{code}')

    # Verification stats
    code, body = api_call('GET', '/verify/stats', token=token)
    log(phase, 'Get verification stats', code == 200, f'{code}')


def test_analytics(token):
    phase = 'Phase 11: Analytics'
    print(f'\n=== {phase} ===')

    # Get analytics
    code, body = api_call('GET', '/analytics/?period=daily', token=token)
    log(phase, 'Get daily analytics', code == 200, f'{code}: type={type(body).__name__}')

    # Get summary
    code, body = api_call('GET', '/analytics/summary', token=token)
    log(phase, 'Get analytics summary', code == 200, f'{code}')


def test_error_handling(token):
    phase = 'Phase 13: Error Handling'
    print(f'\n=== {phase} ===')

    # 404 - nonexistent resource
    code, body = api_call('GET', '/templates/00000000-0000-0000-0000-000000000000', token=token)
    log(phase, '404 for nonexistent template', code == 404, f'{code}')

    # 401 - no token on protected route
    code, body = api_call('GET', '/templates/')
    log(phase, '401/403 for unauthenticated request', code in [401, 403], f'{code}')

    # 422 - invalid data
    code, body = api_call('POST', '/auth/register', {
        'email': 'not-an-email',
        'password': 'short'
    })
    log(phase, '422 for invalid registration data', code in [422, 400, 409], f'{code}')

    # 401 - invalid token
    code, body = api_call('GET', '/templates/', token='garbage-token')
    log(phase, '401 for invalid token', code == 401, f'{code}')

    # 404 - verify nonexistent certificate
    code, body = api_call('GET', '/verify/CERT-INVALID-000000')
    log(phase, '404 for invalid certificate', code in [404, 400], f'{code}')


def test_users(token):
    phase = 'User Management'
    print(f'\n=== {phase} ===')

    # List users
    code, body = api_call('GET', '/users/', token=token)
    log(phase, 'List users', code == 200, f'{code}')

    # Register another user
    code, body = api_call('POST', '/auth/register', {
        'email': 'staff@certfi.com',
        'password': 'StaffPass123!',
        'full_name': 'Staff User',
        'role': 'staff'
    })
    log(phase, 'Register staff user', code in [201, 409], f'{code}')


def test_cleanup(token):
    phase = 'Cleanup'
    print(f'\n=== {phase} ===')

    # Delete template
    code, body = api_call('GET', '/templates/', token=token)
    if isinstance(body, list):
        for tpl in body:
            tid = tpl.get('id')
            if tid:
                code2, _ = api_call('DELETE', f'/templates/{tid}', token=token)
                log(phase, f'Delete template {tid[:8]}...', code2 in [200, 204, 409], f'{code2}')


def main():
    print('=' * 60)
    print('  CertiFlow End-to-End API Test Suite')
    print('=' * 60)

    # Test health
    try:
        import urllib.request as urllib_request
        r = urllib_request.urlopen('http://localhost:8000/health', timeout=5)
        health_status = r.status
        health_body = json.loads(r.read().decode())
    except Exception as e:
        health_status = 0
        health_body = {'error': str(e)}

    if health_status != 200:
        print(f'FATAL: Backend not responding at /health ({health_status})')
        sys.exit(1)
    print(f'\n  Backend healthy: {health_body}')

    # Run all tests
    token, refresh_token = test_auth()
    if not token:
        print('\nFATAL: Authentication failed, cannot continue')
        sys.exit(1)

    org_id = test_organization(token)
    template_id = test_templates(token)
    participants = test_participants(token)
    cert_list = test_certificates(token, template_id, participants)
    test_verification(token, cert_list)
    test_analytics(token)
    test_error_handling(token)
    test_users(token)
    test_cleanup(token)

    # Summary
    print('\n' + '=' * 60)
    print('  TEST SUMMARY')
    print('=' * 60)
    passed = sum(1 for _, _, s, _ in RESULTS if s)
    failed = sum(1 for _, _, s, _ in RESULTS if not s)
    total = len(RESULTS)
    print(f'  Total: {total} | Passed: {passed} | Failed: {failed}')

    if BUGS:
        print(f'\n  BUGS FOUND ({len(BUGS)}):')
        for bug in BUGS:
            print(f'    - {bug}')
    else:
        print('\n  NO BUGS FOUND')

    print('=' * 60)
    return 1 if BUGS else 0


if __name__ == '__main__':
    sys.exit(main())
