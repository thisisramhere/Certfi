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
        resp = urllib.request.urlopen(req, timeout=10)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

code, body = api('POST', '/auth/login', {'email': 'e2e@certfi.com', 'password': 'SecurePass123!'})
token = body['token_pair']['access_token']

# List certs
code2, certs = api('GET', '/certificates/', token=token)
print(f'Certs: {len(certs)}')
for c in certs:
    print(f'  {c["certificate_id"]} status={c["status"]} participant_id={c.get("participant_id")} template_id={c.get("template_id")}')

# Verify a generated cert
good = [c for c in certs if c.get('status') == 'generated']
if good:
    cid = good[0]['certificate_id']
    code, body = api('GET', f'/verify/{cid}')
    print(f'\nVerify {cid}: {code} -> {json.dumps(body)[:300]}')
else:
    print('No generated certs found')

# Try verify on the failed cert
failed = [c for c in certs if c.get('status') == 'failed']
if failed:
    cid = failed[0]['certificate_id']
    code, body = api('GET', f'/verify/{cid}')
    print(f'\nVerify FAILED cert {cid}: {code} -> {json.dumps(body)[:300]}')
