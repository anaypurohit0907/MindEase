pipeline {
    agent any
    
    tools {
        nodejs 'Node16'
    }
    
    environment {
        // These are loaded from Jenkins credentials
        VERCEL_TOKEN = credentials('vercel-api-token')
        GEMINI_API_KEY = credentials('gemini-api-key')
        // No duplication of secrets - we're just binding credentials to environment variables
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup') {
            steps {
                sh 'npm install -g vercel'
                sh 'curl -fsSL https://bun.sh/install | bash'
                sh 'export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH" && bun install'
            }
        }
        
        stage('Lint') {
            steps {
                sh 'export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH" && bun run lint || true'
            }
        }
        
        stage('Build') {
            steps {
                sh 'export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH" && bun run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH" && bun test || true'
            }
        }
        
        stage('Deploy via Ansible') {
            steps {
                withCredentials([
                    string(credentialsId: 'vercel-api-token', variable: 'VERCEL_TOKEN'),
                    string(credentialsId: 'gemini-api-key', variable: 'GEMINI_API_KEY')
                ]) {
                    sh 'cd /home/anay/Desktop/MindEase/ansible && ansible-playbook playbooks/deploy_vercel.yml'
                }
            }
        }
    }
    
    post {
        success {
            echo 'Successfully built and deployed to Vercel!'
        }
        failure {
            echo 'Build or deployment failed!'
        }
        always {
            cleanWs()
        }
    }
}
