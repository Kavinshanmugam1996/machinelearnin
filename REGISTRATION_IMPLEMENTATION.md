# Registration & Authentication Implementation

## Backend Changes Complete ✅

### 1. Database Model Updates (`database/models.py`)
Added to `User` model:
- `email_verified` (Boolean, default=False)
- `verification_token` (String, nullable)
- `verification_token_expires` (DateTime with timezone)
- `reset_token` (String, nullable)
- `reset_token_expires` (DateTime with timezone)
- `created_at` (DateTime with timezone)
- `last_login` (DateTime with timezone)

### 2. New API Endpoints (`backend/main.py`)

#### POST `/api/register`
- **Input:** `{ email, password }` (password must be 8+ chars)
- **Process:**
  1. Check if email already exists
  2. Hash password with pbkdf2_sha256
  3. Generate verification token (UUID, expires in 24h)
  4. Send verification email via SES
- **Response:** `{ "message": "Registration successful. Please check your email to verify your account." }`

#### GET `/api/verify-email?token=<uuid>`
- **Input:** Token from email link
- **Process:**
  1. Find user by token
  2. Check token expiration
  3. Mark `email_verified = true`
  4. Clear token
- **Response:** `{ "message": "Email verified successfully! You can now log in." }`

#### POST `/api/forgot-password`
- **Input:** `{ email }`
- **Process:**
  1. Find user (always return success to prevent enumeration)
  2. Generate reset token (UUID, expires in 1h)
  3. Send reset email via SES
- **Response:** `{ "message": "If that email exists, a password reset link has been sent." }`

#### POST `/api/reset-password`
- **Input:** `{ token, new_password }`
- **Process:**
  1. Find user by token
  2. Check token expiration
  3. Hash and update password
  4. Clear token
- **Response:** `{ "message": "Password reset successfully. You can now log in." }`

#### POST `/api/change-password` (Protected)
- **Input:** `{ current_password, new_password }`
- **Headers:** `Authorization: Bearer <token>`
- **Process:**
  1. Verify current password
  2. Hash and update password
- **Response:** `{ "message": "Password changed successfully" }`

### 3. Updated Login Endpoint
Now checks `email_verified = true` before allowing login.
- Returns 403 if email not verified
- Tracks `last_login` timestamp

### 4. Database Migration (`alembic/versions/add_user_verification_fields.py`)
- Adds all new columns
- Sets `email_verified=true` for existing users (backward compatibility)
- Run with: `alembic upgrade head`

### 5. Email Templates
HTML emails sent via SES for:
- **Verification:** Welcome email with verify link (24h expiration)
- **Password Reset:** Reset link (1h expiration)

---

## Frontend Changes Needed (Next Steps)

### New Pages to Create

#### 1. `/register` — Registration Page
```jsx
<form>
  <input type="email" placeholder="Email" />
  <input type="password" placeholder="Password (8+ chars)" />
  <input type="password" placeholder="Confirm Password" />
  <button>Register</button>
  <p>Already have an account? <Link to="/login">Log in</Link></p>
</form>
```

#### 2. `/verify-email?token=xxx` — Auto-verify page
```jsx
useEffect(() => {
  // GET /api/verify-email?token=xxx on mount
  // Show success → redirect to /login after 3s
}, [token]);
```

#### 3. `/forgot-password` — Email input page
```jsx
<form>
  <input type="email" placeholder="Enter your email" />
  <button>Send Reset Link</button>
  <p><Link to="/login">Back to Login</Link></p>
</form>
```

#### 4. `/reset-password?token=xxx` — New password page
```jsx
<form>
  <input type="password" placeholder="New Password (8+ chars)" />
  <input type="password" placeholder="Confirm Password" />
  <button>Reset Password</button>
</form>
```

#### 5. Update `/login` page
Add link: `<Link to="/register">Don't have an account? Register</Link>`
Add link: `<Link to="/forgot-password">Forgot password?</Link>`

### API Client Updates
Add to frontend API client:
```javascript
export async function register(email, password) {
  const res = await fetch(`${API_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function verifyEmail(token) {
  const res = await fetch(`${API_URL}/api/verify-email?token=${token}`);
  return res.json();
}

export async function forgotPassword(email) {
  const res = await fetch(`${API_URL}/api/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.json();
}

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${API_URL}/api/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword })
  });
  return res.json();
}

export async function changePassword(currentPassword, newPassword, token) {
  const res = await fetch(`${API_URL}/api/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
  });
  return res.json();
}
```

---

## Deployment Steps

1. **Apply database migration:**
   ```bash
   cd backend
   alembic upgrade head
   ```

2. **Update environment variables (if needed):**
   - `FRONTEND_URL` (for email links)
   - `SES_FROM_EMAIL` (verified in SES)

3. **Deploy backend:**
   ```bash
   # Rebuild Docker image
   docker build -t aires-api:latest .

   # Or trigger GitHub Actions CI/CD
   git push origin main
   ```

4. **Build and deploy frontend** (after frontend pages are created)

---

## Security Features Implemented

✅ Password hashing with `pbkdf2_sha256`
✅ JWT tokens with 60-minute expiration
✅ Email verification required before login
✅ Token expiration (24h verification, 1h reset)
✅ Protection against email enumeration (forgot password always returns success)
✅ Current password validation before change
✅ Secure token generation (UUID v4)
✅ HTTPS-only email links

---

## Testing Checklist

- [ ] Register new user
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Login with verified account
- [ ] Try login before verification (should fail)
- [ ] Request password reset
- [ ] Receive reset email
- [ ] Reset password with token
- [ ] Login with new password
- [ ] Change password from profile
- [ ] Check token expiration (wait 24h for verification, 1h for reset)

---

**Status:** Backend complete ✅ | Frontend pending ⏳
