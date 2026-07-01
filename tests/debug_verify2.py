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
        try:
            err = json.loads(e.read().decode())
        except:
            err = str(e)
        return e.code, err

code, body = api('POST', '/auth/login', {'email': 'e2e@certfi.com', 'password': 'SecurePass123!'})
token = body['token_pair']['access_token']

# List certs
code, certs = api('GET', '/certificates/', token=token)
print(f'Total certs: {len(certs)}')

# Find a generated cert and try to verify it
for c in certs:
    if c.get('status') == 'generated':
        cid = c['certificate_id']
        code, body = api('GET', f'/verify/{cid}')
        print(f'Verify {cid}: {code}')
        if code != 200:
            print(f'  Error: {json.dumps(body)[:500]}')
        break
