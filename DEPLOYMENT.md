# Production Deployment & Sharing Playbook: Condo Booking System

This guide explains how to deploy and share your calendar booking system using **Google Calendar** and **Google Apps Script**.

---

## Why This is the Most Accessible & 100% Free Way to Share

1. **No Guest Account Friction**: Guests do not need a Google Account to view availability or book.
2. **100% Free**: Operates within Google's standard free tier (Google Calendar + Apps Script). No credit card required.
3. **Mobile & Screen-Reader Accessible (WCAG AA)**: 
   - 48px+ touch targets (avoids accidental taps on phones).
   - Dynamic `aria-live` screen-reader announcements.
   - High color contrast (compliant with WCAG AA 4.5:1 ratio).
   - One-tap "Add to Google Calendar" and `.ics` file download upon booking confirmation.

---

## Step 1: Create a Dedicated Secondary Google Calendar

1. Open [Google Calendar](https://calendar.google.com).
2. On the left sidebar, next to **Other calendars**, click the **`+`** icon &rarr; **Create new calendar**.
3. Name it: `Condo Bookings`.
4. Click **Create calendar**.
5. Once created, click on the three dots next to `Condo Bookings` &rarr; **Settings and sharing**.
6. Scroll down to the **Integrate calendar** section.
7. Copy your **Calendar ID** (e.g. `c_xxxxxxxxxxxxxxxxxxxxxxxxxx@group.calendar.google.com`).

---

## Step 2: Set Up the Google Apps Script Project

1. Go to [script.google.com](https://script.google.com) and click **+ New project**.
2. Rename the project at top left to: `Condo Booking Web App`.
3. In `Code.gs`, paste all contents from [`Code.gs`](file:///Users/jeffureta/.gemini/antigravity/scratch/condo-booking-app/Code.gs).
4. Update line 6 with your Calendar ID:
   ```javascript
   const CALENDAR_ID = 'YOUR_CALENDAR_ID@group.calendar.google.com';
   ```
5. In the left panel, click **`+`** next to Files &rarr; select **HTML**.
6. Name the file `Index` (it will become `Index.html`).
7. Paste all contents from [`Index.html`](file:///Users/jeffureta/.gemini/antigravity/scratch/condo-booking-app/Index.html).
8. Click **Save** (floppy disk icon).

---

## Step 3: Deploy as a Public Web App

1. Click the blue **Deploy** button at top right &rarr; **New deployment**.
2. Click the gear icon next to "Select type" &rarr; select **Web app**.
3. Configure settings:
   - **Description**: `v2.0 Accessible Booking`
   - **Execute as**: `Me (<your-email@gmail.com>)`
   - **Who has access**: `Anyone` *(Crucial so any guest can open the link without logging into a Google account)*
4. Click **Deploy**.
5. Authorize access when prompted (Review permissions &rarr; Advanced &rarr; Go to Condo Booking Web App).
6. Copy your **Web App URL** (ends in `/exec`).

---

## Step 4: The Best Ways to Share with Guests

### Option 1: Direct Link via SMS / WhatsApp / Airbnb Messaging (Highest Accessibility)
Create a clean, memorable short URL for free:
1. Go to [TinyURL](https://tinyurl.com) or [Bitly](https://bit.ly).
2. Paste your long Google Web App `/exec` URL.
3. Customize alias (e.g. `tinyurl.com/stay-at-mycondo`).
4. **Message Template to Send Guests:**
   > *"Hi! You can check our real-time availability and reserve your stay instantly here: https://tinyurl.com/stay-at-mycondo — no login or credit card required. Once you pick your dates, you'll receive an instant confirmation email!"*

### Option 2: Embed into Google Sites (Optional Portfolio Site)
If you also want photos, house rules, and amenities on a free site:
1. Open [Google Sites](https://sites.google.com).
2. In the right panel, click **Insert** &rarr; **Embed** (`<>`).
3. Select **By URL** and paste your Web App `/exec` URL.
4. Resize the iframe to fill the width (~700px wide, ~850px high).
5. Click **Publish**.

---

## Instant Confirmation Flow
- When a guest submits their dates and contact info:
  1. The Google Calendar event is created automatically.
  2. Dates are immediately blocked from future visitors.
  3. A confirmation email is dispatched to both you and the guest.
  4. The guest can tap **"Add to Google Calendar"** or **"Download .ICS"** right from the confirmation screen to store it in their phone.
