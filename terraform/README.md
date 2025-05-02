# MindEase Terraform Configuration

This directory contains Terraform configuration to deploy the MindEase application to Vercel.

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) installed on your machine
2. A Vercel account 
3. Google Gemini API key

## Setup Instructions

1. Create a file named `.env.tfvars` with your Gemini API key:
   ```
   gemini_api_key = "your-gemini-api-key-here"
   ```

2. Initialize the Terraform workspace:
   ```
   terraform init
   ```

3. Plan the deployment:
   ```
   terraform plan -var-file=.env.tfvars
   ```

4. Apply the configuration:
   ```
   terraform apply -var-file=.env.tfvars
   ```

## Security Notes

- Keep your `.env.tfvars` file secure and never commit it to version control
- API keys are marked as sensitive in Terraform to prevent them from being displayed in logs
