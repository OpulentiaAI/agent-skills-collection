# Agent Skills Collection

Curated agent skills aggregated from multiple upstream sources for use with Cursor, Claude, Codex, and other agents that support the [Agent Skills](https://github.com/anthropics/skills) format (`SKILL.md`).

Maintained by [OpulentiaAI](https://github.com/OpulentiaAI).

## Contents

| Path | Source | Description |
|------|--------|-------------|
| [`sources/mongodb-agent-skills/`](sources/mongodb-agent-skills/) | [mongodb/agent-skills](https://github.com/mongodb/agent-skills) | Official MongoDB agent skills (connection, schema design, querying, MCP setup, etc.) |
| [`sources/cursor-pstack-skills/`](sources/cursor-pstack-skills/) | [cursor/plugins `pstack/skills`](https://github.com/cursor/plugins/tree/main/pstack/skills) | Cursor pstack workflow and principle skills |
| [`aws/`](aws/) | [skills.sh](https://skills.sh/) + upstream repos | AWS-focused skills (S3 security, S3 troubleshooting, solution architecture) |

See [`aws/SOURCE.md`](aws/SOURCE.md) for per-skill URLs and install notes.

## Reference documents

| File | Description |
|------|-------------|
| [`docs/Confluence-PTREE-010626-130110.pdf`](docs/Confluence-PTREE-010626-130110.pdf) | Confluence export (PTREE project documentation) |
| [`docs/input-sample-data.zip`](docs/input-sample-data.zip) | Sample input data archive (`Opulent/catalog.zip` and catalog overview) |

## Upstream sources

1. **MongoDB** — https://github.com/mongodb/agent-skills  
2. **skills.sh (AWS)**  
   - https://www.skills.sh/aws/agent-toolkit-for-aws/securing-s3-buckets  
   - https://www.skills.sh/aws/agent-toolkit-for-aws/troubleshooting-s3-files  
   - https://www.skills.sh/alirezarezvani/claude-skills/aws-solution-architect  
3. **Cursor pstack** — https://github.com/cursor/plugins/tree/main/pstack/skills  

## How to use

### Install a single skill (copy into your project)

Copy any skill directory that contains `SKILL.md` into one of your agent skill paths, for example:

- Cursor: `.cursor/skills/<skill-name>/` or user `~/.cursor/skills/`
- Claude Code: `~/.claude/skills/` or project `.claude/skills/`

Example:

```bash
cp -R aws/securing-s3-buckets ~/.cursor/skills/
```

### Install via Skills CLI (skills.sh)

When a skill is indexed by the CLI:

```bash
npx skills add mongodb/agent-skills
npx skills add alirezarezvani/claude-skills --skill aws-solution-architect
```

AWS storage skills under `agent-toolkit-for-aws` live in `skills/specialized-skills/storage-skills/` and may not appear in `npx skills add` listings; use the copies in this repo’s `aws/` folder or copy from [aws/agent-toolkit-for-aws](https://github.com/aws/agent-toolkit-for-aws) directly.

### MongoDB plugin / marketplace

Follow upstream instructions in [`sources/mongodb-agent-skills/README.md`](sources/mongodb-agent-skills/README.md) for Claude, Cursor marketplace, Codex, and Gemini installs.

## Updating this collection

To refresh from upstream:

```bash
# MongoDB
git clone --depth 1 https://github.com/mongodb/agent-skills.git /tmp/mongodb-agent-skills
rsync -a --exclude='.git' /tmp/mongodb-agent-skills/ sources/mongodb-agent-skills/

# Cursor pstack (sparse checkout)
git clone --depth 1 --filter=blob:none --sparse https://github.com/cursor/plugins.git /tmp/cursor-plugins
cd /tmp/cursor-plugins && git sparse-checkout set pstack/skills
rsync -a pstack/skills/ sources/cursor-pstack-skills/

# AWS storage skills
git clone --depth 1 https://github.com/aws/agent-toolkit-for-aws.git /tmp/aws-agent-toolkit
rsync -a /tmp/aws-agent-toolkit/skills/specialized-skills/storage-skills/securing-s3-buckets/ aws/securing-s3-buckets/
rsync -a /tmp/aws-agent-toolkit/skills/specialized-skills/storage-skills/troubleshooting-s3-files/ aws/troubleshooting-s3-files/

# aws-solution-architect
npx skills add alirezarezvani/claude-skills --skill aws-solution-architect -y --copy
```

## License

Each subdirectory retains the license of its upstream repository. Refer to upstream `LICENSE` files where present.

## Packages

Bundled skill packages and migration/analysis workspaces (not upstream mirrors under `sources/`).

| Path | Description |
|------|-------------|
| [`packages/ptree-new-migration-docs-and-skills/`](packages/ptree-new-migration-docs-and-skills/) | PartsTree Catalog DB → Shopware migration: skills, orchestration, discovery artifacts, client-data manifests (no multi-GB BSON in git) |
| [`packages/producing-agentic-poc-decks/`](packages/producing-agentic-poc-decks/) | Agent skill + script to distill conversations into agentic POC deck briefs and generate `.pptx` (reference templates in `assets/`) |

**PTREE:** Large mongodump BSON and `catalog.zip` stay local; checksums and restore notes are in manifests. Top-level [`docs/`](docs/) holds the Confluence PDF and `input-sample-data.zip` (Git LFS) referenced by the migration workflow.

