# epost-cli

A command-line interface for the [e-POST](https://app.e-post.com.hk) email marketing platform.

## Installation

```bash
npm install -g @hostlink/epost-cli
```

## Authentication

Obtain your access token from the e-POST platform and save it:

```bash
epost set-token <your_access_token>
```

## Commands

### Groups

Manage contact groups.

```bash
# List all contact groups
epost groups list
epost groups list --json

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
epost contacts list --group <group_id> --limit 20 --offset 0
epost contacts list --json

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
epost letters list --limit 10 --offset 0
epost letters list --json

# Add a new letter
epost letters add "Subject" --content "Email body content"

# Update a letter
epost letters update <id> --subject "New Subject" --content "New content"

# Delete a letter
epost letters delete <id>
```

### Schedules

Manage send schedules.

```bash
# List schedules (default limit: 50)
epost schedules list
epost schedules list --limit 10 --offset 0
epost schedules list --json

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

## Options

| Option | Description |
|--------|-------------|
| `--json` | Output results as JSON (available on `list` commands) |
| `--limit <n>` | Max number of results (default: 50) |
| `--offset <n>` | Number of results to skip for pagination (default: 0) |
