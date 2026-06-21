-- Run this once in the Neon SQL console
-- https://console.neon.tech

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS gmail_accounts (
  id                 SERIAL PRIMARY KEY,
  user_id            INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label              TEXT NOT NULL,
  email              TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  iv                 TEXT NOT NULL,
  auth_tag           TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE TABLE IF NOT EXISTS email_templates (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  pdf_data     BYTEA,
  pdf_filename TEXT,
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS templates_one_default_per_user
  ON email_templates(user_id)
  WHERE is_default = TRUE;

CREATE TABLE IF NOT EXISTS campaigns (
  id               SERIAL PRIMARY KEY,
  user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  gmail_account_id INT NOT NULL REFERENCES gmail_accounts(id),
  template_id      INT NOT NULL REFERENCES email_templates(id),
  status           TEXT NOT NULL DEFAULT 'active',
  total_recipients INT NOT NULL DEFAULT 0,
  sent_count       INT NOT NULL DEFAULT 0,
  failed_count     INT NOT NULL DEFAULT 0,
  pending_count    INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS campaigns_user_status_idx ON campaigns(user_id, status);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id          BIGSERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  retry_count SMALLINT NOT NULL DEFAULT 0,
  error_msg   TEXT,
  queued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cr_campaign_status_idx ON campaign_recipients(campaign_id, status);
CREATE INDEX IF NOT EXISTS cr_pending_idx ON campaign_recipients(status, id)
  WHERE status IN ('pending', 'failed');

CREATE TABLE IF NOT EXISTS daily_email_counts (
  gmail_account_id INT  NOT NULL REFERENCES gmail_accounts(id) ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  sent_count       INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (gmail_account_id, date)
);

-- Seed your user (replace values):
-- INSERT INTO users (email, password_hash)
-- VALUES ('you@example.com', '$2a$10$...');
-- Generate hash: node -e "const b=require('bcryptjs');b.hash('yourpassword',10).then(console.log)"
