# API Keys Configuration Guide

This document outlines where to add all the API keys required for your F4TRADERS e-commerce application.

## Required API Keys

All API keys should be added in **Backend → Secrets** section of your Lovable Cloud dashboard.

### 1. Razorpay Payment Gateway

**Keys Required:**
- `RAZORPAY_KEY_ID` - Your Razorpay account Key ID
- `RAZORPAY_KEY_SECRET` - Your Razorpay account Key Secret

**How to get:**
1. Sign up at https://razorpay.com
2. Go to Settings → API Keys
3. Generate Test/Live mode keys
4. Copy both Key ID and Secret

**Used in:**
- `supabase/functions/create-razorpay-order/index.ts`
- `supabase/functions/verify-razorpay-payment/index.ts`

---

### 2. Cloudinary Image Upload

**Keys Required:**
- `CLOUDINARY_CLOUD_NAME` - Your cloud name
- `CLOUDINARY_API_KEY` - Your API key
- `CLOUDINARY_API_SECRET` - Your API secret

**How to get:**
1. Sign up at https://cloudinary.com
2. Go to Dashboard
3. Find credentials under Account Details

**Used in:**
- `supabase/functions/upload-to-cloudinary/index.ts`
- Admin product management for image uploads

---

### 3. Email Service (Gmail SMTP or Resend)

**Option A: Gmail SMTP (Not Recommended for Production)**
- `GMAIL_USER` - Your Gmail address
- `GMAIL_APP_PASSWORD` - App-specific password (not your regular password)

**How to get Gmail App Password:**
1. Enable 2-factor authentication on your Gmail
2. Go to Google Account → Security → App passwords
3. Generate new app password
4. Copy the 16-character password

**Option B: Resend (Recommended)**
- `RESEND_API_KEY` - Your Resend API key

**How to get Resend API key:**
1. Sign up at https://resend.com
2. Verify your domain at https://resend.com/domains
3. Create API key at https://resend.com/api-keys
4. Copy the API key

**Used in:**
- `supabase/functions/send-order-email/index.ts`
- Order confirmation emails with invoice PDF

---

### 4. Professional Courier Tracking API (Chennai)

**Keys Required:**
- `PROFESSIONAL_COURIER_API_KEY` - API authentication key
- `PROFESSIONAL_COURIER_API_URL` - Base API URL endpoint

**How to get:**
1. Contact Professional Courier service in Chennai
2. Request API access for order tracking
3. They will provide API key and documentation
4. Set the base URL (e.g., `https://api.professionalcourier.com` or similar)

**Used in:**
- `supabase/functions/track-delivery/index.ts`
- Live order tracking on Track Order page

---

## How to Add Secrets

1. Open your Lovable project
2. Click on **Backend** (Cloud icon) in the left sidebar
3. Go to **Secrets** section
4. Click **Add Secret**
5. Enter the secret name exactly as shown above
6. Paste the secret value
7. Click **Save**

## Testing

### Development Mode
- For Razorpay: Use test mode keys
- For COD: No API keys required, works immediately
- For Cloudinary: Free tier is sufficient
- For Email: Use Resend free tier
- For Professional Courier: Contact provider for test credentials

### Production Mode
- Switch all services to production/live mode
- Update keys in Backend → Secrets
- Test thoroughly before going live

## Security Notes

⚠️ **IMPORTANT:**
- Never commit API keys to your code repository
- Always use the Backend → Secrets feature
- Rotate keys periodically
- Use test keys during development
- Monitor API usage to prevent overages

## Support

If you need help:
- Razorpay: https://razorpay.com/docs/
- Cloudinary: https://cloudinary.com/documentation
- Resend: https://resend.com/docs
- Professional Courier: Contact their support team

---

Last Updated: 2025-01-13
