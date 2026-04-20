---
title: "Agent Skills Management"
aliases: [skills, npx-skills]
tags: [tools, productivity, agents]
sources:
  - "daily/2026-04-20.md"
created: 2026-04-20
updated: 2026-04-20
---

# Agent Skills Management

Agent skills are modular extensions that provide specialized knowledge, workflows, and tools to AI agents. They are managed via the `npx skills` CLI.

## Key Commands

- `npx skills add <package>`: Installs a new skill.
- `npx skills find <query>`: Searches for skills on [skills.sh](https://skills.sh/).
- `npx skills list`: Lists installed skills.
- `npx skills update`: Updates installed skills.

## Best Practices

- **Automated Installation**: When installing skills via background commands, use the `-y` (or `--yes`) flag to skip interactive prompts for agent selection.
- **Verification**: After installation, verify the skill content by reading its `SKILL.md` file located in `.agents/skills/[skill-name]/SKILL.md`.
- **Global vs Local**: Skills can be installed globally (`-g`) or locally within a project's `.agents/skills` directory.

## Implementation Details

Skills are typically stored in the project root under `.agents/skills/`. Each skill directory MUST contain a `SKILL.md` file which acts as the instruction manual for the agent.

## Sources

- [[daily/2026-04-20.md]] - Initial session on installing Medusa Admin Dashboard customizations.
