# VARA App - Authentication Testing Playbook

## Admin Credentials
- Email: admin@vara.com
- Password: vara_admin_2026
- Role: admin

## Test User Credentials
- Email: tester1@example.com
- Password: test123
- Role: user

## Auth Endpoints
- POST /api/auth/register - Create new account
- POST /api/auth/login - Login with email/password
- POST /api/auth/logout - Logout (clears cookies)
- GET /api/auth/me - Get current user info
- POST /api/auth/refresh - Refresh access token

## MongoDB Verification
```bash
mongosh
use vara_db
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```

Verify: bcrypt hash starts with `$2b$`, indexes exist on users.email (unique)

## API Testing
```bash
# Login
curl -c cookies.txt -X POST https://vara-landing-v1.preview.emergentagent.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vara.com","password":"vara_admin_2026"}'

# Check cookies
cat cookies.txt

# Get current user
curl -b cookies.txt https://vara-landing-v1.preview.emergentagent.com/api/auth/me
```

Login should return user object and set `access_token` + `refresh_token` cookies.
