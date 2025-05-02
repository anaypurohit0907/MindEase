terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.11.4"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

provider "aws" {
  region = var.aws_region
}

locals {
  # Get API key from environment variable
  gemini_api_key = var.gemini_api_key
  
  # Generate Ansible inventory
  jenkins_ip = aws_instance.jenkins.public_ip
  ansible_inventory = templatefile("${path.module}/templates/inventory.tpl", {
    jenkins_ip = local.jenkins_ip
  })
}

# Vercel project resource
resource "vercel_project" "mindease" {
  name      = "mindease"
  framework = "nextjs"
  
  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  # Configure the project to use Bun instead of npm
  build_command   = "bun run build"
  install_command = "bun install"
  # Removed development_command as it's not supported

  # Environment variables reference
  environment = [
    {
      key    = "GEMINI_API_KEY"
      value  = local.gemini_api_key
      target = ["production", "preview", "development"]
    }
  ]
}

# Vercel deployment resource
resource "vercel_deployment" "mindease_production" {
  project_id  = vercel_project.mindease.id
  production  = true
  ref         = "main" # Specify the branch/ref to deploy
}

# Output the deployment URL
output "deployment_url" {
  value = vercel_deployment.mindease_production.url
}

# Generate Ansible inventory file
resource "local_file" "ansible_inventory" {
  content  = local.ansible_inventory
  filename = "${path.module}/../ansible/inventory.ini"

  depends_on = [aws_instance.jenkins]
}

# Run Ansible playbook using environment variables from .env file
resource "null_resource" "run_ansible" {
  depends_on = [local_file.ansible_inventory, aws_instance.jenkins]

  provisioner "local-exec" {
    command = "cd ${path.module}/../ansible && ansible-playbook playbooks/setup_jenkins.yml"
    environment = {
      ANSIBLE_CONFIG = "${path.module}/../ansible/ansible.cfg"
      # Environment variables are automatically inherited from the parent process
    }
  }
}
