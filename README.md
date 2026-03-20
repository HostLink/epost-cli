# epost-cli

**CLI for the [e-post](https://www.e-post.com.hk) email & SMS marketing platform — built for humans and AI agents.**

<p>
  <a href="https://www.npmjs.com/package/@hostlink/epost-cli"><img src="https://img.shields.io/npm/v/@hostlink/epost-cli" alt="npm version"></a>
  <a href="https://github.com/HostLink/epost-cli/blob/main/LICENSE"><img src="https://img.shields.io/github/license/HostLink/epost-cli" alt="license"></a>
</p>

## About e-post

[e-post](https://www.e-post.com.hk) is a Hong Kong-based email and SMS marketing platform that helps businesses reach their customers. It provides:

- 📧 **Email marketing** — import contacts, design email templates, schedule and send bulk EDM campaigns
- 📱 **SMS marketing** — send bulk SMS messages to contact groups
- 📊 **Delivery tracking** — monitor open rates, bounce codes, delivery status and view times for every campaign
- 👥 **Contact management** — organise contacts into groups, import/export mailing lists
- 💳 **Flexible quota plans** — purchase email and SMS sending quotas with expiry dates to suit your needs

This CLI provides programmatic access to the e-post platform API at [app.e-post.com.hk](https://app.e-post.com.hk), making it easy to automate campaigns, integrate with CI/CD pipelines, or use with AI agents.

## Installation

```bash
npm install -g @hostlink/epost-cli
```

## Authentication

Obtain your access token from the e-post platform and save it:

```bash
epost set-token <your_access_token>
```

## AI Agent Skills

This repo ships Agent Skills (`SKILL.md` files) for every command — ready to use with GitHub Copilot, Cursor, and any MCP-compatible AI agent.

```bash
# Install all e-post skills at once
npx skills add https://github.com/HostLink/epost-cli

# Or pick only what you need
npx skills add https://github.com/HostLink/epost-cli/tree/main/skills/epost-groups
npx skills add https://github.com/HostLink/epost-cli/tree/main/skills/epost-contacts
npx skills add https://github.com/HostLink/epost-cli/tree/main/skills/epost-letters
npx skills add https://github.com/HostLink/epost-cli/tree/main/skills/epost-schedules
npx skills add https://github.com/HostLink/epost-cli/tree/main/skills/epost-sms
npx skills add https://github.com/HostLink/epost-cli/tree/main/skills/epost-delivery
npx skills add https://github.com/HostLink/epost-cli/tree/main/skills/epost-info
```

## Commands

### Account Info

Check your email and SMS quota and expiry dates.

```bash
epost info
epost info --json
```

### Groups

Manage contact groups.

```bash
# List all contact groups
epost groups list
epost groups list --limit 10 --offset 0 --json

# Get a contact group by ID
epost groups get <id>

# Add a new contact group
epost groups add "Group Name"

# Delete a contact group
epost groups delete <id>
```

### Contacts

Manage contacts.

```bash
# List contacts (default limit: 50)
epost contacts list
epost contacts list --group <group_id>
epost contacts list --group <group_id> --limit 20 --offset 0 --json

# Get a contact by ID
epost contacts get <id>

# Add a new contact
epost contacts add "Name" --group <group_id>
epost contacts add "Name" --group <group_id> --email user@example.com --phone 12345678

# Delete a contact
epost contacts delete <id>
```

### Letters

Manage email letter templates.

```bash
# List letters (default limit: 50)
epost letters list
epost letters list --limit 10 --offset 0 --json

# Get a letter by ID
epost letters get <id>

# Add a new letter
epost letters add "Subject" --content "<h1>Email body</h1>"

# Update a letter
epost letters update <id> --subject "New Subject" --content "<p>New content</p>"

# Delete a letter
epost letters delete <id>
```

### Schedules

Manage email send schedules.

```bash
# List schedules (default limit: 50)
epost schedules list
epost schedules list --limit 10 --offset 0 --json

# Get a schedule by ID
epost schedules get <id>

# Add a new schedule
epost schedules add \
  --letter <letter_id> \
  --date 2026-03-18 \
  --time 16:00:00 \
  --group <group_id> \
  --sender-email sender@example.com \
  --sender-name "Sender Name" \
  --reply-to reply@example.com \
  --reply-to-name "Reply Name"

# Multiple contact groups (comma-separated)
epost schedules add --letter 123 --date 2026-03-18 --time 09:00:00 --group 101,102 --sender-email sender@example.com

# Update a schedule
epost schedules update <id> --letter <letter_id> --date 2026-03-20 --time 10:00:00 --group <group_id> --sender-email sender@example.com

# Delete a schedule
epost schedules delete <id>
```

### Delivery

View email delivery records for a schedule.

```bash
# List delivery records for a schedule
epost delivery list --schedule <schedule_id>
epost delivery list --schedule <schedule_id> --limit 10 --offset 0 --json

# Get a delivery record by ID
epost delivery get <id>
```

### SMS

Send and manage SMS messages.

```bash
# List SMS records (default limit: 50)
epost sms list
epost sms list --limit 10 --offset 0 --json

# Get an SMS record by ID
epost sms get <id>

# Send an SMS
epost sms send <phone> --content "Your message here"
```

## Options

| Option | Description |
|--------|-------------|
| `--json` | Output results as JSON |
| `--limit <n>` | Max number of results (default: 50) |
| `--offset <n>` | Number of results to skip for pagination (default: 0) |
