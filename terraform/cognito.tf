resource "aws_cognito_user_pool" "portfolio_users" {
  name = "portfolio-rebalancer-users"

  username_attributes = ["email"]

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  tags = {
    Project = "PortfolioRebalancer"
  }
}


resource "aws_cognito_user_pool_client" "portfolio_client" {
  name = "portfolio-rebalancer-client"

  user_pool_id = aws_cognito_user_pool.portfolio_users.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}


output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.portfolio_users.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.portfolio_client.id
}