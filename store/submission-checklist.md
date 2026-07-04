# Yumly — Store Submission Checklist

Architecture note: Yumly uses **Firebase Authentication + Cloud Firestore** as a real backend (accounts, child profiles, food logs, meal plans). It is not a local-only app. Every answer below reflects that.

---

## Apple App Store

- [ ] **App name:** Yumly: Picky Eater Coach — see `store/appstore-description.md`
- [ ] **Subtitle, promotional text, description, keywords** — drafted in `store/appstore-description.md`
- [ ] **Category:** Education (primary) — see reasoning in description doc
- [ ] **Privacy Policy URL** — host `legal/privacy-policy.md`, then paste the URL into App Store Connect → App Privacy AND into `app.json`'s `extra.privacyPolicyUrl`
- [ ] **Age Rating questionnaire** — answer "No" to all content descriptors → 4+ (see description doc for the exact list)
- [ ] **Screenshots** (iPhone only — `supportsTablet: false`):
  - [ ] 6.7" — 1290 × 2796 px
  - [ ] 6.5" — 1242 × 2688 px
  - [ ] 5.5" — 1242 × 2208 px
- [ ] **App Privacy questionnaire** — answer exactly per `store/app-privacy-answers.md`
- [ ] **Support URL / contact email** — set real value (currently `[TODO]` in `src/legal/contact.ts`)
- [ ] **Account deletion** — required by Guideline 5.1.1(v) since Yumly supports account creation. ✅ Implemented: Settings → Delete Account & All Data (deletes Firebase Auth user + all Firestore docs).
- [ ] **App icon** — 1024×1024 px, no alpha/transparency, no rounded corners (Apple adds the mask)
- [ ] **Build number** — bumped per submission (`ios.buildNumber` in app.json, currently `"1"`)
- [ ] **Bundle ID** — `com.yumlyapp.yumly` (set in app.json; confirm it matches your App Store Connect / Apple Developer identifier registration)
- [ ] **TestFlight build** — run `eas build --platform ios` (requires an Expo/EAS account) before first submission

## Google Play

- [ ] **Short description (80 chars) + full description** — drafted in `store/googleplay-description.md`
- [ ] **Data Safety form** — answer exactly per `store/app-privacy-answers.md`
- [ ] **Content rating questionnaire** — target Everyone (see guidance in description doc)
- [ ] **Target audience:** Adults (18+); do **not** enroll in "Designed for Families" — reasoning in description doc
- [ ] **Privacy Policy URL** — same hosted URL as Apple, pasted into Play Console → App content → Privacy policy
- [ ] **Feature graphic:** 1024 × 500 px
- [ ] **Phone screenshots:** 2–8 images, e.g. 1080 × 1920 px
- [ ] **App icon:** 512 × 512 px, 32-bit PNG with alpha
- [ ] **Account deletion:** Play Console now requires a published, easily discoverable account/data deletion path (in-app AND optionally a web form). ✅ In-app path implemented (Settings → Delete Account & All Data). If Play Console's "Account deletion" section asks for a web URL too, you can point it at a contact page or describe the in-app path.
- [ ] **Package name** — `com.yumlyapp.yumly` (set in app.json)
- [ ] **Version code** — bumped per submission (`android.versionCode` in app.json, currently `1`)
- [ ] **AAB build** — run `eas build --platform android` before first submission

## Shared / before either submission

- [ ] Replace every `[TODO]` placeholder across the project:
  - `src/legal/contact.ts` — real support email
  - `app.json` → `extra.privacyPolicyUrl` / `extra.termsUrl` — real hosted URLs (once you publish `legal/privacy-policy.md` and `legal/terms.md`)
  - `legal/privacy-policy.md` / `legal/terms.md` — "Last updated" date + support email
- [ ] Confirm `app.json` bundle ID / package name (`com.yumlyapp.yumly`) is the one you actually want — **this cannot be changed after your first submission** without creating a new app listing
- [ ] Run through onboarding once end-to-end on a real device/simulator: disclaimer step → account creation → child info → allergies → safe foods → Today screen
- [ ] Confirm Settings → Privacy Policy / Terms of Use links open correctly (they'll fail until the URLs above are real)
- [ ] Confirm Settings → Delete Account & All Data actually removes data (check Firestore console after testing)
- [ ] Re-publish `firestore.rules` in the Firebase console (delete permissions were added — see comment at top of that file)
- [ ] Take real screenshots on the required device sizes (simulators are fine for this)

## Things that would get this app rejected — already addressed

- ✅ Medical/health claims — copy uses "helps," "supports," "general guidance," never "cures" or "treats"
- ✅ Missing privacy policy — drafted, just needs hosting + URL
- ✅ Undeclared/unused permissions — none declared in `app.json` (no camera/location/photo usage exists in the code)
- ✅ No account deletion path — implemented in Settings
- ✅ Children's privacy — app is parent-facing; Children's Privacy section included in the policy; target audience set to Adults for Play Store
