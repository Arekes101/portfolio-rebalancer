resource "aws_ses_email_identity" "sender" {
  email = var.alert_email
}

