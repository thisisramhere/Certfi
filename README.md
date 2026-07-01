CERTIFLOW BACKEND

# Overview

CertiFi is a smart certificate automation & verification platform that helps organizations create, manage, and verify certificates at scale. Built with modern Python best practices, it provides a robust backend for certificate management with advanced features like template-based generation, participant import, tamper detection, and public verification.

## Table of Contents

1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Quick Start](#quick-start)
5. [API Documentation](#api-documentation)
6. [Environment Configuration](#environment-configuration)
7. [Deployment](#deployment)
8. [Testing](#testing)
9. [Contributing](#contributing)
10. [License](#license)

## Key Features

### Certificate Generation
- ✅ Bulk certificate creation from templates
- ✅ PDF and PNG output formats
- ✅ QR code generation for verification
- ✅ Custom placeholders (name, event, position, date, etc.)
- ✅ Watermark support (logo and text)
- ✅ Unique certificate IDs (CERT-YYYY-XXXXXX)

### Template Management
- ✅ Upload PNG, JPG, or PDF templates
- ✅ Template placeholders with full styling (font, color, rotation, opacity)
- ✅ Template dimensions and DPI settings
- ✅ Organization-specific templates
- ✅ Default template management

### Participant Management
- ✅ CSV and Excel import with field mapping
- ✅ Duplicate detection
- ✅ Validation rules
- ✅ Bulk operations

### Certificate Verification
- ✅ Public verification endpoint
- ✅ QR code scanning support
- ✅ Tamper detection using SHA-256
- ✅ Certificate status (valid/invalid/tampered)

### Anti-Fake Features
- ✅ Unique certificate IDs
- ✅ Tamper detection with SHA-256
- ✅ QR code verification
- ✅ Watermarks

### Analytics
- ✅ Daily and monthly statistics
- ✅ Certificates generated/sent/failed
- ✅ Verification requests and results
- ✅ Download statistics
- ✅ Participant tracking

### Auditing
- ✅ Login activities
- ✅ Uploads and generation
- ✅ Downloads and verification
- ✅ Admin actions

### Security
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin, Staff, Viewer)
- ✅ Password hashing with bcrypt
- ✅ Rate limiting
- ✅ CORS protection
- ✅ File validation

### Integrations
- ✅ Email service for certificate delivery
- ✅ ZIP downloads for bulk certificates
- ✅ Swagger/OpenAPI documentation
- ✅ JSON API responses

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Language | Python | 3.11+ |
| Framework | FastAPI | 0.104+ |
| ORM | SQLAlchemy | 2.0 |
| Database | PostgreSQL | 13+ |
| Auth | JWT | HS256 |
| Password | bcrypt | 12 rounds |
| QR Code | qrcode | 7.4+ |
| PDF | ReportLab | 4.2+ |
| Images | Pillow | 10.0+ |
| Parsing | pandas, openpyxl | Latest |
| Validation | Pydantic | v2 |
| Uploads | Local Storage (S3 extensible) | - |
| Testing | pytest | 7.4+ |

## Project Structure

```
app/
├── api/
│   ├── auth/              # Authentication routes
│   ├── users/             # User management routes
│   ├── templates/         # Template management routes
│   ├── participants/      # Participant management routes
│   ├── certificates/      # Certificate generation routes
│   ├── verification/      # Verification endpoints
│   └── analytics/         # Analytics endpoints
├── core/                  # Core functionality
│   ├── config.py          # Configuration management
│   ├── security.py        # Authentication & security
│   ├── exceptions.py      # Custom exceptions
│   └── logging.py         # Logging setup
├── database/              # Database operations
│   ├── session.py         # Async database session
│   └── models.py          # SQLAlchemy models
├── schemas/               # Pydantic schemas
├── services/              # Business logic
│   ├── __init__.py
│   ├── auth.py           # Auth services
│   ├── templates.py       # Template services
│   ├── participants.py    # Participant services
│   ├── certificates.py   # Certificate services
│   ├── verification.py    # Verification services
│   ├── analytics.py       # Analytics services
│   └── base.py            # Base repositories
├── middleware/            # Request/response middleware
├── utils/                 # Helper functions
│   ├── __init__.py
│   └── helpers.py         # All helper utilities
├── storage/               # File storage
│   ├── uploads/
│   │   ├── templates/
│   │   └── participants/
│   └── generated/
│       ├── pdf/
│       ├── png/
│       └── zip/
└── main.py               # Application entry point

alembic/                  # Migration scripts
.env.example              # Environment variables template
tests/                    # Test suite
├── unit/                  # Unit tests
└── integration/           # Integration tests
.Dockerfile               # Container configuration
docker-compose.yml        # Development environment
requirements.txt          # Python dependencies
README.md                 # Project documentation
```

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 13+
- Docker (optional, for development)

### Installation

#### Option 1: Using Docker

```bash
# Start the development environment
cd /path/to/project
docker-compose up -d

# Check if PostgreSQL is running
docker ps
```

#### Option 2: Local Installation

```bash
# 1. Clone the repository
cd /path/to/project

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your database and security settings

# 5. Run database migrations
alembic upgrade head

# 6. Run the application
uvicorn app.main:app --reload
```

### Testing

```bash
# Run unit tests
pytest tests/unit/

# Run integration tests
pytest tests/integration/

# Run all tests
pytest tests/
```

### API Testing

```bash
# Start with curl

# Register a new user
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "full_name": "John Doe"}'

# Login to get tokens
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Get API docs
curl "http://localhost:8000/api/v1/docs"
```

## API Documentation

The API is documented using Swagger OpenAPI. Visit `/docs` in your browser to explore all endpoints.

### Example Endpoints

#### Authentication

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "viewer"
}

POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Certificate Generation

```http
POST /api/v1/certificates/generate
Content-Type: application/json
Authorization: Bearer <access_token>

[
  {
    "template_id": "uuid-here",
    "participant_id": "uuid-here",
    "participant_name": "John Doe",
    "participant_email": "john@example.com",
    "participant_event": "Annual Conference"
  }
]
```

#### Verification

```http
GET /api/v1/verify/CERT-2026-000001
```

## Environment Configuration

### Required Environment Variables

```env
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
DATABASE_URL=postgresql+asyncpg://certiflow:certiflow@localhost:5432/certiflow
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production-min-32-chars
BCRYPT_ROUNDS=12
TAMPER_SECRET_KEY=your-tamper-secret-key-change-in-production-min-32-chars
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Optional Environment Variables

```env
APP_NAME=CertiFlow
APP_VERSION=1.0.0
DEBUG=false
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
WORKERS=4
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["http://localhost:3000"]
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
STORAGE_TYPE=local
STORAGE_BASE_PATH=./app/storage
MAX_UPLOAD_SIZE=10485760
ALLOWED_TEMPLATE_EXTENSIONS=["png","jpg","jpeg","pdf"]
ALLOWED_PARTICIPANT_EXTENSIONS=["csv","xlsx"]
VERIFICATION_BASE_URL=https://certiflow.com/verify
DEFAULT_WATERMARK_OPACITY=0.3
DEFAULT_WATERMARK_TEXT=CertiFlow
CERTIFICATE_ID_PREFIX=CERT
CERTIFICATE_ID_FORMAT={prefix}-{year}-{sequence:06d}
LOG_LEVEL=INFO
LOG_FORMAT=json
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

## Deployment

### Docker Production

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://certiflow:certiflow@postgres:5432/certiflow
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=certiflow
      - POSTGRES_USER=certiflow
      - POSTGRES_PASSWORD=certiflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Nginx Reverse Proxy

```nginx
events {
    worker_connections 1024;
}

http {
    upstream certiflow_backend {
        server app:8000;
    }

    server {
        listen 80;
        server_name certiflow.com;

        location / {
            proxy_pass http://certiflow_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /docs {
            proxy_pass http://certiflow_backend/docs;
            proxy_set_header Host $host;
        }
    }
}
```

## Testing

### Unit Tests

Tests verify individual components and business logic.

```bash
pytest tests/unit/ -v --cov=app
```

### Integration Tests

Tests verify database interactions and API endpoints.

```bash
pytest tests/integration/ -v --cov=app
```

### Test Structure

```python
# tests/unit/
├── test_auth_service.py        # Authentication logic
├── test_template_service.py    # Template operations
├── test_certificate_service.py # Certificate generation
├── test_participant_service.py  # Participant import
├── test_verification_service.py # Verification logic
├── test_analytics_service.py   # Analytics
├── test_repository.py          # Database repositories
└── test_utils.py               # Helper functions

# tests/integration/
├── test_api_auth.py           # API authentication
├── test_api_templates.py      # Template API endpoints
├── test_api_certificates.py   # Certificate API endpoints
├── test_api_participants.py   # Participant API endpoints
├── test_api_verification.py  # Verification API endpoints
└── test_api_analytics.py     # Analytics API endpoints
```

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pytest tests/`
5. Verify linting: `ruff check app/`
6. Run type checking: `mypy app/`
7. Commit changes (following conventional commit format)
8. Create a pull request

### Code Quality

- Use snake_case for variable and function names
- Use CamelCase for class names
- Limit line length to 120 characters
- Add type hints to all functions
- Write docstrings for public functions
- Follow SOLID principles
- Use dependency injection for services

### Conventional Commits

```
feat: add certificate generation with PDF output
fix: handle duplicate participant emails
docs: update API documentation
refactor: simplify template service
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.