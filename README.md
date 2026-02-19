# MindEase

MindEase is a full-stack Next.js application focused on an AI chat experience, with production-grade tooling for monitoring, deployment automation, and infrastructure as code. The repository includes the web app, API routes, an observability stack (Prometheus + Grafana), and automation using Docker, Ansible, Terraform, and Jenkins.

## What this codebase contains

### Web app (Next.js App Router)
- The core UI lives under [src/app](src/app). It uses the App Router with a root layout, global styles, and a main page that renders the chat experience.
- UI components are under [src/components](src/components) and [src/app/components](src/app/components). These cover the chat list, chat input, model selector, message bubbles, loaders, and UI primitives.
- Styling is done with Tailwind CSS and PostCSS, with global styles in [src/app/globals.css](src/app/globals.css).

### API routes
- Server-side API routes live in [src/app/api](src/app/api). These are Next.js route handlers that power chat requests and expose metrics endpoints.
- The chat route integrates with model configuration and formatting utilities in [src/lib](src/lib), while the metrics route supports Prometheus-style scraping.

### Shared libraries and types
- [src/lib](src/lib) contains reusable utilities like API model configuration, content formatting, and metrics helpers.
- [src/types](src/types) contains TypeScript type definitions and custom module declarations.

sing with [postcss.config.mjs](postcss.config.mjs).

### Backend and APIs
- Next.js Route Handlers for API endpoints.
- TypeScript for server-side logic and type safety.
- Internal utilities under [src/lib](src/lib) for model configuration, response formatting, and metrics.

### Observability
- Prometheus for scraping application metrics.
- Grafana for dashboards and visualization.
- Docker Compose for running the monitoring stack locally.

### Infrastructure and CI/CD
- Docker and Docker Compose for containerization.
- Terraform for infrastructure provisioning.
- Ansible for server configuration and deployments.
- Jenkins for CI/CD pipelines.

## Key paths at a glance
- App entry and layout: [src/app](src/app)
- API routes: [src/app/api](src/app/api)
- UI components: [src/components](src/components)
- Shared libraries: [src/lib](src/lib)
- Types: [src/types](src/types)
- Monitoring configs: [prometheus.yml](prometheus.yml), [grafana/provisioning](grafana/provisioning)
- Infrastructure: [terraform](terraform), [ansible](ansible)
- CI/CD: [Jenkinsfile](Jenkinsfile)

## Notes
- The repository includes scripts for provisioning and verifying monitoring and metrics. Review the scripts before running them in production environments.
- Infrastructure state files are present under [terraform](terraform); treat them as sensitive and avoid committing updated state if you are working in shared environments.
