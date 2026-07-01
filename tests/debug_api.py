import urllib.request, json

BASE = 'http://localhost:8000/api/v1'

def api(method, path, data=None, token=None):
    url = BASE + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

code, body = api('POST', '/auth/login', {'email': 'e2e@certfi.com', 'password': 'SecurePass123!'})
token = body['token_pair']['access_token']

# Test update org - try with org_id from previous run
code, body = api('GET', '/organizations/', token=token)
print(f'GET orgs: {code} -> {json.dumps(body)[:200]}')

org_id = None
if isinstance(body, list) and body:
    org_id = body[0].get('id')
elif isinstance(body, dict):
    org_id = body.get('id')
print(f'org_id: {org_id}')

if org_id:
    code, body = api('PUT', f'/organizations/{org_id}', {'name': 'Updated Org'}, token=token)
    print(f'PUT org: {code} -> {json.dumps(body)[:200]}')

# Test list participants
code, body = api('GET', '/participants/', token=token)
print(f'GET participants: {code} -> {json.dumps(body)[:300]}')

# Test create template multipart
import io
boundary = '----Boundary12345'
fields = {'name': 'Test', 'description': 'Test', 'file_type': 'png', 'width': '1200', 'height': '850', 'dpi': '300', 'background_color': '#FFFFFF'}
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
    resp = urllib.request.urlopen(req)
    print(f'POST template: {resp.status} -> {resp.read().decode()[:200]}')
except urllib.error.HTTPError as e:
    print(f'POST template: {e.code} -> {e.read().decode()[:300]}')
