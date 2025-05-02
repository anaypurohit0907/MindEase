.PHONY: deploy provision terraform ansible jenkins cleanup

# Load environment variables and execute commands
deploy:
	./scripts/load_env.sh cd ansible && ansible-playbook playbooks/deploy_vercel.yml
	./scripts/cleanup_env.sh

provision:
	./scripts/load_env.sh cd ansible && ansible-playbook playbooks/provision_infrastructure.yml
	./scripts/cleanup_env.sh

terraform:
	./scripts/load_env.sh cd terraform && terraform apply
	./scripts/cleanup_env.sh

ansible:
	./scripts/load_env.sh cd ansible && ansible-playbook $(playbook)
	./scripts/cleanup_env.sh

jenkins:
	./scripts/load_env.sh cd ansible && ansible-playbook playbooks/setup_jenkins.yml
	./scripts/cleanup_env.sh

cleanup:
	./scripts/cleanup_env.sh
