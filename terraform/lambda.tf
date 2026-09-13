resource "aws_iam_role" "lambda_role" {
  name = "portfolio-rebalancer-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "lambda.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "portfolio-rebalancer-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Scan",
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]

        Resource = [
          aws_dynamodb_table.portfolio.arn,
          "arn:aws:ses:ap-south-1:*:identity/*"
        ]
      }
    ]
  })
}


# Main API Lambda
resource "aws_lambda_function" "portfolio_api" {
  function_name = "portfolio-rebalancer-api"

  role = aws_iam_role.lambda_role.arn

  runtime = "nodejs22.x"
  handler = "dist/lambda.handler"

  filename = "${path.module}/lambda.zip"

  source_code_hash = filebase64sha256(
    "${path.module}/lambda.zip"
  )

  timeout = 30

  environment {
    variables = {
      BHARATSTOCK_API_KEY   = var.bharatstock_api_key
      ALPHA_VANTAGE_API_KEY = var.alpha_vantage_api_key
    }
  }
}


# Scheduled analysis Lambda
resource "aws_lambda_function" "scheduled_analysis" {
  function_name = "portfolio-rebalancer-scheduled-analysis"

  role = aws_iam_role.lambda_role.arn

  runtime = "nodejs22.x"
  handler = "dist/lambda.scheduledHandler"

  filename = "${path.module}/lambda.zip"

  source_code_hash = filebase64sha256(
    "${path.module}/lambda.zip"
  )

  timeout = 60

  environment {
    variables = {
      BHARATSTOCK_API_KEY   = var.bharatstock_api_key
      ALPHA_VANTAGE_API_KEY = var.alpha_vantage_api_key
      ALERT_EMAIL           = var.alert_email
    }
  }
}


# API Gateway
resource "aws_apigatewayv2_api" "portfolio_api" {
  name          = "portfolio-rebalancer-api"
  protocol_type = "HTTP"
}


resource "aws_apigatewayv2_integration" "lambda" {
  api_id = aws_apigatewayv2_api.portfolio_api.id

  integration_type = "AWS_PROXY"

  integration_uri = aws_lambda_function.portfolio_api.invoke_arn

  payload_format_version = "2.0"
}


resource "aws_apigatewayv2_route" "default" {
  api_id = aws_apigatewayv2_api.portfolio_api.id

  route_key = "$default"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}


resource "aws_apigatewayv2_stage" "default" {
  api_id = aws_apigatewayv2_api.portfolio_api.id

  name = "$default"

  auto_deploy = true
}


resource "aws_lambda_permission" "api_gateway" {
  statement_id = "AllowAPIGatewayInvoke"

  action = "lambda:InvokeFunction"

  function_name = aws_lambda_function.portfolio_api.function_name

  principal = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.portfolio_api.execution_arn}/*/*"
}


# Allow EventBridge Scheduler to invoke scheduled Lambda
resource "aws_lambda_permission" "eventbridge" {
  statement_id = "AllowEventBridgeInvoke"

  action = "lambda:InvokeFunction"

  function_name = aws_lambda_function.scheduled_analysis.function_name

  principal = "scheduler.amazonaws.com"
}


output "api_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}