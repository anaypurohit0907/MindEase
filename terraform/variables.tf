variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repository in the format username/repo"
  type        = string
  default     = "yourusername/mindease"
}

# This variable is now only for fallback if .env reading fails
variable "gemini_api_key" {
  description = "Google Gemini API Key for the MindEase application"
  sensitive   = true
  default     = ""  # Add default empty string
}

variable "jenkins_webhook_url" {
  description = "Jenkins webhook URL for CI/CD integration"
  type        = string
  default     = ""
}

variable "vercel_team_id" {
  description = "Vercel team ID (if applicable)"
  default     = ""
}
