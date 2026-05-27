import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let app: App
let db: Firestore

export function getFirestoreClient(): Firestore {
  if (db) return db

  if (getApps().length === 0) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required')
    }

    // On Cloud Run, Application Default Credentials are injected automatically.
    // Locally, set GOOGLE_APPLICATION_CREDENTIALS to a service-account key file.
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    app = credentialsPath
      ? initializeApp({ credential: cert(credentialsPath), projectId })
      : initializeApp({ projectId })
  } else {
    app = getApps()[0]
  }

  db = getFirestore(app)
  // Use the named database if provided (default is '(default)')
  const databaseId = process.env.FIRESTORE_DATABASE_ID
  if (databaseId && databaseId !== '(default)') {
    db = getFirestore(app, databaseId)
  }

  return db
}
