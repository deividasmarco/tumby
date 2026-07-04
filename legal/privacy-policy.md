# Yumly Privacy Policy

**Last updated:** [TODO: insert publish date]

Yumly ("we", "our", "the app") is a feeding-guidance app designed to help parents and caregivers introduce new foods to picky eaters. This policy explains what information Yumly collects, how it's used, and how you can control or delete it.

Yumly is built and operated by an individual developer. There is no advertising network, no analytics SDK, and no data broker involved — the only third-party infrastructure Yumly uses is Google Firebase (Authentication and Cloud Firestore), described below.

---

## 1. Who this app is for

Yumly is intended to be used **by parents and caregivers**, not directly by children. Account registration, food logging, and all settings are operated by an adult on behalf of their child.

## 2. Information we collect

### Account information (provided by the parent)
- **Email address** and **password**, used to create and sign in to your account. Your password is handled entirely by Google Firebase Authentication — we never see or store it in plain text.

### Child profile information (provided by the parent)
- Child's **first name or nickname**
- Child's **age**
- A chosen **avatar emoji**
- Any **food allergies** you choose to flag (optional)

We recommend using a nickname rather than a child's full legal name, though this is entirely your choice.

### App usage data
- Foods added to meal slots, and the **reaction** you log for each (e.g. refused, licked, took a bite, ate some, loved it)
- Dates of food exposures, daily streak count, "buddy" XP/level progress
- Recipes you save

### What we do **not** collect
- No location data
- No camera, microphone, or photo library access
- No advertising identifiers
- No analytics or crash-reporting SDKs of any kind
- No contacts, calendar, or other device data

## 3. How your data is stored

- Your account and all app data (child profile, food logs, meal plans, buddy progress) are stored in **Google Cloud Firestore**, the cloud database behind Google Firebase, which Yumly uses as its backend.
- Your device also keeps a small local cache (via AsyncStorage) of your sign-in session, so you don't have to log in every time you open the app. This local cache does not contain your child's food history — that lives in your account in the cloud so it isn't lost if you reinstall the app or switch devices.

## 4. Third-party processors

Yumly uses **Google Firebase** (Authentication and Cloud Firestore) purely as backend infrastructure to operate the app. Firebase does not receive your data for its own advertising or analytics purposes under this configuration. Google's privacy policy covers how Firebase infrastructure handles data on our behalf: https://policies.google.com/privacy

We do not use any other third-party SDK, analytics platform, or advertising network.

## 5. We do not sell or share your data

We do not sell your data, or your child's data, to anyone. We do not share it with third parties for marketing or advertising purposes. The only place your data is processed is the Firebase infrastructure described above, solely to make the app function.

## 6. Children's Privacy (COPPA)

Yumly is designed for use **by parents and caregivers**, not by children. We do not knowingly collect personal information directly from children:

- Account creation requires an email and password, entered by an adult.
- The child does not interact with sign-up, sign-in, or account settings.
- Child profile information (first name/nickname, age, allergies) is provided voluntarily by the parent, for the sole purpose of personalizing in-app suggestions for that child — it is not used to contact, market to, or identify the child outside the app.

If you believe a child has independently created an account or provided information without parental involvement, please contact us using the details below and we will delete it promptly.

## 7. Your rights and choices

- **Edit:** Child profile details, allergies, and safe foods can be updated any time from within the app.
- **Delete a child's data:** Settings → select a child → Delete this child's data.
- **Delete your entire account:** Settings → Delete Account & All Data. This permanently deletes your account, all children profiles linked to it, and all associated food logs and meal plans from our database. This action cannot be undone.
- **Access/export:** If you'd like a copy of your data outside of deleting it, contact us using the details below.

## 8. Data retention

We retain your account and app data for as long as your account exists. If you delete your account (see above), associated data is deleted from our production database. Some infrastructure backups may persist for a limited period before being purged, after which the data is unrecoverable.

## 9. Security

Account authentication is handled by Google Firebase Authentication, and your data is stored in Cloud Firestore, both of which use industry-standard encryption in transit and at rest. No method of transmission or storage is 100% secure, but we don't store anything beyond what's described in this policy.

## 10. Changes to this policy

If we make material changes to this policy, we'll update the "Last updated" date above and, where appropriate, notify you in the app.

## 11. Contact us

Questions about this policy or your data? Contact: **[TODO: support email]**

---

*This policy describes Yumly's actual data practices as of the date above. If you (the developer) add any new SDK, analytics tool, or third-party service in the future, this document must be updated before the next app store submission.*
