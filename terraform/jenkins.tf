# Jenkins server configuration
resource "aws_instance" "jenkins" {
  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2 AMI (adjust for your region)
  instance_type = "t2.micro"
  key_name      = var.ssh_key_name
  
  vpc_security_group_ids = [aws_security_group.jenkins_sg.id]
  
  tags = {
    Name = "jenkins-server"
  }
  
  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo amazon-linux-extras install java-openjdk11 -y
              sudo yum install jenkins -y
              sudo systemctl enable jenkins
              sudo systemctl start jenkins
              
              # Install Docker
              sudo yum install -y docker
              sudo systemctl enable docker
              sudo systemctl start docker
              sudo usermod -aG docker jenkins
              sudo systemctl restart jenkins
              EOF
}

# Security group for Jenkins
resource "aws_security_group" "jenkins_sg" {
  name        = "jenkins-sg"
  description = "Allow Jenkins traffic"
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Output Jenkins URL
output "jenkins_url" {
  value = "http://${aws_instance.jenkins.public_ip}:8080"
}
