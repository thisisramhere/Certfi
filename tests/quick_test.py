import urllib.request, json, sys

BASE = 'http://localhost:8000/api/v1'

def api(method, path, data=None, token=None):
    url = BASE + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

print("=== PHASE 1: Register ===")
code, body = api('POST', '/auth/register', {'email': 'final@test.com', 'password': 'TestPass123!', 'full_name': 'Final Test', 'role': 'admin'})
print(f"  Register: {code}")

print("=== PHASE 1: Login ===")
code, body = api('POST', '/auth/login', {'email': 'final@test.com', 'password': 'TestPass123!'})
print(f"  Login: {code}")
token = body.get('token_pair', {}).get('access_token')
print(f"  Token: {'yes' if token else 'no'}")

if not token:
    print("FATAL: no token")
    sys.exit(1)

print("=== PHASE 3: Get Me ===")
code, body = api('GET', '/auth/me', token=token)
print(f"  Me: {code} -> {json.dumps(body)[:120]}")

print("=== PHASE 5: Create Org ===")
code, body = api('POST', '/organizations/', {'name': 'Final Test Org', 'description': 'Test'}, token=token)
print(f"  Create Org: {code} -> {json.dumps(body)[:200]}")

org_id = None
if isinstance(body, dict) and body.get('organization'):
    org_id = body['organization'].get('id')
elif isinstance(body, dict):
    org_id = body.get('id')
print(f"  org_id: {org_id}")

if org_id:
    code, body = api('GET', f'/organizations/{org_id}', token=token)
    print(f"  Get Org: {code}")
    code, body = api('PUT', f'/organizations/{org_id}', {'name': 'Updated Org'}, token=token)
    print(f"  Update Org: {code}")

print("=== PHASE 6: Create Template ===")
import io
boundary = '----Boundary12345'
fields = {'name': 'Test Template', 'description': 'Test', 'file_type': 'png', 'width': '1200', 'height': '850', 'dpi': '300', 'background_color': '#FFFFFF'}
mp_body = io.BytesIO()
for k, v in fields.items():
    mp_body.write(('--' + boundary + '\r\n').encode())
    mp_body.write(('Content-Disposition: form-data; name="' + k + '"\r\n\r\n' + v + '\r\n').encode())
mp_body.write(('--' + boundary + '\r\n').encode())
mp_body.write(b'Content-Disposition: form-data; name="file"; filename="test.png"\r\n')
mp_body.write(b'Content-Type: image/png\r\n\r\n')
mp_body.write(b'\x89PNG\r\n\x1a\n' + b'\x00' * 100)
mp_body.write(b'\r\n')
mp_body.write(('--' + boundary + '--\r\n').encode())
mp_body.seek(0)

req = urllib.request.Request(BASE + '/templates/', data=mp_body.read(), headers={
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Authorization': 'Bearer ' + token
}, method='POST')
try:
    resp = urllib.request.urlopen(req, timeout=10)
    tpl_body = json.loads(resp.read().decode())
    print(f"  Create Template: {resp.status} -> id={tpl_body.get('id')}")
except urllib.error.HTTPError as e:
    tpl_body = json.loads(e.read().decode())
    print(f"  Create Template: {e.code} -> {json.dumps(tpl_body)[:200]}")

print("=== PHASE 6: List Templates ===")
code, body = api('GET', '/templates/', token=token)
print(f"  List Templates: {code} -> count={len(body) if isinstance(body, list) else 'error'}")

print("=== PHASE 11: Analytics ===")
code, body = api('GET', '/analytics/?period=daily', token=token)
print(f"  Analytics: {code}")
code, body = api('GET', '/analytics/summary', token=token)
print(f"  Summary: {code}")

print("=== PHASE 13: Error Handling ===")
code, body = api('POST', '/auth/register', {'email': 'bad', 'password': 'short'})
print(f"  Invalid register: {code} (expect 422)")
code, body = api('GET', '/templates/00000000-0000-0000-0000-000000000000', token=token)
print(f"  404 template: {code}")
code, body = api('GET', '/templates/')
print(f"  No token: {code} (expect 401)")

print("\n=== ALL PHASES COMPLETE ===")
