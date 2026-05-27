# Perfect Reveal Planners

Static customer website with a Firebase-backed review submission and owner approval dashboard.

## Firebase Setup

1. Create a Firebase project and register a Web App in the Firebase console.
2. Create a Cloud Firestore database.
3. Open **Authentication > Sign-in method** and enable **Email/Password**.
4. In **Authentication > Users**, create the owner account that will sign in at `admin.html`.
5. Copy the Web App `firebaseConfig` values into `js/firebase-config.js`.
6. In Firestore, create an `admins` collection and add a document whose document ID is the owner's Firebase Authentication UID. The document can contain `{ "role": "owner" }`.
7. Publish the rules in `firestore.rules` from the Firestore **Rules** tab, or deploy them with the Firebase CLI:

```sh
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

8. Sign into `admin.html` and choose **Import Existing Website Reviews** once to bring the reviews from `data/reviews.json` into Firestore.

## Data Flow

- Customers submit reviews from `index.html` into the private `reviewSubmissions` collection with `status: "pending"`.
- The dashboard only loads for authenticated users listed in `admins/{uid}`.
- Approving a submission publishes a copy without the customer's email to `publishedReviews`.
- The customer page reads `publishedReviews`. Until Firebase has published reviews, it displays the existing `data/reviews.json` entries.

## Security

`firestore.rules` prevents public access to submitted email addresses and restricts moderation to administrator accounts. For a public launch, enable Firebase App Check for the web app to reduce automated/spam submissions.

Firebase documentation:

- https://firebase.google.com/docs/web/setup
- https://firebase.google.com/docs/firestore/manage-data/add-data
- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/firestore/security/get-started
