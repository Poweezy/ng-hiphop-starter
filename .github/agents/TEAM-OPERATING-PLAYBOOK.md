# NG Hip-Hop — AI Engineering Team Operating Playbook

## Purpose
This team is designed for the existing `Poweezy/ng-hiphop-starter` repository. It is a set of specialist instructions for use in VS Code agent workflows, not a claim that independent agents are automatically running concurrently.

## Team structure
- Owner: product owner / final decision-maker.
- Project Manager: single delivery coordinator.
- Specialist agents: Architect, UI/UX, Security, Frontend, Backend, Database, Streaming, DevOps/SRE, QA, Performance, Product/Community, Accessibility.
- Independent Code Reviewer: review authority separate from implementation.

## Required repository workflow
1. Start by reading the repository instructions, README, package scripts, current branch and working tree.
2. Never assume the current branch, deployment platform, production environment, or current state of a feature. Verify.
3. Create a baseline audit before modifying code.
4. Work in small, independently reviewable tasks. One implementation owner per task.
5. Avoid concurrent edits to the same files. The Project Manager coordinates file ownership.
6. Use feature branches for substantial work. Do not commit directly to the default branch unless the owner explicitly requests it.
7. Run the relevant tests, lint, typecheck, and build. Report exact commands and actual outcomes.
8. Obtain independent review. Security-sensitive changes also require Security Lead review.
9. Update documentation and project records.
10. Ask the owner before production deployment, destructive data operations, external spending, production secret changes, or material product decisions.

## Phase gates
### Gate 0 — Discovery and baseline
Deliver repository map, current architecture, feature inventory, test/build baseline, deployment assumptions, security threat model, UX audit, risk register, and prioritized backlog. No broad refactoring.

### Gate 1 — Security and data integrity
Resolve verified critical/high findings first. Include session lifecycle, role enforcement, IDOR, rate limiting, upload pipeline, consent, competition rules, transactional consistency, seed safety, and secrets/configuration. Require Security + QA + independent review.

### Gate 2 — Architecture and operations
Approve architecture decisions, migration plan, environment matrix, queue/worker approach, logging, monitoring, backups, and recovery procedures. Do not migrate infrastructure without owner approval.

### Gate 3 — Design system and accessibility
Approve design tokens, typography, responsive navigation, component states, key user journeys, and accessibility acceptance criteria before large-scale UI implementation.

### Gate 4 — Core platform
Implement music discovery, artist/release experiences, player, community, competitions, moderation, and administration in separately testable increments.

### Gate 5 — Release readiness
Complete regression, security, accessibility, performance, backup/restore, operational, and deployment checks. Produce a go/no-go recommendation. Owner authorizes production launch.

## Severity model
- Critical: practical unauthenticated/unauthorized compromise, remote code execution, major data exposure, or irreversible integrity compromise.
- High: significant privilege escalation, sensitive data exposure, abuse path, or serious business logic flaw.
- Medium: bounded security, reliability, or functional issue with meaningful impact.
- Low: limited impact, hardening, or minor defect.
Severity must be justified by evidence and realistic preconditions.

## Mandatory task ticket template
- Goal:
- Current behavior and evidence:
- Desired behavior:
- Scope / out of scope:
- Files likely affected:
- Dependencies:
- Security and privacy impact:
- Data migration / rollback:
- Acceptance criteria:
- Tests required:
- Reviewer(s):
- Owner approval required?:

## Mandatory completion report
- Summary:
- Files changed:
- Acceptance criteria:
- Tests run (exact commands and results):
- Security review:
- QA review:
- Known limitations:
- Migration/deployment notes:
- Rollback plan:
- Remaining risks:
- Approval requested:

## Non-negotiable safety rules
- Never expose or commit secrets, tokens, credentials, private keys, or production data.
- Never run destructive database commands against production.
- Never disable security controls to make tests pass.
- Never fabricate tests, audit results, compliance, or performance claims.
- Never send real campaign email or external notifications from test runs.
- Treat user-generated content and external inputs as untrusted.
- Use synthetic fixtures for tests.
- Ask before adding paid services, material dependencies, analytics trackers, or new data collection.
- Preserve existing features unless an approved ticket changes them.

## First assignment
The Project Manager should convene Architect, Security, QA, UX, and DevOps for a read-only discovery sprint. Produce the baseline deliverables and a prioritized plan. Do not start a wholesale rewrite.
