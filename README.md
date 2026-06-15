# MailBlast — Email Campaign Manager

A full-stack email automation app. Upload an Excel file of recipients, write a template with `{{name}}` placeholders, attach an optional PDF, and send personalised emails via Gmail SMTP with a 15-second delay between each send.

## Project Structure

```
Automation-Mail/
├── backend/
│   ├── api/
│   │   └── send-email.js     # Vercel serverless handler + local Express route
│   ├── server.js             # Local dev Express wrapper
│   ├── package.json
│   └── vercel.json           # Backend Vercel config
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmailForm.jsx
│   │   │   ├── ProgressTracker.jsx
│   │   │   └── StatusLog.jsx
│   │   ├── utils/
│   │   │   └── excelParser.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js        # Dev proxy → localhost:3001
│   ├── .env.example
│   └── vercel.json           # SPA rewrites
└── README.md
```

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite 5, Axios             |
| Backend  | Node.js, Express (dev), Nodemailer  |
| Excel    | `xlsx` (browser-side parsing)       |
| Deploy   | Vercel (both frontend & backend)    |

---

## Local Development

### 1. Clone and install

```bash
git clone <repo-url>
cd Automation-Mail

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Start the backend

```bash
cd backend
node server.js
# → http://localhost:3001
```

### 3. Start the frontend

```bash
cd frontend
cp .env.example .env   # leave VITE_API_URL empty for local dev
npm run dev
# → http://localhost:5173
```

The Vite dev proxy forwards `/api/*` requests to `http://localhost:3001` automatically.

---

## Gmail App Password Setup

Regular Gmail passwords will not work. You must generate an **App Password**:

1. Go to [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already on
3. Visit [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Select **Mail** + **Windows Computer** → Generate
5. Copy the 16-character password — use this in the app

---

## Excel File Format

The file must have a header row with at least two columns containing **"Name"** and **"Email"** (case-insensitive):

| Name       | Email              |
|------------|--------------------|
| John Doe   | john@example.com   |
| Jane Smith | jane@example.com   |

Rows with missing or invalid email addresses are skipped automatically.

---

## Email Body Template

Use `{{name}}` (case-insensitive) to personalise each email:

```
Hello {{name}},

Please find the attached document.

Regards,
Admin Team
```

---

## Deployment on Vercel

### Deploy the Backend

1. Create a new Vercel project and set the **Root Directory** to `backend/`
2. No environment variables needed (credentials are sent per-request, never stored)
3. Deploy → note the URL (e.g. `https://your-backend.vercel.app`)

> **Timeout note:** The Vercel hobby plan allows 10-second function execution. Because the delay between emails is managed on the frontend (not in the serverless function), each `/api/send-email` call only sends one email and completes well within the limit.

### Deploy the Frontend

1. Create a second Vercel project and set the **Root Directory** to `frontend/`
2. Add an **Environment Variable**:
   - `VITE_API_URL` = `https://your-backend.vercel.app`
3. Deploy

---

## API Reference

### `POST /api/send-email`

**Request body (JSON)**

| Field          | Type   | Required | Description                            |
|----------------|--------|----------|----------------------------------------|
| `gmailEmail`   | string | Yes      | Sender Gmail address                   |
| `gmailPassword`| string | Yes      | Gmail App Password                     |
| `to`           | string | Yes      | Recipient email address                |
| `toName`       | string | No       | Recipient name (replaces `{{name}}`)   |
| `subject`      | string | Yes      | Email subject                          |
| `bodyTemplate` | string | Yes      | Body with optional `{{name}}` token    |
| `pdfBase64`    | string | No       | PDF file content encoded as base64     |
| `pdfFileName`  | string | No       | Filename for the attachment            |

**Response**

```json
{ "success": true, "message": "Email sent to john@example.com" }
```

**Error response**

```json
{ "success": false, "error": "Invalid login: 535-5.7.8 ..." }
```

---

## Limitations

| Constraint | Details |
|---|---|
| PDF size | Max ~3 MB (Vercel free tier: 4.5 MB request body limit) |
| Function timeout | 10 s on Vercel hobby plan — safe because each call sends 1 email |
| Gmail sending rate | Gmail limits bulk sending; the 15 s delay helps stay under limits |
| CORS | Backend allows `*` by default — restrict to your frontend domain in production |

---

## Security Notes

- Gmail credentials are sent only to your own backend and are **never stored or logged**
- Use App Passwords — not your Google account password
- Consider restricting `Access-Control-Allow-Origin` in `backend/api/send-email.js` to your frontend domain in production
- PDF base64 data is held in browser memory only for the duration of the session
>>>>>>> ea872c3 (feat: initial release of MailBlast email automation app)
