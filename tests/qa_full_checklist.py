#!/usr/bin/env python3
"""Full Manual QA Checklist - simulates every user action via API."""

import urllib.request
import json
import sys
import io
import struct
import zlib
import time

BASE = 'http://localhost:8000/api/v1'
FRONTEND = 'http://localhost:3000'
RESULTS = []
BUGS = []
ts = int(time.time())


def api(method, path, data=None, token=None):
    url = BASE + path
    headers = {}
    if data is not None and isinstance(data, (dict, list)):
        headers['Content-Type'] = 'application/json'
    if token:
        headers['Authorization'] = f'Bearer {token}'
    body = json.dumps(data).encode() if isinstance(data, (dict, list)) else data
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {'detail': str(e)}


def api_raw(method, path, token=None):
    url = BASE + path
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        ct = resp.headers.get('Content-Type', '')
        return resp.status, resp.read(), ct
    except urllib.error.HTTPError as e:
        ct = e.headers.get('Content-Type', '') if e.headers else ''
        try:
            return e.code, e.read(), ct
        except Exception:
            return e.code, b'', ct


def multipart(path, fields, files, token=None):
    boundary = '----QABoundary' + str(ts)
    body = io.BytesIO()
    for k, v in fields.items():
        body.write(f'--{boundary}\r\n'.encode())
        body.write(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
        body.write(f'{v}\r\n'.encode())
    for k, (fn, fdata, ct) in files.items():
        body.write(f'--{boundary}\r\n'.encode())
        body.write(f'Content-Disposition: form-data; name="{k}"; filename="{fn}"\r\n'.encode())
        body.write(f'Content-Type: {ct}\r\n\r\n'.encode())
        body.write(fdata)
        body.write(b'\r\n')
    body.write(f'--{boundary}--\r\n'.encode())
    body.seek(0)
    url = BASE + path
    headers = {'Content-Type': f'multipart/form-data; boundary={boundary}'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=body.read(), headers=headers, method='POST')
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {'detail': str(e)}


def check(phase, step, condition, detail=''):
    status = bool(condition)
    icon = 'PASS' if status else 'FAIL'
    line = f'  [{icon}] {step}'
    if detail:
        line += f' -> {detail}'
    print(line)
    RESULTS.append((phase, step, status, detail))
    if not status:
        BUGS.append(f'{phase}: {step} - {detail}')


def make_png():
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', 100, 75, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc & 0xffffffff)
    raw = b''
    for _ in range(75):
        raw += b'\x00' + b'\xff\x00\x00' * 100
    compressed = zlib.compress(raw)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc & 0xffffffff)
    iend_crc = zlib.crc32(b'IEND')
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc & 0xffffffff)
    return sig + ihdr + idat + iend


def api_raw_frontend(method, path):
    url = FRONTEND + path
    req = urllib.request.Request(url, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=5)
        ct = resp.headers.get('Content-Type', '')
        return resp.status, resp.read(), ct
    except urllib.error.HTTPError as e:
        ct = e.headers.get('Content-Type', '') if e.headers else ''
        try:
            return e.code, e.read(), ct
        except Exception:
            return e.code, b'', ct


print('=' * 60)
print('  CertiFlow Full QA Checklist')
print('=' * 60)

# ============================================================
# 1. AUTHENTICATION
# ============================================================
phase = '1. Authentication'
print(f'\n=== {phase} ===')

email = f'qa-{ts}@certfi.com'
code, body = api('POST', '/auth/register', {
    'email': email, 'password': 'TestPass123!',
    'full_name': 'QA Tester', 'role': 'admin'
})
check(phase, 'Register new account', code in [200, 201], f'{code}')

code, body = api('POST', '/auth/login', {'email': email, 'password': 'TestPass123!'})
token = None
refresh_token = None
if code == 200 and 'token_pair' in body:
    token = body['token_pair']['access_token']
    refresh_token = body['token_pair']['refresh_token']
    check(phase, 'Login', True, f'user={body["user"]["email"]}')
else:
    check(phase, 'Login', False, f'{code}: {body}')
    sys.exit(1)

code, me = api('GET', '/auth/me', token=token)
check(phase, 'Refresh page (GET /auth/me)', code == 200 and me.get('email') == email, f'{code}')

code, body = api('POST', '/auth/refresh', {'refresh_token': refresh_token})
check(phase, 'Refresh token', code == 200 and 'access_token' in body, f'{code}')
if code == 200:
    token = body['access_token']

code, body = api('POST', '/auth/login', {'email': email, 'password': 'WrongPassword'})
check(phase, 'Invalid login rejected', code == 401, f'{code}')

code, body = api('POST', '/auth/logout', token=token)
check(phase, 'Logout', code == 200, f'{code}')

code, body = api('POST', '/auth/login', {'email': email, 'password': 'TestPass123!'})
token = body['token_pair']['access_token']
refresh_token = body['token_pair']['refresh_token']
check(phase, 'Re-login for remaining tests', code == 200, f'{code}')

# ============================================================
# 2. ORGANIZATION
# ============================================================
phase = '2. Organization'
print(f'\n=== {phase} ===')

code, body = api('POST', '/organizations/', {
    'name': f'QA Org {ts}',
    'description': 'Created during QA testing'
}, token=token)
org_id = None
if code in [200, 201]:
    org_id = body.get('id')
    check(phase, 'Create organization', True, f'{code}: id={org_id}')
elif code == 409:
    _, me = api('GET', '/auth/me', token=token)
    org_id = me.get('organization_id')
    check(phase, 'Create organization (already exists)', True, f'{code}: org_id={org_id}')
else:
    check(phase, 'Create organization', False, f'{code}: {body}')

if org_id:
    code, body = api('GET', f'/organizations/{org_id}', token=token)
    check(phase, 'Get organization', code == 200, f'{code}')

    code, body = api('PUT', f'/organizations/{org_id}', {
        'description': f'Updated QA description {ts}'
    }, token=token)
    check(phase, 'Edit organization', code == 200, f'{code}')

    code, body = api('GET', f'/organizations/{org_id}', token=token)
    desc = body.get('description', '') if isinstance(body, dict) else ''
    check(phase, 'Changes persist after edit', f'Updated QA description {ts}' in desc, f'desc="{desc[:60]}"')

# ============================================================
# 3. TEMPLATE MANAGEMENT
# ============================================================
phase = '3. Template Management'
print(f'\n=== {phase} ===')

png_data = make_png()
code, body = multipart('/templates/', {
    'name': f'QA PNG Template {ts}',
    'description': 'Test PNG template',
    'file_type': 'png',
    'width': '800',
    'height': '600',
    'dpi': '300',
    'background_color': '#FFFFFF'
}, {'file': (f'qa-{ts}.png', png_data, 'image/png')}, token=token)
template_id = None
if code in [200, 201]:
    template_id = body.get('id')
    check(phase, 'Upload PNG template', True, f'{code}: id={template_id}')
else:
    check(phase, 'Upload PNG template', False, f'{code}: {body}')

pdf_data = b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 800 600]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF'
code, body = multipart('/templates/', {
    'name': f'QA PDF Template {ts}',
    'description': 'Test PDF template',
    'file_type': 'pdf',
    'width': '800',
    'height': '600',
    'dpi': '300',
    'background_color': '#FFFFFF'
}, {'file': (f'qa-{ts}.pdf', pdf_data, 'application/pdf')}, token=token)
template_id_pdf = None
if code in [200, 201]:
    template_id_pdf = body.get('id')
    check(phase, 'Upload PDF template', True, f'{code}: id={template_id_pdf}')
else:
    check(phase, 'Upload PDF template', False, f'{code}: {body}')

code, body = api('GET', '/templates/', token=token)
count = len(body) if isinstance(body, list) else 0
check(phase, 'List templates', code == 200 and count >= 1, f'{code}: count={count}')

if template_id:
    code, body = api('GET', f'/templates/{template_id}', token=token)
    check(phase, 'Get template by ID', code == 200, f'{code}')

    code, body = api('PUT', f'/templates/{template_id}', {
        'name': f'QA PNG Template Updated {ts}'
    }, token=token)
    check(phase, 'Edit template', code == 200, f'{code}')

# ============================================================
# 4. VISUAL EDITOR
# ============================================================
phase = '4. Visual Editor'
print(f'\n=== {phase} ===')

if template_id:
    code, body = api('GET', f'/templates/{template_id}/placeholders', token=token)
    initial_count = len(body) if isinstance(body, list) else 0
    check(phase, 'Get initial placeholders', code == 200, f'{code}: count={initial_count}')

    custom_placeholders = [
        {'type': 'name', 'custom_key': '{{PARTICIPANT_NAME}}', 'x': 150, 'y': 200, 'width': 400, 'height': 60,
         'font_family': 'Helvetica-Bold', 'font_size': 28, 'font_weight': 'bold', 'font_color': '#1a1a1a',
         'alignment': 'center', 'rotation': 0.0, 'opacity': 1.0, 'is_required': True},
        {'type': 'event', 'custom_key': '{{EVENT_NAME}}', 'x': 100, 'y': 300, 'width': 500, 'height': 40,
         'font_family': 'Helvetica', 'font_size': 18, 'font_weight': 'normal', 'font_color': '#444444',
         'alignment': 'center', 'rotation': 0.0, 'opacity': 0.9, 'is_required': True},
        {'type': 'qr', 'custom_key': '{{QR_CODE}}', 'x': 600, 'y': 450, 'width': 120, 'height': 120,
         'font_family': 'Helvetica', 'font_size': 12, 'font_weight': 'normal', 'font_color': '#000000',
         'alignment': 'right', 'rotation': 15.0, 'opacity': 1.0, 'is_required': False},
        {'type': 'date', 'custom_key': '{{ISSUE_DATE}}', 'x': 50, 'y': 500, 'width': 200, 'height': 30,
         'font_family': 'Courier', 'font_size': 12, 'font_weight': 'normal', 'font_color': '#888888',
         'alignment': 'left', 'rotation': -5.0, 'opacity': 0.7, 'is_required': False},
    ]
    code, body = api('PUT', f'/templates/{template_id}/placeholders', custom_placeholders, token=token)
    check(phase, 'Save placeholders (drag/resize/rotate)', code == 200, f'{code}')

    code, body = api('GET', f'/templates/{template_id}/placeholders', token=token)
    saved = body if isinstance(body, list) else []
    check(phase, 'Refresh: placeholders persist', code == 200 and len(saved) == 4, f'{code}: count={len(saved)}')

    name_ph = next((p for p in saved if p.get('custom_key') == '{{PARTICIPANT_NAME}}'), None)
    if name_ph:
        check(phase, 'Name X=150', name_ph.get('x') == 150, f'x={name_ph.get("x")}')
        check(phase, 'Name Y=200', name_ph.get('y') == 200, f'y={name_ph.get("y")}')
        check(phase, 'Name width=400', name_ph.get('width') == 400, f'w={name_ph.get("width")}')
        check(phase, 'Name font_size=28', name_ph.get('font_size') == 28, f'fs={name_ph.get("font_size")}')
        check(phase, 'Name font_weight=bold', name_ph.get('font_weight') == 'bold', f'fw={name_ph.get("font_weight")}')
    else:
        check(phase, 'Name placeholder exists', False, 'not found')

    qr_ph = next((p for p in saved if p.get('custom_key') == '{{QR_CODE}}'), None)
    if qr_ph:
        check(phase, 'QR rotation=15.0', qr_ph.get('rotation') == 15.0, f'rot={qr_ph.get("rotation")}')
        check(phase, 'QR position (600,450)', qr_ph.get('x') == 600 and qr_ph.get('y') == 450, f'x={qr_ph.get("x")} y={qr_ph.get("y")}')
    else:
        check(phase, 'QR placeholder exists', False, 'not found')

    date_ph = next((p for p in saved if p.get('custom_key') == '{{ISSUE_DATE}}'), None)
    if date_ph:
        check(phase, 'Date rotation=-5.0', date_ph.get('rotation') == -5.0, f'rot={date_ph.get("rotation")}')
        check(phase, 'Date opacity=0.7', date_ph.get('opacity') == 0.7, f'op={date_ph.get("opacity")}')
        check(phase, 'Date alignment=left', date_ph.get('alignment') == 'left', f'align={date_ph.get("alignment")}')
    else:
        check(phase, 'Date placeholder exists', False, 'not found')

    # Verify second save (re-save with different positions)
    custom_placeholders[0]['x'] = 200
    custom_placeholders[0]['y'] = 250
    code, body = api('PUT', f'/templates/{template_id}/placeholders', custom_placeholders, token=token)
    check(phase, 'Re-save with updated positions', code == 200, f'{code}')

    code, body = api('GET', f'/templates/{template_id}/placeholders', token=token)
    saved2 = body if isinstance(body, list) else []
    name_ph2 = next((p for p in saved2 if p.get('custom_key') == '{{PARTICIPANT_NAME}}'), None)
    if name_ph2:
        check(phase, 'Re-saved X=200 persisted', name_ph2.get('x') == 200, f'x={name_ph2.get("x")}')
        check(phase, 'Re-saved Y=250 persisted', name_ph2.get('y') == 250, f'y={name_ph2.get("y")}')
else:
    check(phase, 'All visual editor tests', False, 'no template_id')

# ============================================================
# 5. PARTICIPANTS
# ============================================================
phase = '5. Participants'
print(f'\n=== {phase} ===')

csv_content = f'name,email,event\nAlice Johnson,alice-{ts}@qa.com,QATestEvent\nBob Smith,bob-{ts}@qa.com,QATestEvent\nCharlie Brown,charlie-{ts}@qa.com,QATestEvent'
code, body = multipart('/participants/import', {}, {
    'file': (f'participants-{ts}.csv', csv_content.encode('utf-8'), 'text/csv')
}, token=token)
check(phase, 'Import CSV', code == 200, f'{code}: {json.dumps(body)[:80]}')

code, body = api('GET', '/participants/', token=token)
participants = body if isinstance(body, list) else []
check(phase, 'List participants', code == 200 and len(participants) >= 1, f'{code}: count={len(participants)}')

participant_to_delete = None
for p in participants:
    if 'alice' in (p.get('email', '') or '').lower():
        participant_to_delete = p.get('id')
        break

if participant_to_delete:
    pre_count = len(participants)
    code, body = api('DELETE', f'/participants/{participant_to_delete}', token=token)
    check(phase, 'Delete participant', code == 200, f'{code}')

    code, body = api('GET', '/participants/', token=token)
    post_count = len(body) if isinstance(body, list) else 0
    check(phase, 'Count decreased after delete', post_count < pre_count, f'before={pre_count} after={post_count}')
else:
    check(phase, 'Delete participant', False, 'no alice found')

# ============================================================
# 6. CERTIFICATE GENERATION
# ============================================================
phase = '6. Certificate Generation'
print(f'\n=== {phase} ===')

code, body = api('GET', '/participants/', token=token)
part_list = body if isinstance(body, list) else []
tpl_id = template_id or template_id_pdf

if tpl_id and part_list:
    part = part_list[0]
    code, body = api('POST', '/certificates/generate', [{
        'participant_id': part.get('id'),
        'template_id': tpl_id,
        'participant_name': part.get('name', 'Test'),
        'participant_email': part.get('email', 'test@test.com'),
        'participant_event': 'QATestEvent',
        'template_name': f'QA Template {ts}'
    }], token=token)
    results = body.get('results', []) if isinstance(body, dict) else []
    single_cert_id = results[0].get('certificate_id') if results else None
    check(phase, 'Generate single certificate', code == 200 and len(results) > 0 and results[0].get('status') == 'success', f'{code}: id={single_cert_id}')

    multi_payload = []
    for p in part_list[:3]:
        multi_payload.append({
            'participant_id': p.get('id'),
            'template_id': tpl_id,
            'participant_name': p.get('name', 'Test'),
            'participant_email': p.get('email', 'test@test.com'),
            'participant_event': 'QATestEvent',
            'template_name': f'QA Template {ts}'
        })
    code, body = api('POST', '/certificates/generate', multi_payload, token=token)
    results = body.get('results', []) if isinstance(body, dict) else []
    multi_ok = sum(1 for r in results if r.get('status') == 'success')
    check(phase, 'Generate multiple certificates', code == 200 and multi_ok >= 1, f'{code}: {multi_ok}/{len(results)} success')

    code, body = api('GET', '/certificates/', token=token)
    certs = body if isinstance(body, list) else []
    check(phase, 'List certificates', code == 200 and len(certs) >= 1, f'{code}: count={len(certs)}')

    test_cert_id = single_cert_id
    if not test_cert_id and certs:
        test_cert_id = certs[0].get('certificate_id')

    if test_cert_id:
        code, body = api('GET', f'/certificates/{test_cert_id}', token=token)
        check(phase, 'Get certificate by ID', code == 200, f'{code}')
    else:
        check(phase, 'Get certificate by ID', False, 'no cert id')

    # Download PDF
    if test_cert_id:
        code, data, ct = api_raw('GET', f'/certificates/{test_cert_id}/pdf', token=token)
        is_pdf = isinstance(data, bytes) and data[:5] == b'%PDF-'
        check(phase, 'Download PDF', code == 200 and is_pdf, f'{code}: is_pdf={is_pdf} size={len(data) if isinstance(data, bytes) else 0}')
    else:
        check(phase, 'Download PDF', False, 'no cert id')

    # Download PNG
    if test_cert_id:
        code, data, ct = api_raw('GET', f'/certificates/{test_cert_id}/png', token=token)
        is_png = isinstance(data, bytes) and data[:8] == b'\x89PNG\r\n\x1a\n'
        check(phase, 'Download PNG', code == 200 and is_png, f'{code}: is_png={is_png} size={len(data) if isinstance(data, bytes) else 0}')
    else:
        check(phase, 'Download PNG', False, 'no cert id')

    # Download ZIP
    code, data, ct = api_raw('GET', '/certificates/download-all', token=token)
    is_zip = isinstance(data, bytes) and data[:2] == b'PK'
    check(phase, 'Download ZIP (all)', code == 200 and is_zip, f'{code}: is_zip={is_zip} size={len(data) if isinstance(data, bytes) else 0}')
else:
    for t in ['Generate single', 'Generate multiple', 'List certs', 'Download PDF', 'Download PNG', 'Download ZIP']:
        check(phase, t, False, f'no tpl={tpl_id} or no parts={len(part_list)}')

# ============================================================
# 7. VERIFICATION
# ============================================================
phase = '7. Verification'
print(f'\n=== {phase} ===')

if single_cert_id:
    code, body = api('GET', f'/verify/{single_cert_id}', token=token)
    check(phase, 'Verify valid certificate', code == 200, f'{code}')
    if isinstance(body, dict):
        check(phase, 'Verify response has data', 'status' in body or 'certificate_id' in body, f'keys={list(body.keys())[:5]}')

code, body = api('GET', '/verify/INVALID-CERT-99999999', token=token)
check(phase, 'Verify invalid certificate (404)', code == 404, f'{code}')

code, body = api('GET', '/verify/stats', token=token)
check(phase, 'Get verification stats', code == 200, f'{code}')

# ============================================================
# 8. ANALYTICS
# ============================================================
phase = '8. Analytics'
print(f'\n=== {phase} ===')

code, body = api('GET', '/analytics/summary', token=token)
check(phase, 'Get analytics summary', code == 200, f'{code}')
if isinstance(body, dict):
    tc = body.get('total_certificates', 0)
    tv = body.get('total_verifications', 0)
    check(phase, f'Summary certs={tc}', tc >= 1, f'')
    check(phase, f'Summary verifications={tv}', tv >= 0, f'')

for period in ['daily', 'weekly', 'monthly']:
    code, body = api('GET', f'/analytics/?period={period}', token=token)
    is_list = isinstance(body, list)
    check(phase, f'Get {period} analytics', code == 200 and is_list, f'{code}: type={type(body).__name__}')

# ============================================================
# 9. EMPTY STATE TESTING
# ============================================================
phase = '9. Empty State Testing'
print(f'\n=== {phase} ===')

code, body = api('GET', '/templates/', token=token)
tpls = body if isinstance(body, list) else []
deleted = 0
for t in tpls:
    tid = t.get('id')
    if tid:
        dc, _ = api('DELETE', f'/templates/{tid}', token=token)
        if dc == 200:
            deleted += 1
check(phase, f'Delete all templates ({deleted}/{len(tpls)})', True, f'deleted={deleted}')

code, body = api('GET', '/templates/', token=token)
remaining = body if isinstance(body, list) else []
check(phase, 'Templates empty after delete', len(remaining) == 0, f'count={len(remaining)}')

code, body = api('GET', '/participants/', token=token)
parts = body if isinstance(body, list) else []
deleted_p = 0
for p in parts:
    pid = p.get('id')
    if pid:
        dc, _ = api('DELETE', f'/participants/{pid}', token=token)
        if dc == 200:
            deleted_p += 1
check(phase, f'Delete all participants ({deleted_p}/{len(parts)})', True, f'deleted={deleted_p}')

code, body = api('GET', '/participants/', token=token)
remaining_p = body if isinstance(body, list) else []
check(phase, 'Participants empty after delete', len(remaining_p) == 0, f'count={len(remaining_p)}')

# ============================================================
# 10. BROWSER / FRONTEND
# ============================================================
phase = '10. Browser / Frontend'
print(f'\n=== {phase} ===')

code, data, ct = api_raw_frontend('GET', '/')
has_html = isinstance(data, bytes) and (b'<!DOCTYPE html>' in data or b'<html' in data)
check(phase, 'Frontend serves HTML', code == 200 and has_html, f'{code} size={len(data)}')

code, data, ct = api_raw('GET', '/health')
check(phase, 'Backend health', code == 200, f'{code}')

# Verify all key API endpoints return valid responses
for path in ['/templates/', '/participants/', '/certificates/', '/analytics/summary', '/verify/stats']:
    c, b = api('GET', path, token=token)
    check(phase, f'API {path}', c in [200], f'{c}')

# ============================================================
# SUMMARY
# ============================================================
print('\n' + '=' * 60)
print('  QA CHECKLIST SUMMARY')
print('=' * 60)
passed = sum(1 for _, _, s, _ in RESULTS if s)
failed = sum(1 for _, _, s, _ in RESULTS if not s)
total = len(RESULTS)
print(f'  Total: {total} | Passed: {passed} | Failed: {failed}')
print(f'  Pass Rate: {round(passed/total*100, 1)}%')

if BUGS:
    print(f'\n  BUGS FOUND ({len(BUGS)}):')
    for bug in BUGS:
        print(f'    - {bug}')
else:
    print('\n  NO BUGS FOUND')

print('=' * 60)
sys.exit(1 if BUGS else 0)
