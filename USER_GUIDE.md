# MailBlast — User Guide

**Live App:** https://automation-mail.vercel.app

---

## Before You Start

You need a **Gmail App Password** (not your regular Gmail password).

> **Video Guide:** [How to generate Gmail App Password](https://youtu.be/ckfyTVgF1T4?si=bD70o6VUHaOfFf5k)

**Quick steps:**
1. Go to your Google Account → Security → 2-Step Verification (enable it)
2. Search **"App Passwords"** in Google Account settings
3. Create one → copy the 16-character password

---

## Prepare Your Excel File

Create an `.xlsx` file with exactly these two columns:

| Name       | Email                  |
|------------|------------------------|
| John Doe   | john@example.com       |
| Jane Smith | jane@example.com       |

- First row must be the header: **Name**, **Email**
- One person per row
- Save as `.xlsx` format

---

## How to Use the App

### Step 1 — Configure

| Field | What to enter |
|---|---|
| **Gmail Address** | Your Gmail (e.g. you@gmail.com) |
| **App Password** | The 16-character password from above |
| **Subject** | Your email subject line |
| **Body Template** | Your message — use `{{name}}` where you want the person's name |
| **Excel File** | Upload your recipients `.xlsx` file |
| **PDF Attachment** | Optional — attach any PDF (max 3 MB) |

**Example body:**
```
Hello {{name}},

Please find the attached document.

Regards,
Admin Team
```

Click **Preview Recipients →**

---

### Step 2 — Preview

- Review the list of recipients parsed from your Excel file
- Confirm the attachment (if any)
- Click **Send Emails** to start

---

### Step 3 — Send

- Emails are sent **one by one** with a **9-second gap** between each
- Watch the live progress: Total / Sent / Failed
- Activity log shows the status of each email in real time
- Click **Stop Sending** anytime to cancel mid-campaign

---

## Tips

- Always use an **App Password** — regular Gmail passwords won't work
- Keep PDF attachments under **3 MB**
- Invalid or missing email rows in Excel are skipped automatically
- Extra columns in your Excel file are ignored — they won't cause errors
- Credentials are **never stored** — they are used only for the current session
