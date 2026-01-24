# Grand Egyptian Museum Photobooth Web Application
## Technical Documentation

**Version:** 2.0.0**  
**Last Updated:** 2024  
**Document Owner:** Engineering Team

---

## Table of Contents

1. [Web Application Purpose & Scope](#1-web-application-purpose--scope)
2. [User Roles & Access Model](#2-user-roles--access-model)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Detailed User Flows](#5-detailed-user-flows)
6. [Frontend Architecture](#6-frontend-architecture)
7. [API Integration](#7-api-integration)
8. [Security Model](#8-security-model)
9. [Offline & Deferred Sync Behavior](#9-offline--deferred-sync-behavior)
10. [Error States & UX Handling](#10-error-states--ux-handling)
11. [Performance & Scalability Considerations](#11-performance--scalability-considerations)
12. [Monitoring & Logging](#12-monitoring--logging)
13. [Deployment & Environment Configuration](#13-deployment--environment-configuration)
14. [Testing Strategy](#14-testing-strategy)
15. [Operational Considerations](#15-operational-considerations)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Future Enhancements](#17-future-enhancements)

---

## 1. Web Application Purpose & Scope

### 1.1 Purpose

The Grand Egyptian Museum Photobooth Web Application is a client-side web application that enables museum visitors to view, customize, and share their photobooth images after scanning a QR code displayed on the physical kiosk screen. The application serves as the primary interface between the photobooth hardware system and end users, providing a seamless experience for image retrieval, personalization, and distribution.

### 1.2 Scope

**In Scope:**
- Static web application hosted on AWS S3 and served via CloudFront CDN
- Image viewing and display with dynamic card overlay generation
- Text customization on memory cards
- Email submission for secure image delivery
- Social media sharing via Web Share API
- Bilingual support (English and Arabic) with RTL layout support
- Responsive design for mobile and tablet devices

**Out of Scope:**
- Image processing or manipulation beyond text overlay
- User authentication or account management
- Payment processing
- Image storage or persistence (handled by backend)
- Email delivery (handled by AWS SES via backend)
- Analytics or tracking (handled separately)

### 1.3 System Boundaries

The web application operates as a **static frontend** with the following boundaries:

- **Frontend Responsibility:** UI rendering, client-side image processing, user interactions, localization
- **Backend Responsibility:** Image storage, email delivery, data persistence, API endpoints
- **Infrastructure Responsibility:** CDN delivery, SSL termination, caching, scaling

---

## 2. User Roles & Access Model

### 2.1 User Roles

The application supports a **single user role**: **Visitor**

**Visitor:**
- No authentication required
- Access via QR code scan (contains image URL parameter)
- Can view, customize, share, and request email delivery of their photobooth images
- Session is stateless (no server-side session management)

### 2.2 Access Model

**Access Control:**
- **Public Access:** Application is publicly accessible via CloudFront URL
- **Image Access:** Images are accessed via URLs passed as query parameters
- **No Authentication:** No user accounts, login, or authentication mechanisms
- **Email-Based Identification:** User identification is implicit via email submission (stored in browser localStorage for convenience)

**Access Flow:**
1. Visitor scans QR code from photobooth kiosk
2. QR code contains URL: `https://[cloudfront-domain]/?image=[image-url]`
3. Application loads and extracts image URL from query parameter
4. Application fetches image from provided URL (CloudFront CDN)
5. Visitor interacts with application features

**Security Implications:**
- Image URLs in QR codes are the primary access control mechanism
- URLs should be time-limited or tokenized by backend system
- No server-side validation of user identity
- Email addresses are collected but not verified

---

## 3. Functional Requirements

### 3.1 Core Features

#### FR-1: Image Display
- **Requirement:** Application must display the photobooth image fetched from the URL provided in query parameters
- **Implementation:** Uses `useRemoteImage` hook to extract `?image=` parameter and fetch image as Blob
- **Acceptance Criteria:**
  - Image loads and displays within 5 seconds on standard 4G connection
  - Image maintains aspect ratio
  - Loading state is shown during fetch
  - Error state is shown if image fetch fails

#### FR-2: Custom Card Generation
- **Requirement:** Application must generate a customizable memory card with user-editable text overlay
- **Implementation:** 
  - Fetches card template from Cloudinary CDN
  - Renders text overlay using HTML5 Canvas API
  - Supports Arabic and English text with appropriate font selection
  - Includes current date stamp
- **Acceptance Criteria:**
  - Card template loads successfully
  - Text can be edited (max 60 characters, 3 lines, 25 chars per line)
  - Card updates in real-time as text changes
  - Date is automatically formatted (DD.MM.YYYY)

#### FR-3: Flippable Card Display
- **Requirement:** Application must display both photobooth image and custom card in a flippable card interface
- **Implementation:** 
  - Front side: Photobooth image
  - Back side: Custom card with text overlay
  - Auto-flips every 3 seconds
  - Manual flip on click/tap
- **Acceptance Criteria:**
  - Smooth 3D flip animation (700ms transition)
  - Auto-flip can be disabled by user interaction
  - Both sides render correctly

#### FR-4: Email Submission
- **Requirement:** Application must collect visitor email address and submit to backend API for image delivery
- **Implementation:**
  - Modal popup on initial load (blocks interaction until submitted)
  - Email validation (regex pattern)
  - Stores email in localStorage for future use
  - Submits to AWS API Gateway endpoint
- **Acceptance Criteria:**
  - Email validation prevents invalid submissions
  - Previous email is remembered and can be reused
  - API submission handles success and error states
  - Modal cannot be dismissed without valid submission

#### FR-5: Email-Based Image Request
- **Requirement:** Application must allow users to request image delivery via email after initial submission
- **Implementation:**
  - Button appears after email is submitted
  - Uses stored email from localStorage
  - Calls same API endpoint with image metadata
- **Acceptance Criteria:**
  - Button only appears when email is stored
  - Shows stored email address in button text
  - Handles API errors gracefully

#### FR-6: Social Media Sharing
- **Requirement:** Application must enable sharing of both images via native Web Share API
- **Implementation:**
  - Uses `navigator.share()` API when available
  - Falls back to opening images in new tabs if API unavailable
  - Packages both photobooth image and custom card as files
- **Acceptance Criteria:**
  - Works on mobile devices with Web Share API support
  - Graceful fallback on desktop browsers
  - Both images are included in share payload

#### FR-7: Bilingual Support
- **Requirement:** Application must support English and Arabic languages with RTL layout
- **Implementation:**
  - Uses i18next for internationalization
  - Language detection from browser/localStorage
  - Manual language toggle in header
  - RTL layout support for Arabic
  - Custom fonts for Arabic text (Cairo) and English (Mariam, Averia)
- **Acceptance Criteria:**
  - All UI text is translated
  - Layout switches to RTL for Arabic
  - Font rendering supports Arabic characters correctly
  - Language preference persists in localStorage

### 3.2 User Interface Requirements

#### UI-1: Responsive Design
- Application must be responsive across mobile (320px+), tablet (768px+), and desktop (1024px+) viewports
- Touch-friendly button sizes (minimum 44x44px)
- Optimized for portrait orientation (primary use case)

#### UI-2: Visual Design
- Dark theme with museum branding
- Custom fonts: Cairo (Arabic), Mariam (English), Averia Libre (dates)
- Animated looping text banner
- Glassmorphism UI elements (backdrop blur, transparency)

#### UI-3: Accessibility
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast meets WCAG AA standards

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Page Load | < 2 seconds | Time to First Contentful Paint (FCP) |
| Image Load Time | < 5 seconds | Time from page load to image display |
| Card Generation | < 1 second | Time from text edit to card update |
| API Response Handling | < 500ms | Time to process API response |
| Bundle Size | < 500 KB (gzipped) | Total JavaScript bundle size |

### 4.2 Reliability Requirements

- **Availability:** 99.9% uptime (managed by CloudFront)
- **Error Recovery:** Graceful degradation on API failures
- **Image Loading:** Retry mechanism for failed image fetches (to be implemented)
- **Offline Handling:** Clear messaging when images are unavailable

### 4.3 Compatibility Requirements

**Browser Support:**
- Chrome/Edge: Last 2 versions
- Safari: Last 2 versions (iOS 14+)
- Firefox: Last 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

**Feature Requirements:**
- Web Share API support (mobile browsers)
- Canvas API support
- Blob URL support
- LocalStorage support
- ES6+ JavaScript support

### 4.4 Security Requirements

- HTTPS only (enforced by CloudFront)
- No sensitive data in client-side code
- Email validation on client and server
- CORS headers properly configured
- No XSS vulnerabilities (React sanitization)
- Content Security Policy (CSP) headers (to be configured)

### 4.5 Scalability Requirements

- **Static Assets:** Served via CloudFront CDN (global distribution)
- **Concurrent Users:** Supports unlimited concurrent users (static hosting)
- **Geographic Distribution:** CloudFront edge locations for low latency
- **Bandwidth:** CloudFront handles traffic spikes automatically

---

## 5. Detailed User Flows

### 5.1 Primary Flow: Online Scenario

**Preconditions:**
- Photobooth kiosk has captured image and uploaded to S3
- QR code is generated with image URL
- Image is available via CloudFront CDN

**Flow Steps:**

1. **QR Code Scan**
   - Visitor scans QR code displayed on photobooth screen
   - Mobile browser opens: `https://[cloudfront-domain]/?image=[cloudfront-image-url]`

2. **Application Load**
   - Next.js application loads from CloudFront
   - Application extracts `image` parameter from URL
   - Language is detected (browser/localStorage) or defaults to English

3. **Email Collection (Blocking)**
   - Email popup modal appears immediately
   - Visitor enters email address
   - Application validates email format
   - On submit, email is sent to backend API: `POST /save-email`
   - Email is stored in localStorage
   - Modal dismisses, application becomes interactive

4. **Image Fetching**
   - `useRemoteImage` hook fetches image from provided URL
   - Image is converted to Blob for processing
   - Loading state is shown during fetch

5. **Card Template Loading**
   - `useCustomCard` hook fetches card template from Cloudinary
   - Template is loaded as Blob
   - Default text is applied ("The Grand Egyptian Museum" / "المتحف المصري الكبير")

6. **Card Generation**
   - Canvas API renders text overlay on card template
   - Current date is added automatically
   - Custom card is generated as Blob

7. **Display**
   - Flippable card component displays both images
   - Auto-flip animation starts (3-second interval)
   - Action buttons become available

8. **User Interactions**
   - **Edit Text:** Opens modal, allows text editing (60 chars max, 3 lines)
   - **Share:** Uses Web Share API or fallback to new tabs
   - **Email Request:** Sends email request to backend with stored email

9. **Completion**
   - Visitor can share images or request email delivery
   - Application remains accessible until browser session ends

### 5.2 Secondary Flow: Offline/Processing Scenario

**Preconditions:**
- Photobooth kiosk is offline or image is still processing
- QR code contains image URL, but image is not yet available
- Backend may return 404 or image may not exist in S3

**Flow Steps:**

1. **QR Code Scan** (same as primary flow)

2. **Application Load** (same as primary flow)

3. **Email Collection** (same as primary flow)

4. **Image Fetch Failure**
   - `useRemoteImage` hook attempts to fetch image
   - Fetch fails (404, network error, or timeout)
   - Error state is set in hook
   - **Current Limitation:** No retry mechanism implemented

5. **Error Display**
   - Flippable card shows "Front Image not available" placeholder
   - Custom card may still load (independent of photobooth image)
   - User can still interact with card customization

6. **Retry Behavior** (To Be Implemented)
   - Application should implement exponential backoff retry
   - Retry interval: 5s, 10s, 20s, 40s (max 4 attempts)
   - Show "Processing..." message to user
   - Auto-retry in background

7. **Recovery**
   - When image becomes available, retry succeeds
   - Image displays automatically
   - User experience continues normally

### 5.3 Edge Cases

**Case 1: Missing Image Parameter**
- URL has no `?image=` parameter
- Application shows error state
- User cannot proceed (no image to display)

**Case 2: Invalid Image URL**
- Image URL is malformed or points to non-existent resource
- Fetch fails with error
- Error message displayed to user

**Case 3: Network Interruption**
- Image fetch starts but network fails mid-download
- Browser handles retry automatically
- Application shows loading state until timeout

**Case 4: Email API Failure**
- Backend API returns error or times out
- Error message shown in email popup
- User can retry submission
- Application does not block on API failure (allows proceeding)

**Case 5: Web Share API Unavailable**
- Desktop browser or older mobile browser
- Falls back to opening images in new tabs
- User can manually save or share images

**Case 6: LocalStorage Disabled**
- Browser blocks localStorage access
- Email is not remembered between sessions
- Application continues to function normally

---

## 6. Frontend Architecture

### 6.1 Application Structure

```
src/
├── app/
│   ├── components/          # React components
│   │   ├── EmailPopup.tsx   # Email collection modal
│   │   ├── GetImageByEmail.tsx  # Email request button
│   │   ├── ShareButton.tsx  # Social sharing
│   │   ├── EditButton.tsx   # Text editing
│   │   ├── FlippableCardProps.tsx  # Card display
│   │   ├── LoopingText.tsx  # Animated banner
│   │   ├── Header.tsx       # App header with language toggle
│   │   ├── Footer.tsx       # App footer
│   │   └── SubmitButton.tsx # Reusable button component
│   ├── hooks/               # Custom React hooks
│   │   ├── useRemoteImage.ts    # Image fetching logic
│   │   └── useCustomCard.ts     # Card generation logic
│   ├── utils/               # Utility functions
│   │   └── createCardWithText.ts  # Canvas-based card rendering
│   ├── page.tsx             # Main application page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── lib/
│   └── i18n.ts             # Internationalization configuration
└── assets/
    └── LottieFiles/        # Animation assets
```

### 6.2 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.28 | React framework, static export |
| React | 18.2.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| i18next | 25.5.3 | Internationalization |
| react-i18next | 16.0.0 | React i18n integration |

### 6.3 Routing

**Current Implementation:**
- Single-page application (SPA)
- No client-side routing (static export)
- Query parameter-based navigation: `/?image=[url]`

**Route Structure:**
- `/` - Main application page (handles all functionality)

**Query Parameters:**
- `image` - URL of photobooth image to display (required)

**Future Considerations:**
- Potential route: `/view?img=[imageId]` for cleaner URLs
- Potential route: `/error` for error states
- Potential route: `/processing` for offline scenarios

### 6.4 Data Fetching

**Image Fetching:**
- **Hook:** `useRemoteImage`
- **Method:** Direct fetch from URL (provided in query parameter)
- **Format:** Blob (for client-side processing)
- **Error Handling:** Try-catch with error state management
- **Caching:** Browser cache (via CloudFront headers)

**Card Template Fetching:**
- **Hook:** `useCustomCard`
- **Source:** Cloudinary CDN (hardcoded URL)
- **Method:** Fetch as Blob
- **Caching:** Browser cache

**API Calls:**
- **Endpoint:** AWS API Gateway (`/save-email`)
- **Method:** POST
- **Payload:** JSON with email, image metadata
- **Error Handling:** Try-catch with user-facing error messages

### 6.5 State Management

**Local Component State:**
- React `useState` hooks for component-level state
- No global state management library (Redux, Zustand, etc.)

**State Distribution:**
- `page.tsx`: Email submission state, edit text state
- `useRemoteImage`: Image URL, blob, loading, error
- `useCustomCard`: Template blob, custom card blob, loading, error
- `EmailPopup`: Email input, validation, submission state
- `FlippableCard`: Flip state, auto-flip toggle

**Persistent State:**
- `localStorage`: User email address
- `localStorage`: Language preference (via i18next)

**State Flow:**
```
URL Query Parameter → useRemoteImage → imageBlob
                    ↓
User Input → EmailPopup → localStorage → API
                    ↓
User Input → EditButton → editText → useCustomCard → customCardBlob
                    ↓
imageBlob + customCardBlob → FlippableCard → Display
```

### 6.6 Client-Side Processing

**Image Processing:**
- **Canvas API:** Used for text overlay on card template
- **Blob URLs:** Used for in-memory image handling
- **Device Pixel Ratio:** Accounted for high-DPI displays

**Card Generation Pipeline:**
1. Fetch card template (Cloudinary)
2. Load template into Image object
3. Create Canvas with DPR scaling
4. Draw template image
5. Load custom fonts (Arabic/English detection)
6. Render text overlay (multi-line, centered)
7. Render date stamp (right-aligned)
8. Export as PNG Blob
9. Create Blob URL for display

**Performance Optimizations:**
- Blob URLs are revoked after use (memory management)
- Canvas operations are batched
- Font loading is awaited before rendering

---

## 7. API Integration

### 7.1 Endpoints

#### Endpoint: Save Email
- **URL:** `https://m6xzgpv05l.execute-api.us-east-1.amazonaws.com/prod/save-email`
- **Method:** POST
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "email": "visitor@example.com",
    "image_name": "booth_image.png",
    "card_name": "custom_card.png",
    "kiosk_name": "Ramses",
    "filter_name": "default"
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true
  }
  ```
- **Response (Error):**
  ```json
  {
    "success": false,
    "error": "Error message"
  }
  ```

### 7.2 Request/Response Behavior

**Email Submission Flow:**
1. User enters email in `EmailPopup` component
2. Client-side validation (regex pattern)
3. POST request to API Gateway
4. Response handling:
   - Success: Store email in localStorage, dismiss modal
   - Error: Display error message, allow retry

**Email Request Flow (GetImageByEmail):**
1. User clicks "Send via Email" button
2. Retrieve email from localStorage
3. If no email, show alert
4. POST request with same payload structure
5. Success/error handling with user feedback

### 7.3 Error Handling

**Network Errors:**
- Fetch failures (network timeout, DNS error)
- Handled with try-catch
- User sees: "Something went wrong. Please try again."

**API Errors:**
- HTTP error status codes (4xx, 5xx)
- Error message from API response
- User sees: API-provided error message or generic fallback

**Validation Errors:**
- Invalid email format
- Handled client-side before API call
- User sees: "Please enter a valid email address."

**Error Recovery:**
- User can retry submission
- No automatic retry (to prevent spam)
- Application continues to function even if API fails

### 7.4 API Dependencies

**External Services:**
- **AWS API Gateway:** Email submission endpoint
- **Cloudinary CDN:** Card template hosting
- **CloudFront CDN:** Image delivery (via URL parameter)

**Dependency Risks:**
- API Gateway downtime affects email functionality only
- Cloudinary downtime affects card generation
- CloudFront downtime affects image loading
- Application degrades gracefully in all cases

---

## 8. Security Model

### 8.1 Access Control

**Image Access:**
- Images are accessed via URLs in query parameters
- URLs are generated by backend/photobooth system
- **Security Assumption:** URLs contain time-limited tokens or are otherwise secured
- **Current Limitation:** No client-side validation of URL authenticity
- **Recommendation:** Backend should implement signed URLs with expiration

**Email Access:**
- No authentication required for email submission
- Email addresses are collected but not verified
- **Risk:** Malicious users could submit fake emails
- **Mitigation:** Backend should implement rate limiting and email verification

### 8.2 Image Protection

**Current Implementation:**
- Images are fetched directly from CloudFront URLs
- No authentication headers required
- Images are public if URL is known

**Security Considerations:**
- **URL Guessing:** If URLs are predictable, images could be accessed without QR code
- **Recommendation:** Use cryptographically secure, non-sequential image IDs
- **Recommendation:** Implement signed CloudFront URLs with expiration
- **Recommendation:** Add CORS restrictions to CloudFront distribution

**Client-Side Protection:**
- Images are loaded as Blobs (prevents direct URL access in some cases)
- Blob URLs are revoked after use (memory cleanup)
- No image data is stored in localStorage or cookies

### 8.3 QR Link Safety

**QR Code Content:**
- Contains full CloudFront URL to image
- URL is visible in browser address bar
- URL can be shared or bookmarked

**Security Implications:**
- Anyone with the URL can access the image
- URLs should be time-limited (handled by backend)
- URLs should not contain sensitive information

**Best Practices:**
- Use HTTPS only (enforced by CloudFront)
- Implement URL expiration (backend responsibility)
- Monitor for unusual access patterns (backend logging)

### 8.4 Email Security

**Email Collection:**
- Email addresses are submitted via HTTPS
- Email validation on client-side (regex)
- Email validation on server-side (recommended)

**Email Storage:**
- Email stored in browser localStorage (client-side only)
- No server-side session storage
- Email is sent to backend API for processing

**Privacy Considerations:**
- Email addresses are PII (Personally Identifiable Information)
- Backend must comply with data protection regulations
- Email addresses should not be logged in client-side code
- **Current Implementation:** No email logging in frontend code

**Email Delivery:**
- Backend uses AWS SES for email delivery
- Email contains secure link to images
- Link expiration should be implemented (backend)

### 8.5 Client-Side Security

**XSS Prevention:**
- React automatically escapes user input
- No `dangerouslySetInnerHTML` usage
- Text input is sanitized before rendering

**CSRF Protection:**
- Not applicable (no authentication, no cookies)
- API calls are simple POST requests
- Backend should implement CSRF tokens if authentication is added

**Content Security Policy:**
- **Current Status:** Not configured
- **Recommendation:** Implement CSP headers via CloudFront
- **Recommendation:** Restrict inline scripts, external resources

**Dependency Security:**
- Dependencies are managed via npm
- Regular security audits recommended
- Keep dependencies updated

### 8.6 Data Privacy

**Data Collection:**
- Email addresses (explicit user input)
- Language preference (implicit, localStorage)
- No other personal data collected

**Data Storage:**
- Client-side: localStorage (email, language)
- Server-side: Backend database (email, image metadata)

**Data Transmission:**
- All API calls use HTTPS
- No sensitive data in URL parameters (except image URL)
- No data transmitted to third parties (except Cloudinary for template)

**GDPR/Privacy Compliance:**
- **Recommendation:** Add privacy policy link
- **Recommendation:** Add cookie consent (if cookies are added)
- **Recommendation:** Implement data deletion request mechanism

---

## 9. Offline & Deferred Sync Behavior

### 9.1 Current Implementation

**Offline Detection:**
- **Status:** Not implemented
- Application does not detect network connectivity
- Image fetch failures are treated as errors, not offline states

**Retry Mechanism:**
- **Status:** Not implemented
- Failed image fetches do not retry automatically
- User must manually refresh page to retry

**Deferred Sync:**
- **Status:** Not applicable (no local data to sync)
- All data is fetched from remote sources
- No offline queue for API calls

### 9.2 Recommended Implementation

**Offline Detection:**
```javascript
// Recommended: Use navigator.onLine API
if (!navigator.onLine) {
  // Show offline message
  // Disable features requiring network
}
```

**Image Retry Logic:**
- Implement exponential backoff retry
- Retry intervals: 5s, 10s, 20s, 40s (max 4 attempts)
- Show "Processing..." message during retries
- Allow manual retry button

**API Retry Logic:**
- Queue failed API calls (if offline)
- Retry when network is restored
- Show pending state to user

**Service Worker (Future Enhancement):**
- Cache application shell for offline access
- Cache card template
- Show offline fallback page

### 9.3 User Experience During Offline

**Current Behavior:**
- Image fails to load, shows error placeholder
- User can still customize card (template is cached)
- Email submission fails with error message
- No indication that system is processing image

**Recommended Behavior:**
- Show "Image is being processed" message
- Implement auto-retry with progress indicator
- Allow user to request email notification when ready
- Provide estimated wait time (if available from backend)

---

## 10. Error States & UX Handling

### 10.1 Error Categories

#### Network Errors
- **Cause:** Network timeout, DNS failure, connection loss
- **Detection:** Fetch API throws error or returns non-OK status
- **User Message:** "Unable to load image. Please check your connection and try again."
- **Recovery:** Manual page refresh or retry button

#### Image Not Found (404)
- **Cause:** Image URL is invalid or image not yet uploaded
- **Detection:** HTTP 404 status code
- **User Message:** "Image not available. It may still be processing. Please try again in a moment."
- **Recovery:** Auto-retry with exponential backoff (recommended)

#### API Errors
- **Cause:** Backend API failure, rate limiting, validation error
- **Detection:** Non-200 HTTP status or `success: false` in response
- **User Message:** API-provided error message or generic "Failed to save email. Please try again."
- **Recovery:** User can retry submission

#### Validation Errors
- **Cause:** Invalid email format, text too long
- **Detection:** Client-side validation before API call
- **User Message:** Specific validation message (e.g., "Please enter a valid email address.")
- **Recovery:** User corrects input and retries

#### Browser Compatibility Errors
- **Cause:** Missing Web Share API, Canvas API, or other required features
- **Detection:** Feature detection before use
- **User Message:** Graceful fallback (e.g., open images in new tabs instead of share)
- **Recovery:** Fallback behavior is automatic

### 10.2 Error Display Patterns

**Modal Errors:**
- Email popup: Error message displayed below input field
- Edit modal: Validation errors shown inline

**Inline Errors:**
- Image loading: Placeholder with error message
- Card generation: Silent failure (card just doesn't appear)

**Toast/Alert Errors:**
- Share errors: Browser alert (to be replaced with toast)
- API errors: Browser alert in some cases

### 10.3 Error Recovery UX

**Automatic Recovery:**
- Image retry (to be implemented)
- Network reconnection detection (to be implemented)

**Manual Recovery:**
- Page refresh
- Retry button (to be implemented for image loading)
- Re-submit email form

**Graceful Degradation:**
- Web Share API unavailable → Fallback to new tabs
- Canvas unavailable → Show template without text overlay (edge case)
- LocalStorage unavailable → Don't remember email (still functional)

### 10.4 Error Logging

**Client-Side Logging:**
- Console errors logged for debugging
- No error reporting service integrated
- **Recommendation:** Integrate error tracking (Sentry, LogRocket, etc.)

**User-Facing Error Messages:**
- Messages are user-friendly (no technical details)
- Messages are localized (English/Arabic)
- Messages provide actionable guidance

---

## 11. Performance & Scalability Considerations

### 11.1 Performance Optimizations

**Current Optimizations:**
- Static export (no server-side rendering overhead)
- CloudFront CDN for global distribution
- Image optimization via CloudFront
- Blob URL cleanup (memory management)
- Font preloading (via CSS)

**Bundle Size:**
- Next.js code splitting (automatic)
- Tree shaking (removes unused code)
- **Target:** < 500 KB gzipped total bundle

**Image Loading:**
- Lazy loading not applicable (images are required immediately)
- Blob conversion for client-side processing
- No image compression on client (handled by CloudFront)

**Rendering Performance:**
- Canvas operations are optimized (single render per text change)
- React memoization not implemented (consider for heavy components)
- Animation performance: CSS transforms (GPU-accelerated)

### 11.2 Scalability

**Static Hosting:**
- **Unlimited Scale:** S3 + CloudFront handles any traffic volume
- **No Server Bottlenecks:** No application servers to scale
- **Global Distribution:** CloudFront edge locations worldwide
- **Cost Efficiency:** Pay-per-request model

**Concurrent Users:**
- No limit on concurrent users
- Each user session is independent
- No shared state or resources

**Bandwidth:**
- CloudFront handles bandwidth automatically
- Image delivery is optimized (caching, compression)
- Application bundle is cached at edge

**API Scalability:**
- API Gateway + Lambda scales automatically
- Backend handles API load (not frontend concern)
- Frontend makes minimal API calls (one per email submission)

### 11.3 Caching Strategy

**Static Assets:**
- Application bundle: Cached by CloudFront (long TTL)
- Fonts: Cached by browser and CloudFront
- Images: Cached by CloudFront (configurable TTL)
- Card template: Cached by browser (Cloudinary CDN)

**Browser Caching:**
- LocalStorage: Email, language preference
- No service worker caching (to be considered)

**CDN Caching:**
- CloudFront caches all static assets
- Cache invalidation via CloudFront console or API
- Cache headers set by CloudFront configuration

### 11.4 Performance Monitoring

**Metrics to Track:**
- Time to First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Image load time
- API response time
- Error rate

**Tools:**
- **Recommendation:** Google Analytics or similar
- **Recommendation:** Real User Monitoring (RUM)
- **Recommendation:** CloudFront access logs analysis

---

## 12. Monitoring & Logging

### 12.1 Frontend Logging

**Current Implementation:**
- Console logging for errors and debug information
- No structured logging
- No log aggregation service

**Console Logs:**
- Error messages: `console.error()`
- Debug information: `console.log()`
- No sensitive data logged

**Limitations:**
- Logs are only visible in browser console
- No centralized log collection
- No log retention

### 12.2 Error Tracking

**Current Status:**
- No error tracking service integrated
- Errors are logged to console only
- No error alerting or notification

**Recommendations:**
- Integrate error tracking service (Sentry, LogRocket, Rollbar)
- Track JavaScript errors, API failures, image load failures
- Set up alerts for error rate spikes
- Include user context (browser, device, language) in error reports

### 12.3 Analytics

**Current Status:**
- No analytics tracking implemented
- No user behavior tracking

**Recommendations:**
- Implement analytics (Google Analytics, Adobe Analytics, or privacy-focused alternative)
- Track key events:
  - Page views
  - Email submissions
  - Share actions
  - Edit text usage
  - Language toggles
  - Error occurrences
- Respect user privacy (GDPR compliance)

### 12.4 Performance Monitoring

**Current Status:**
- No performance monitoring
- No Real User Monitoring (RUM)

**Recommendations:**
- Implement RUM solution (Google Analytics, New Relic, Datadog)
- Track Core Web Vitals:
  - Largest Contentful Paint (LCP)
  - First Input Delay (FID)
  - Cumulative Layout Shift (CLS)
- Monitor API response times
- Track image load performance

### 12.5 Operational Monitoring

**Backend Monitoring (Not Frontend Responsibility):**
- API Gateway metrics (request count, error rate, latency)
- Lambda function metrics
- DynamoDB metrics
- S3 access patterns

**Frontend-Observable Metrics:**
- CloudFront cache hit ratio (via backend logs)
- Image load success rate (via error tracking)
- User completion rate (via analytics)

---

## 13. Deployment & Environment Configuration

### 13.1 Build Process

**Build Command:**
```bash
npm run build
```

**Build Output:**
- Next.js generates static files in `.next` directory
- Static export creates HTML, CSS, JavaScript files
- Assets are optimized and bundled

**Build Configuration:**
- `next.config.js`: Static export configuration (currently commented out)
- TypeScript compilation
- ESLint validation (optional, via `npm run lint`)

### 13.2 Deployment Architecture

**Hosting:**
- **Primary:** AWS S3 bucket (static website hosting)
- **CDN:** AWS CloudFront distribution
- **SSL:** CloudFront SSL certificate (AWS Certificate Manager)

**Deployment Steps:**
1. Build application: `npm run build`
2. Upload `out/` directory to S3 bucket
3. Invalidate CloudFront cache (if needed)
4. Verify deployment via CloudFront URL

**Deployment Automation:**
- **Recommendation:** CI/CD pipeline (GitHub Actions, AWS CodePipeline)
- **Recommendation:** Automated testing before deployment
- **Recommendation:** Blue-green deployment strategy (if applicable)

### 13.3 Environment Configuration

**Current Configuration:**
- No environment variables used
- API endpoint is hardcoded
- Card template URL is hardcoded

**Hardcoded Values:**
- API Gateway URL: `https://m6xzgpv05l.execute-api.us-east-1.amazonaws.com/prod/save-email`
- Card template URL: `https://res.cloudinary.com/dynfn6e5m/image/upload/v1746278397/uploads/1746278397692.png`

**Recommendations:**
- Move to environment variables:
  - `NEXT_PUBLIC_API_ENDPOINT`
  - `NEXT_PUBLIC_CARD_TEMPLATE_URL`
  - `NEXT_PUBLIC_CLOUDFRONT_DOMAIN`
- Use different values for dev/staging/production

### 13.4 CloudFront Configuration

**Distribution Settings:**
- Origin: S3 bucket
- Default root object: `index.html`
- SSL certificate: AWS Certificate Manager
- Custom domain: Configured (museum domain)

**Caching:**
- Static assets: Long TTL (1 year)
- HTML files: Short TTL or no cache (for updates)
- Cache invalidation: Manual or automated

**Security Headers:**
- **Recommendation:** Add security headers via CloudFront:
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Strict-Transport-Security

### 13.5 Versioning

**Application Versioning:**
- Version in `package.json`: `0.1.0`
- No semantic versioning strategy defined
- No version displayed to users

**Deployment Versioning:**
- **Recommendation:** Tag deployments with version numbers
- **Recommendation:** Include version in build metadata
- **Recommendation:** Display version in application (footer or about page)

**Rollback Strategy:**
- Previous version can be re-uploaded to S3
- CloudFront cache invalidation required
- **Recommendation:** Maintain deployment history in S3 versioning

---

## 14. Testing Strategy

### 14.1 Unit Tests

**Current Status:**
- No unit tests implemented
- No test framework configured

**Recommended Unit Tests:**
- **Hooks:**
  - `useRemoteImage`: Image URL extraction, fetch logic, error handling
  - `useCustomCard`: Template loading, card generation, text updates
- **Utilities:**
  - `createCardWithText`: Canvas rendering, text positioning, date formatting
  - `getImageFromUrl`: Query parameter extraction
- **Components:**
  - `EmailPopup`: Email validation, submission logic
  - `EditButton`: Text length validation, line breaking
  - `FlippableCard`: Flip logic, auto-flip behavior

**Test Framework:**
- **Recommendation:** Jest + React Testing Library
- **Coverage Target:** 80% code coverage

### 14.2 Integration Tests

**Current Status:**
- No integration tests implemented

**Recommended Integration Tests:**
- End-to-end user flows:
  - QR code scan → image load → email submission → share
  - Text editing → card update → display
  - Language toggle → UI update
- API integration:
  - Email submission success/failure scenarios
  - Network error handling
- Image loading:
  - Successful load
  - 404 error
  - Network timeout

**Test Framework:**
- **Recommendation:** Playwright or Cypress
- **Test Environment:** Staging environment with mock backend

### 14.3 User Acceptance Scenarios

**Scenario 1: Happy Path**
1. User scans QR code
2. Email popup appears
3. User enters valid email
4. Image loads successfully
5. Card is generated with default text
6. User edits text
7. Card updates
8. User shares images
9. User requests email delivery
10. All actions complete successfully

**Scenario 2: Offline/Processing**
1. User scans QR code
2. Email popup appears
3. User enters email
4. Image fails to load (404 or timeout)
5. Error message displayed
6. Retry mechanism attempts reload
7. Image eventually loads
8. User proceeds normally

**Scenario 3: Network Error**
1. User scans QR code
2. Email popup appears
3. User enters email
4. Network connection lost
5. API submission fails
6. Error message shown
7. User can retry when connection restored

**Scenario 4: Browser Compatibility**
1. User on desktop browser (no Web Share API)
2. User shares images
3. Fallback behavior: Images open in new tabs
4. User can manually save/share

**Scenario 5: Bilingual Usage**
1. User with Arabic browser language
2. Application loads in Arabic
3. RTL layout applied
4. User toggles to English
5. Layout switches to LTR
6. Language preference saved

### 14.4 Manual Testing Checklist

**Functional Testing:**
- [ ] QR code scan opens application
- [ ] Email popup appears and blocks interaction
- [ ] Email validation works (valid/invalid)
- [ ] Email submission succeeds
- [ ] Image loads from URL parameter
- [ ] Card template loads
- [ ] Text editing works (character limit, line breaks)
- [ ] Card updates when text changes
- [ ] Flippable card displays both images
- [ ] Auto-flip works (3-second interval)
- [ ] Manual flip works (click/tap)
- [ ] Share button works (Web Share API or fallback)
- [ ] Email request button works
- [ ] Language toggle works (EN/AR)
- [ ] RTL layout works for Arabic

**Error Testing:**
- [ ] Missing image parameter shows error
- [ ] Invalid image URL shows error
- [ ] Network error shows appropriate message
- [ ] API error shows appropriate message
- [ ] Email validation prevents invalid submission

**Browser Testing:**
- [ ] Chrome (desktop and mobile)
- [ ] Safari (desktop and iOS)
- [ ] Firefox
- [ ] Edge

**Device Testing:**
- [ ] iPhone (various models)
- [ ] Android phones
- [ ] Tablets (iPad, Android tablets)

### 14.5 Performance Testing

**Load Testing:**
- **Not Applicable:** Static hosting scales automatically
- **Focus:** CloudFront and backend API performance

**Performance Benchmarks:**
- Initial page load: < 2 seconds
- Image load: < 5 seconds
- Card generation: < 1 second
- API response: < 500ms

**Tools:**
- Lighthouse (Chrome DevTools)
- WebPageTest
- Chrome Performance Profiler

---

## 15. Operational Considerations

### 15.1 Maintenance

**Regular Maintenance Tasks:**
- **Dependency Updates:** Monthly review and update of npm packages
- **Security Patches:** Immediate application of security updates
- **Browser Compatibility:** Quarterly testing on new browser versions
- **Performance Monitoring:** Monthly review of performance metrics
- **Error Log Review:** Weekly review of error logs and user feedback

**Code Maintenance:**
- **Refactoring:** As needed, based on code complexity
- **Documentation Updates:** With each feature change
- **Technical Debt:** Track and address regularly

### 15.2 Rollbacks

**Rollback Procedure:**
1. Identify previous stable version
2. Rebuild application from version tag
3. Upload to S3 bucket
4. Invalidate CloudFront cache for all files (`/*`)
5. Verify deployment
6. Monitor for issues

**Rollback Triggers:**
- Critical bugs discovered in production
- Performance degradation
- Security vulnerabilities
- User-reported issues

**Rollback Time:**
- **Target:** < 15 minutes from decision to rollback completion
- **Bottleneck:** CloudFront cache invalidation (can take 5-10 minutes)

### 15.3 Versioning

**Version Strategy:**
- **Semantic Versioning:** MAJOR.MINOR.PATCH
- **Major:** Breaking changes, major feature additions
- **Minor:** New features, non-breaking changes
- **Patch:** Bug fixes, small improvements

**Version Display:**
- **Recommendation:** Display version in application footer
- **Recommendation:** Include version in build metadata
- **Recommendation:** Tag Git commits with version numbers

**Release Notes:**
- **Recommendation:** Maintain changelog
- **Recommendation:** Document breaking changes
- **Recommendation:** Communicate changes to stakeholders

### 15.4 Change Management

**Deployment Process:**
1. Development in feature branch
2. Code review and approval
3. Merge to main branch
4. Automated tests (when implemented)
5. Build and deploy to staging
6. Staging validation
7. Deploy to production
8. Post-deployment verification

**Change Approval:**
- **Minor Changes:** Engineering team approval
- **Major Changes:** Stakeholder approval required
- **Security Changes:** Security team review required

### 15.5 Support & Troubleshooting

**Common Issues:**
- **Image not loading:** Check CloudFront URL, S3 permissions, network connectivity
- **Email submission failing:** Check API Gateway status, rate limits, backend logs
- **Card not generating:** Check Cloudinary URL, Canvas API support, font loading
- **Language not switching:** Check localStorage, i18n configuration, translation files

**Troubleshooting Steps:**
1. Check browser console for errors
2. Verify network requests in DevTools
3. Check CloudFront/S3/API Gateway status
4. Review error logs
5. Test in different browser/device

**Support Escalation:**
- **Level 1:** Frontend team (UI/UX issues)
- **Level 2:** Backend team (API issues)
- **Level 3:** Infrastructure team (AWS/CloudFront issues)

---

## 16. Risks & Mitigations

### 16.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Image URLs are guessable | High | Medium | Implement signed URLs with expiration, use cryptographically secure IDs |
| API endpoint downtime | Medium | Low | Implement retry logic, show user-friendly error messages, queue requests |
| Cloudinary template unavailable | Medium | Low | Cache template in CloudFront, implement fallback template |
| Browser compatibility issues | Low | Low | Feature detection, graceful degradation, polyfills |
| Bundle size exceeds target | Low | Medium | Code splitting, tree shaking, dependency optimization |
| Memory leaks from Blob URLs | Medium | Low | Proper cleanup (URL.revokeObjectURL), monitor memory usage |

### 16.2 Security Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| XSS vulnerabilities | High | Low | React auto-escaping, input sanitization, CSP headers |
| Image URL enumeration | Medium | Medium | Signed URLs, non-sequential IDs, rate limiting |
| Email spam/abuse | Medium | Medium | Rate limiting on backend, email verification |
| Man-in-the-middle attacks | High | Low | HTTPS only, HSTS headers, certificate pinning (if needed) |
| Data privacy violations | High | Low | Privacy policy, GDPR compliance, data minimization |

### 16.3 Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Deployment failures | Medium | Low | Automated testing, staging environment, rollback procedure |
| Cache invalidation delays | Low | Medium | Automated cache invalidation, versioned assets |
| Dependency vulnerabilities | Medium | Medium | Regular security audits, automated dependency updates |
| Performance degradation | Medium | Low | Performance monitoring, optimization, CDN usage |
| Loss of deployment history | Low | Low | Git version control, S3 versioning, deployment logs |

### 16.4 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Poor user experience | High | Low | User testing, UX reviews, error handling |
| Low adoption rate | Medium | Medium | User feedback, analytics, iterative improvements |
| High support burden | Medium | Low | Clear error messages, documentation, self-service |
| Brand reputation damage | High | Low | Quality assurance, security best practices, monitoring |

---

## 17. Future Enhancements

### 17.1 Short-Term Enhancements (0-3 months)

**Error Handling Improvements:**
- Implement image retry mechanism with exponential backoff
- Add offline detection and messaging
- Improve error messages with actionable guidance
- Integrate error tracking service (Sentry)

**Performance Optimizations:**
- Implement service worker for offline support
- Add image lazy loading where applicable
- Optimize bundle size (code splitting, tree shaking)
- Implement React.memo for expensive components

**User Experience:**
- Replace browser alerts with toast notifications
- Add loading skeletons for better perceived performance
- Implement progress indicators for image loading
- Add success animations/feedback

**Testing:**
- Set up unit test framework (Jest + React Testing Library)
- Implement integration tests (Playwright/Cypress)
- Set up CI/CD pipeline with automated testing

### 17.2 Medium-Term Enhancements (3-6 months)

**Feature Additions:**
- Multiple image support (if photobooth captures multiple images)
- Image filters/effects (client-side processing)
- Social media platform-specific sharing
- Download functionality (save images to device)

**Internationalization:**
- Additional language support (French, German, etc.)
- RTL support improvements
- Date/time localization

**Analytics & Monitoring:**
- Implement comprehensive analytics tracking
- Set up Real User Monitoring (RUM)
- Dashboard for operational metrics
- User behavior analysis

**Security Enhancements:**
- Implement Content Security Policy (CSP)
- Add security headers via CloudFront
- Implement signed URL validation (if not in backend)
- Security audit and penetration testing

### 17.3 Long-Term Enhancements (6+ months)

**Advanced Features:**
- User accounts (optional, for repeat visitors)
- Image history/collection
- Print ordering integration
- Augmented reality features
- Social sharing with museum branding

**Infrastructure:**
- Multi-region deployment
- Advanced caching strategies
- Edge computing for image processing
- Progressive Web App (PWA) capabilities

**User Experience:**
- Personalization based on visit history
- Recommendations for other museum experiences
- Integration with museum mobile app
- Accessibility improvements (WCAG AAA compliance)

**Business Intelligence:**
- Visitor analytics dashboard
- Popular image times/patterns
- Language preference trends
- Email delivery success rates

---

## Appendix A: API Reference

### A.1 Save Email Endpoint

**Endpoint:** `POST /save-email`

**Request:**
```json
{
  "email": "string (required, valid email format)",
  "image_name": "string (required)",
  "card_name": "string (required)",
  "kiosk_name": "string (optional)",
  "filter_name": "string (optional)"
}
```

**Response (Success):**
```json
{
  "success": true
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "string (error message)"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad Request (validation error)
- `500`: Internal Server Error

---

## Appendix B: Configuration Reference

### B.1 Environment Variables (Recommended)

```bash
NEXT_PUBLIC_API_ENDPOINT=https://m6xzgpv05l.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_CARD_TEMPLATE_URL=https://res.cloudinary.com/dynfn6e5m/image/upload/v1746278397/uploads/1746278397692.png
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=https://d[distribution-id].cloudfront.net
```

### B.2 Build Configuration

**next.config.js:**
```javascript
const nextConfig = {
  reactStrictMode: true,
  output: "export", // Static export
  images: {
    unoptimized: true, // Required for static export
  },
};
```

---

## Appendix C: Glossary

- **Blob:** Binary Large Object, a data type for handling binary data in JavaScript
- **CDN:** Content Delivery Network, a distributed network of servers for content delivery
- **CORS:** Cross-Origin Resource Sharing, a security mechanism for web requests
- **DPR:** Device Pixel Ratio, the ratio of physical pixels to CSS pixels
- **i18n:** Internationalization, the process of designing software for multiple languages
- **RTL:** Right-to-Left, text direction for languages like Arabic
- **S3:** Amazon Simple Storage Service, object storage service
- **SES:** Amazon Simple Email Service, email delivery service
- **SPA:** Single Page Application, a web application that loads a single HTML page

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | Engineering Team | Initial documentation |

---

**End of Document**

