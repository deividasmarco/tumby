# App Privacy Questionnaire Answers

This documents exactly what Tumby collects and how, based on the actual codebase (audited [TODO: insert date], commit/version 1.0.0). **Use this as the source of truth for both Apple's App Privacy questionnaire and Google Play's Data Safety form.** If you add any new SDK or network call later, update this file before your next submission.

## Summary of network/backend usage

Tumby uses **Google Firebase** as its only backend:
- **Firebase Authentication** — email/password sign-in
- **Cloud Firestore** — stores account, child profile, food log, and meal plan data

There is **no other network call** in the codebase: no analytics SDK, no crash reporting SDK, no advertising SDK, no third-party API calls. (Verified: only `firebase/app`, `firebase/auth` / `@firebase/auth`, and `firebase/firestore` modules are imported anywhere in `src/`.)

A small amount of data (the cached auth session) is stored locally on-device via `@react-native-async-storage/async-storage`, purely so the user doesn't have to log in every app launch. This is not a separate data collection — it's a local cache of the same Firebase session.

---

## Apple App Privacy (App Store Connect) — "Data Used to Track You"

**Answer: No.** Tumby does not track users across apps/websites owned by other companies. No advertising identifiers are collected.

## Apple App Privacy — "Data Linked to You"

| Data type | Category | Collected? | Linked to identity? | Purpose |
|---|---|---|---|---|
| Email address | Contact Info | Yes | Yes | App functionality (account creation/login) |
| User ID (Firebase UID) | Identifiers | Yes | Yes | App functionality |
| Child's first name/nickname | Other Data → User Content | Yes | Yes (linked to parent's account) | App functionality (personalization) |
| Child's age | Other Data → User Content | Yes | Yes | App functionality (personalization) |
| Food reactions/logs, meal plans, streak, XP | Other Data → User Content | Yes | Yes | App functionality |

**Not collected:** Precise/coarse location, Photos/Camera, Contacts, Browsing History, Search History, Financial Info, Health & Fitness data (note: food reaction logs are behavioral/preference data, not biometric or clinical health data — see note below), Identifiers used for advertising, Usage Data for analytics, Diagnostics/crash data.

> **Note on "Health" classification:** Apple's Health & Fitness category is meant for data like steps, heart rate, or clinical health records. Tumby's food-reaction logs (e.g. "child licked broccoli") are user-entered preference/behavior data, not health data — classify under **Other Data / User Content**, not Health & Fitness, unless Apple's reviewer guidance says otherwise for your specific submission.

## Apple App Privacy — "Data Not Linked to You"
None.

## Apple App Privacy — "Data Used for Tracking"
None.

---

## Google Play Data Safety form

**Does your app collect or share any of the required user data types?** Yes.

| Category | Data type | Collected | Shared with 3rd parties | Purpose | Optional? |
|---|---|---|---|---|---|
| Personal info | Email address | Yes | No | Account management | Required (to create account) |
| Personal info | Name (child's first name/nickname) | Yes | No | App functionality | Required (to personalize) |
| App activity | App interactions (food logs, reactions) | Yes | No | App functionality | Required |
| App info and performance | — | No | — | — | — |
| Financial, Location, Photos/Videos, Audio, Contacts, Calendar, Identifiers (ad ID), Device/other IDs | — | No | — | — | — |

**Is data encrypted in transit?** Yes (Firebase Auth + Firestore use HTTPS/TLS).

**Can users request data deletion?** Yes — in-app via Settings → Delete Account & All Data, which deletes the Firebase Auth user and all associated Firestore documents (children, foodLogs, mealPlans).

**Data collection is required for app functionality** (not optional/incidental) since the app requires an account to sync a child's progress.

---

## COPPA / "Designed for Families" note

Tumby is **not** designed for or directed at children — it's a parent-facing tool. Recommended target audience: **Adults**, not the Play Families program, and Apple age rating around **4+** with no objectionable content (the app itself has no content restrictions; the 4+ rating reflects general audience suitability, not that children operate the app independently).

See `store/submission-checklist.md` for the full reasoning on target-audience/category choices.

---

## If you add anything new later

Before your next submission, re-check this list if you add:
- Any analytics or crash-reporting SDK (e.g. Firebase Analytics, Sentry, Crashlytics) → must disclose as "Usage Data" / "Diagnostics," and re-answer the tracking question if it includes cross-app identifiers.
- Push notifications → discloses a device token; usually still "App functionality," not tracking.
- Any ads SDK → changes almost every answer above to "Yes" and likely changes your COPPA/Families risk profile significantly.
