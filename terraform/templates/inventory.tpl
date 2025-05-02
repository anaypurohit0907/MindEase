[jenkins]
jenkins_server ansible_host=${jenkins_ip} ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa

[local]
localhost ansible_connection=local
