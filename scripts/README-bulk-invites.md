# Bulk User Invitations for Clerk

This script allows you to bulk invite users to your Clerk application from a CSV file.

## Setup

1. **Add your Clerk Secret Key to your environment variables:**

   ```bash
   # Add this to your .env file
   CLERK_SECRET_KEY=sk_live_your_secret_key_here
   ```

   You can find your Secret Key in the [Clerk Dashboard](https://dashboard.clerk.com) under **API Keys**.

2. **Prepare your CSV file:**

   Create a CSV file with the users you want to invite. The script automatically detects common email column names:

   ```csv
   Customer Email
   john.doe@example.com
   jane.smith@example.com
   bob.wilson@example.com
   ```

   **Supported email column names:**

   - `Customer Email`, `email`, `Email`, `email_address`, `Email Address`

   **Optional additional columns:**

   - `firstName`, `First Name`, `first name` - User's first name
   - `lastName`, `Last Name`, `last name` - User's last name
   - `role`, `Role` - User's role/title
   - `department`, `Department` - User's department
   - `redirectUrl`, `Redirect URL` - Where to redirect after accepting invitation
   - Any other columns will be added as metadata

## Usage

### Using the example file:

```bash
pnpm invite:users
```

### Using a custom CSV file:

```bash
pnpm invite:users path/to/your/invitations.csv
```

### Direct command:

```bash
npx tsx scripts/bulk-invite-users.ts path/to/your/invitations.csv
```

## Features

- ✅ **Email validation** - Invalid emails are skipped with warnings
- ✅ **Metadata support** - Additional CSV columns become user metadata
- ✅ **Batch processing** - Processes 10 invitations at a time with 1-second delays to respect rate limits
- ✅ **Error handling** - Continues processing even if some invitations fail
- ✅ **Progress tracking** - Shows real-time progress and results
- ✅ **Custom redirect URLs** - Direct users to specific pages after signup

## What happens after running the script?

1. **Invitations are created** in your Clerk Dashboard
2. **Emails are sent** to each user with their unique invitation link
3. **Users click the link** and are redirected to signup (with email pre-verified)
4. **Metadata is attached** to their user profile when they sign up

## Notes

- Invitations expire after 1 month
- If a user doesn't use the invitation link, they can still sign up normally (but their email won't be pre-verified)
- The script processes 10 invitations at a time with 1-second delays to respect Clerk's rate limits (optimized for bulk processing)
- All additional CSV columns (beyond the standard ones) are automatically added as user metadata

## Example Output

```
🚀 Starting bulk user invitation process...
📁 Reading CSV file: ./example-invitations.csv
📊 Found 5 users to invite
✅ 5 valid email addresses found

📤 Processing batch 1/1 (5 users)...
  📧 Inviting: john.doe@example.com
  ✅ john.doe@example.com - Invitation created (ID: inv_2b1234567890abcdef)
  📧 Inviting: jane.smith@example.com
  ✅ jane.smith@example.com - Invitation created (ID: inv_2b1234567890abcdef)

📋 Summary:
✅ Successfully invited: 5 users
❌ Failed to invite: 0 users

🎉 Bulk invitation process completed!
```

## Troubleshooting

- **"CLERK_SECRET_KEY environment variable is not set"**: Add your Clerk Secret Key to your `.env` file
- **"HTTP 401"**: Your Clerk Secret Key is invalid or expired
- **"HTTP 422"**: Check that email addresses are valid
- **"HTTP 429"**: Rate limit exceeded - the script will handle this automatically
