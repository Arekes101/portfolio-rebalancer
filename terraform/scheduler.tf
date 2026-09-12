resource "aws_iam_role" "scheduler_role" {
  name = "portfolio-rebalancer-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "scheduler.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}


resource "aws_iam_role_policy" "scheduler_policy" {
  name = "portfolio-rebalancer-scheduler-policy"
  role = aws_iam_role.scheduler_role.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "lambda:InvokeFunction"
        ]

        Resource = aws_lambda_function.scheduled_analysis.arn
      }
    ]
  })
}


resource "aws_scheduler_schedule" "daily_analysis" {
  name = "portfolio-rebalancer-daily-analysis"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "cron(0 * * * ? *)"

  schedule_expression_timezone = "Asia/Kolkata"

  target {
    arn      = aws_lambda_function.scheduled_analysis.arn
    role_arn = aws_iam_role.scheduler_role.arn
  }
}