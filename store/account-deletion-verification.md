# Account Deletion — Verification Checklist

Apple (Guideline 5.1.1(v)) and Google Play both require that an account created in-app
can be fully deleted from within the app, removing the account **and** its data. Use this
to confirm Tumby's deletion actually clears everything before submitting.

## Prerequisites (one-time)
- [ ] The `parentId`-based Firestore rules are **published** in the Firebase console
      (see `firestore.rules`). The old `get()`-based rules will fail deletion.
- [ ] Testing with an account created **after** the `parentId` change (fresh account),
      so all its foodLogs/mealPlans carry the `parentId` field.

## Test steps
1. [ ] Register a brand-new account (new email).
2. [ ] Add at least one child, then log 25+ food reactions across meals
       (25+ deliberately exceeds Firestore's ~20-get() limit, proving the rules scale).
3. [ ] Note the values you'll verify afterward:
       - the account's **email** (Firebase Auth → Users)
       - the child doc ID(s) (Firestore → `children`)
4. [ ] In the app: Settings → **Delete Account & All Data** → enter password → **Delete Everything**.
5. [ ] Watch the Metro/Expo console. A successful run logs, in order:
       ```
       [deleteAccount] → reauthenticate ✓
       [deleteAccount] → delete foodLogs for child <id>   removed N foodLogs ✓
       [deleteAccount] → delete mealPlans for child <id>   removed N mealPlans ✓
       [deleteAccount] → delete child doc <id> ✓
       [deleteAccount] → delete user doc ✓
       [deleteAccount] → delete auth user ✓
       [deleteAccount] ✓✓ complete
       ```
6. [ ] App returns to the Welcome/login screen.

## Confirm data is actually gone (Firebase console)
- [ ] **Authentication → Users** — the account's email no longer appears.
- [ ] **Firestore → `users`** — no document for that uid.
- [ ] **Firestore → `children`** — none of that account's child docs remain.
- [ ] **Firestore → `foodLogs`** — query `parentId == <uid>` returns nothing.
- [ ] **Firestore → `mealPlans`** — query `parentId == <uid>` returns nothing.

## Confirm it's usable as a fresh start
- [ ] Re-register with the **same email** succeeds (proves the Auth record was truly deleted,
      not just signed out).

## If it fails
The console line `[deleteAccount] ✗ FAILED at "<step>" — code=<code>` names the exact step:
- `code=permission-denied` on a foodLogs/mealPlans step → rules not published, or account has
  legacy data without `parentId`. Publish rules and test a fresh account.
- `code=auth/requires-recent-login` on the auth step → session too old; the in-app flow now
  re-authenticates with the password first, so this should not occur. If it does, log out and
  back in, then retry.

## For the App Store review notes
You can tell the reviewer:
> "Account deletion is available in-app at Settings → Delete Account & All Data. It requires
> password re-authentication, then permanently deletes the Firebase Auth account and all
> associated Firestore data (profile, children, food logs, meal plans). No data is retained."
