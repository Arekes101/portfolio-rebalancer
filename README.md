````markdown
# Portfolio Rebalancing Bot

A serverless cloud-based portfolio monitoring and rebalancing recommendation system built using AWS, React, Node.js, TypeScript, Terraform, and external market-data APIs.

The application allows users to manage a portfolio containing Indian stocks, US stocks, and cryptocurrencies. It retrieves market prices, calculates current portfolio allocation, compares it with the user's target allocation, and generates rebalancing recommendations when significant deviations occur.

The system also supports scheduled portfolio analysis and automated email alerts.

---

## Features

- User registration and login
- Portfolio creation and management
- Support for Indian stocks
- Support for US stocks
- Support for cryptocurrencies
- Add, edit, and delete holdings
- Configure target allocation for each holding
- Live market valuation
- USD to INR currency conversion
- Portfolio allocation analysis
- Automatic rebalancing recommendations
- Configurable 5% allocation deviation threshold
- Email alert configuration
- Test email functionality
- Scheduled portfolio analysis
- Automated email notifications
- Serverless AWS architecture
- Infrastructure as Code using Terraform
- Cloud-based frontend deployment using S3 and CloudFront

---

# System Architecture

```text
                         ┌──────────────────┐
                         │       User       │
                         └────────┬─────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │     CloudFront      │
                       │    React Frontend   │
                       └──────────┬──────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │         S3          │
                       │  Static Frontend    │
                       └─────────────────────┘


                    Authentication
                         │
                         ▼
                ┌──────────────────┐
                │ Amazon Cognito   │
                │ User Login/Auth  │
                └────────┬─────────┘
                         │
                         ▼
                   ┌───────────┐
                   │ API Gateway│
                   └─────┬─────┘
                         │
                         ▼
                   ┌───────────┐
                   │   Lambda  │
                   │ API Backend│
                   └─────┬─────┘
                         │
              ┌──────────┼───────────┐
              │          │           │
              ▼          ▼           ▼
         ┌─────────┐ ┌─────────┐ ┌─────────┐
         │DynamoDB │ │ Market  │ │   SES   │
         │         │ │  APIs   │ │  Email  │
         └─────────┘ └────┬────┘ └─────────┘
                          │
                 ┌────────┼────────┐
                 │        │        │
                 ▼        ▼        ▼
             BharatStock Alpha   CoinGecko
                         Vantage
````

---

# Scheduled Analysis Architecture

```text
                  ┌──────────────────────┐
                  │ EventBridge Scheduler│
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Scheduled Lambda     │
                  │                      │
                  │ Portfolio Analysis   │
                  └──────────┬───────────┘
                             │
                             ▼
                       ┌───────────┐
                       │ DynamoDB  │
                       └─────┬─────┘
                             │
                             ▼
                       Market APIs
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Rebalancing Engine   │
                  └──────────┬───────────┘
                             │
                    Deviation Detected?
                         /       \
                       No         Yes
                       │           │
                       ▼           ▼
                     Stop        Amazon SES
                                    │
                                    ▼
                                User Email
```

---

# Application Flow

```text
User
 │
 ▼
Login / Register
 │
 ▼
Create Portfolio
 │
 ▼
Add Holdings
 │
 ▼
Set Target Allocations
 │
 ▼
Save Changes
 │
 ▼
Analyze Portfolio
 │
 ▼
Fetch Market Prices
 │
 ├── Indian Stocks → BharatStock
 │
 ├── US Stocks → Alpha Vantage
 │
 └── Crypto → CoinGecko
 │
 ▼
Convert USD Assets to INR
 │
 ▼
Calculate Portfolio Value
 │
 ▼
Calculate Current Allocation
 │
 ▼
Compare With Target Allocation
 │
 ▼
Generate Recommendation
 │
 ├── INCREASE
 │
 ├── HOLD
 │
 └── REDUCE
 │
 ▼
Display Results
```

---

# Rebalancing Logic

```text
Current Value = Quantity × Current Market Price
```

```text
Total Portfolio Value =
Sum of Current Value of All Holdings
```

```text
Current Allocation =
(Current Value / Total Portfolio Value) × 100
```

```text
Deviation =
Current Allocation - Target Allocation
```

The default deviation threshold is **5 percentage points**.

```text
Deviation > +5%
       ↓
    REDUCE

Deviation < -5%
       ↓
   INCREASE

-5% ≤ Deviation ≤ +5%
       ↓
     HOLD
```

The system calculates a suggested rebalancing amount but does not execute actual trades.

---

# Supported Assets

### Indian Stocks

Market prices are retrieved using BharatStock API.

Examples:

```text
RELIANCE
TCS
INFY
```

Prices are handled in INR.

### US Stocks

Market prices are retrieved using Alpha Vantage.

Examples:

```text
AAPL
MSFT
GOOGL
AMZN
```

Prices are returned in USD and converted to INR.

### Cryptocurrency

Market prices are retrieved using CoinGecko.

Examples:

```text
BTC
ETH
SOL
```

Prices are returned in USD and converted to INR.

---

# Currency Conversion

The application uses INR as the base currency.

For USD-denominated assets:

```text
USD Asset Price × USD/INR Exchange Rate
                    =
              INR Asset Price
```

The USD/INR exchange rate is retrieved using Alpha Vantage.

---

# AWS Services

| AWS Service           | Purpose                |
| --------------------- | ---------------------- |
| Amazon Cognito        | User authentication    |
| API Gateway           | REST API entry point   |
| AWS Lambda            | Backend application    |
| DynamoDB              | Portfolio data storage |
| EventBridge Scheduler | Scheduled analysis     |
| Amazon SES            | Email notifications    |
| Amazon S3             | Frontend hosting       |
| CloudFront            | Frontend delivery      |
| IAM                   | Access control         |
| CloudWatch            | Logging and monitoring |
| Terraform             | Infrastructure as Code |

---

# Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS
* Amazon Cognito SDK

### Backend

* Node.js
* Express.js
* TypeScript
* Axios
* AWS SDK

### Infrastructure

* Terraform

### External APIs

* BharatStock
* Alpha Vantage
* CoinGecko

---

# API Endpoints

| Method | Endpoint                             | Purpose             |
| ------ | ------------------------------------ | ------------------- |
| POST   | `/portfolio`                         | Create portfolio    |
| GET    | `/portfolio/:id`                     | Get portfolio       |
| POST   | `/portfolio/:id/holdings`            | Add holding         |
| PUT    | `/portfolio/:id/holdings`            | Save holdings       |
| DELETE | `/portfolio/:id/holdings/:symbol`    | Delete holding      |
| POST   | `/portfolio/:id/analyze`             | Analyze portfolio   |
| GET    | `/portfolio/:id/settings`            | Get email settings  |
| PUT    | `/portfolio/:id/settings`            | Save email settings |
| POST   | `/portfolio/:id/settings/test-email` | Send test email     |

---

# DynamoDB Data Model

The portfolio table uses:

```text
Partition Key:
userId

Sort Key:
portfolioId
```

A portfolio contains:

```text
userId
portfolioId
name
holdings
email
emailAlertsEnabled
alertTime
```

Each holding contains:

```text
symbol
assetType
quantity
targetAllocation
```

---

# Email Alert System

Users can configure:

```text
Email Alerts: ON / OFF
Alert Time: Selected Hour
```

The scheduler periodically checks portfolios.

An alert is generated when:

1. Email alerts are enabled.
2. The portfolio contains holdings.
3. Target allocations total 100%.
4. At least one holding exceeds the deviation threshold.

The email contains the rebalancing suggestions.

---

# Project Structure

```text
portfolio-rebalancer/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── finance/
│   │   ├── market/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.ts
│   │   ├── lambda.ts
│   │   ├── scheduler.ts
│   │   └── server.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── terraform/
│   ├── lambda.tf
│   ├── dynamodb.tf
│   ├── cognito.tf
│   ├── api_gateway.tf
│   ├── eventbridge.tf
│   ├── ses.tf
│   ├── frontend.tf
│   ├── variables.tf
│   └── ...
│
├── .gitignore
└── README.md
```

---

# Local Development

## Backend

```bash
cd backend
npm install
npm run dev
```

Backend:

```text
http://localhost:3000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# Production Deployment

The application is deployed using AWS and Terraform.

```text
Source Code
     │
     ├───────────────┐
     │               │
     ▼               ▼
Backend Build    Frontend Build
     │               │
     ▼               ▼
 Lambda ZIP        dist/
     │               │
     ▼               ▼
 Terraform ─────────┘
     │
     ▼
 AWS Infrastructure
```

---

# Backend Deployment

Build the backend:

```bash
cd backend
npm run build
```

Create the Lambda deployment package:

```powershell
Compress-Archive -Path dist,node_modules,package.json -DestinationPath ..\terraform\lambda.zip -Force
```

Deploy using Terraform:

```bash
cd ../terraform
terraform apply
```

---

# Frontend Deployment

Build the production frontend:

```bash
cd frontend
npm run build
```

This generates:

```text
frontend/dist/
```

Terraform uploads the generated files to Amazon S3.

CloudFront then serves the frontend over HTTPS.

Deploy using:

```bash
cd ../terraform
terraform apply
```

---

# Terraform Deployment

Initialize Terraform:

```bash
cd terraform
terraform init
```

Check the infrastructure plan:

```bash
terraform plan
```

Deploy:

```bash
terraform apply
```

To destroy the infrastructure:

```bash
terraform destroy
```

The infrastructure can be recreated using:

```bash
terraform init
terraform apply
```

This makes the AWS environment reproducible through Infrastructure as Code.

---

# Security

Sensitive information must never be committed to GitHub.

The following should remain local:

```text
.env
terraform.tfvars
*.tfstate
lambda.zip
```

API keys and AWS credentials must never be hardcoded into the source code.

---

# Limitations

The current system provides portfolio monitoring and rebalancing recommendations.

It does not:

* Execute real trades
* Connect to brokerage accounts
* Predict future stock prices
* Use machine learning for predictions
* Perform automated buying or selling
* Provide guaranteed investment returns
* Provide real-time trading functionality
* Provide a mobile application

The recommendations are informational and should not be considered financial advice.

---

# Future Improvements

* Broker API integration
* Automated trade execution
* Historical portfolio performance
* Portfolio performance charts
* Additional market-data providers
* More cryptocurrency support
* Multiple portfolios per user
* Advanced notification channels
* CI/CD using GitHub Actions
* Automated Terraform deployment
* Improved monitoring and alerting

---

# Conclusion

The Portfolio Rebalancing Bot demonstrates a complete cloud-native financial monitoring application using a serverless AWS architecture.

The project combines:

* Full-stack development
* REST API development
* Authentication
* Database management
* External API integration
* Financial calculations
* Scheduled processing
* Email notifications
* Serverless cloud deployment
* Infrastructure as Code

Terraform enables the AWS infrastructure to be recreated consistently without manually configuring every service.

```
```
