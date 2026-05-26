terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "meta-model-analyzer"
}

variable "region" {
  description = "GCP region — must match Cloud Run service region"
  type        = string
  default     = "us-central1"
}

# Firestore database in Native mode, same region as Cloud Run
resource "google_firestore_database" "default" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  # Enables point-in-time recovery (7-day window)
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_ENABLED"

  delete_protection_state = "DELETE_PROTECTION_ENABLED"
}

# TTL policy on rate_limits.expireAt — Firestore auto-prunes documents
# where expireAt < now (evaluated periodically, typically within 24 h).
resource "google_firestore_field" "rate_limits_ttl" {
  project    = var.project_id
  database   = google_firestore_database.default.name
  collection = "rate_limits"
  field      = "expireAt"

  ttl_config {}

  depends_on = [google_firestore_database.default]
}

# Composite index: spend collection — range query by document ID (date key)
# The __name__ range query in spend.ts uses the default single-field index,
# but this index is defined explicitly for documentation and portability.
resource "google_firestore_index" "spend_date_range" {
  project    = var.project_id
  database   = google_firestore_database.default.name
  collection = "spend"

  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }

  depends_on = [google_firestore_database.default]
}
