# Application screenshots

This folder is reserved for real captures of the running IT Help Desk application. No screenshots are currently available in the repository. Do not use generated mockups or placeholder images as evidence of the application.

## Capture plan

| File | Capture |
|------|---------|
| `login.png` | Login page, with empty credential fields |
| `user-dashboard.png` | User ticket overview |
| `create-ticket.png` | Support request form |
| `ticket-detail.png` | Status, priority, assignment and comments |
| `it-staff-dashboard.png` | Staff statistics and ticket management |
| `admin-panel.png` | Administration view |
| `reports.png` | SLA, CSAT and workload reports |

Use an isolated local instance with fictional sample records. Capture only screens that exist in the application; omit unavailable views. Keep the interface readable and use consistent window sizes where possible.

## Review before committing

- Exclude real names, email addresses, employee records, company identifiers, internal URLs/IP addresses and confidential ticket content.
- Exclude passwords, session tokens, credentials, browser autofill, developer tools and environment settings.
- Review the full image and metadata for sensitive information before adding it.
- Add only reviewed images to this folder, then replace the planned-file table in the root README with image links for the files actually present.

Example after a reviewed capture has been added:

```markdown
### Login

![IT Help Desk login page](docs/screenshots/login.png)
```

The example path is relative to the root README. Do not enable image links before their files exist.
