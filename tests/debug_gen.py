import urllib.request, json, io, sys

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

def api_multipart(path, fields, files, token=None):
    boundary = '----TestB123'
    body = io.BytesIO()
    for key, value in fields.items():
        body.write(('--' + boundary + '\r\n').encode())
        body.write(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode())
        body.write(f'{value}\r\n'.encode())
    for key, (filename, filedata, ct) in files.items():
        body.write(('--' + boundary + '\r\n').encode())
        body.write(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"\r\n'.encode())
        body.write(f'Content-Type: {ct}\r\n\r\n'.encode())
        body.write(filedata)
        body.write(b'\r\n')
    body.write(('--' + boundary + '--\r\n').encode())
    body.seek(0)
    url = BASE + path
    headers = {'Content-Type': f'multipart/form-data; boundary={boundary}'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(url, data=body.read(), headers=headers, method='POST')
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode())
        except:
            err_body = str(e)
        return e.code, err_body

# Login
code, body = api('POST', '/auth/login', {'email': 'e2e@certfi.com', 'password': 'SecurePass123!'})
token = body['token_pair']['access_token']

# Get user
code, me = api('GET', '/auth/me', token=token)
print(f'User org_id: {me.get("organization_id")}')

# Create template
code, tpl = api_multipart('/templates/', {
    'name': 'Gen Test', 'description': 't', 'file_type': 'png',
    'width': '1200', 'height': '850', 'dpi': '300', 'background_color': '#FFFFFF'
}, {'file': ('t.png', b'\x89PNG\r\n\x1a\n' + b'\x00' * 100, 'image/png')}, token=token)
print(f'Template: {code} -> {tpl}')
tpl_id = tpl.get('id') if isinstance(tpl, dict) else None

# Import participants
code, presult = api_multipart('/participants/import', {}, {
    'file': ('p.csv', b'name,email,event\nTest User,test@test.com,Conf', 'text/csv')
}, token=token)
print(f'Import: {code} -> {json.dumps(presult)[:300]}')

# Get participants
code, parts = api('GET', '/participants/', token=token)
print(f'Participants: {code} count={len(parts) if isinstance(parts, list) else parts}')

# Generate certificate
if tpl_id and isinstance(parts, list) and parts:
    gen_data = [{
        'participant_id': parts[0]['id'],
        'template_id': tpl_id,
        'participant_name': parts[0].get('name', 'Test'),
        'participant_email': parts[0].get('email', 'test@test.com'),
        'participant_event': parts[0].get('event', 'Conf'),
        'template_name': 'Gen Test'
    }]
    code, gresult = api('POST', '/certificates/generate', gen_data, token=token)
    print(f'Generate: {code} -> {json.dumps(gresult)[:500]}')

    # List certs
    code, certs = api('GET', '/certificates/', token=token)
    print(f'List certs: {code} count={len(certs) if isinstance(certs, list) else certs}')
    if isinstance(certs, list) and certs:
        c = certs[0]
        print(f'  First: id={c.get("id")} cert_id={c.get("certificate_id")} status={c.get("status")} org={c.get("organization_id")}')
else:
    print(f'Cannot generate: tpl_id={tpl_id} parts={len(parts) if isinstance(parts, list) else parts}')
