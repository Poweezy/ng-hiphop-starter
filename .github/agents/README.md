# NG Hip-Hop AI Agent Team

14 specialist VS Code agent definitions plus a team operating playbook.

## Install
Copy the `agents/` directory contents into your repository's `.github/agents/` directory, or use the included folder as the source when configuring your VS Code custom agents.

Suggested destination:

```text
your-repository/
  .github/
    agents/
      ng-hiphop-project-manager.agent.md
      ng-hiphop-solution-architect.agent.md
      ...
```

The files in this bundle are named by role; rename them to the `ng-hiphop-*.agent.md` convention if desired. Keep `TEAM-OPERATING-PLAYBOOK.md` at the repository root or under `docs/project/`.

## Start
1. Open the repository in VS Code.
2. Add the agent files under `.github/agents/`.
3. Start with `ng-hiphop-project-manager`.
4. Give it the First Assignment in `TEAM-OPERATING-PLAYBOOK.md`.
5. Require a read-only baseline audit before authorizing implementation.

These are agent instruction files. They do not automatically create a running multi-agent service; invoke/orchestrate them through the agent capabilities available in your VS Code setup.
