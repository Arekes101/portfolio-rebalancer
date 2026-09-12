terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  required_version = ">= 1.5.0"
}

provider "aws" {
  region = "ap-south-1"
}

resource "aws_dynamodb_table" "portfolio" {
  name         = "portfolio-rebalancer"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "portfolioId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "portfolioId"
    type = "S"
  }

  tags = {
    Project = "PortfolioRebalancer"
  }
}