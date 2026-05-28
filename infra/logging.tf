variable "proxy_service_name" {
  description = "Cloud Run service name for the proxy"
  type        = string
  default     = "meta-model-analyzer-proxy"
}

# Log-based metric: count of 5xx responses from the proxy
resource "google_logging_metric" "proxy_5xx" {
  project = var.project_id
  name    = "proxy/5xx_count"

  filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.proxy_service_name}\" AND jsonPayload.status >= 500"

  metric_descriptor {
    metric_kind  = "DELTA"
    value_type   = "INT64"
    unit         = "1"
    display_name = "Proxy 5xx Count"
  }
}

# Log-based metric: count of all logged requests from the proxy
resource "google_logging_metric" "proxy_requests" {
  project = var.project_id
  name    = "proxy/request_count"

  filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.proxy_service_name}\" AND jsonPayload.request_id:*"

  metric_descriptor {
    metric_kind  = "DELTA"
    value_type   = "INT64"
    unit         = "1"
    display_name = "Proxy Request Count"
  }
}

# Alert when 5xx rate exceeds 2% of total requests over a 5-minute window
resource "google_monitoring_alert_policy" "proxy_5xx_rate" {
  project      = var.project_id
  display_name = "Proxy 5xx Error Rate > 2%"
  combiner     = "OR"

  conditions {
    display_name = "5xx error rate > 2% over 5 min"

    condition_threshold {
      filter = "metric.type=\"logging.googleapis.com/user/proxy/5xx_count\" AND resource.type=\"cloud_run_revision\""

      denominator_filter = "metric.type=\"logging.googleapis.com/user/proxy/request_count\" AND resource.type=\"cloud_run_revision\""

      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.02

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_RATE"
      }

      denominator_aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  documentation {
    content   = "Proxy 5xx error rate exceeded 2% over 5 minutes. Check Cloud Logging with filter `jsonPayload.status >= 500`."
    mime_type = "text/markdown"
  }

  alert_strategy {
    auto_close = "604800s"
  }
}
