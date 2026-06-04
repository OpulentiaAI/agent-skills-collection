# PTREE migration skills — unified index

**SSOT:** `ptree-new-migration-docs-and-skills/agent/skills/`  
**Cursor symlinks:** `AltusNova/.agent/skills/` → PTREE generated skills below (edit here only).

## PTREE generated (6)

| Skill | Use when |
|-------|----------|
| [ptree-segment-data-analyst](ptree-segment-data-analyst/SKILL.md) | One catalog domain deep dive → `discoveries/segments/` |
| [ptree-intent-comparison-analyst](ptree-intent-comparison-analyst/SKILL.md) | Plan vs sample → `discoveries/intent/intent-comparison-report.md` |
| [ptree-blocker-delay-mapper](ptree-blocker-delay-mapper/SKILL.md) | Discoveries → timeline → `discoveries/blockers/` |
| [evidence-driven-migration](evidence-driven-migration/SKILL.md) | Contracts, dry-run, load, reconcile |
| [agentic-migration-orchestration](agentic-migration-orchestration/SKILL.md) | Multi-session / multi-agent migration program |
| [human-escalation-judgment](human-escalation-judgment/SKILL.md) | Pause vs proceed before irreversible steps |

Authoring guide: [SKILL-AUTHORING.md](SKILL-AUTHORING.md)

## Reference skills (symlinked)

Imported for patterns and domain helpers — **do not duplicate bodies** in PTREE skills; link by path.

### Pstack (`reference/pstack/`)

| Skill | Upstream |
|-------|----------|
| [figure-it-out](reference/pstack/figure-it-out/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack/skills/figure-it-out) |
| [show-me-your-work](reference/pstack/show-me-your-work/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack/skills/show-me-your-work) |
| [principle-prove-it-works](reference/pstack/principle-prove-it-works/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack/skills/principle-prove-it-works) |
| [interrogate](reference/pstack/interrogate/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack/skills/interrogate) |
| [principle-migrate-callers-then-delete-legacy-apis](reference/pstack/principle-migrate-callers-then-delete-legacy-apis/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack/skills/principle-migrate-callers-then-delete-legacy-apis) |

Attribution: [reference/pstack/SOURCE.md](reference/pstack/SOURCE.md)

### MongoDB (`reference/mongodb/`)

| Skill | Use in PTREE |
|-------|----------------|
| [mongodb-schema-design](reference/mongodb/mongodb-schema-design/SKILL.md) | BSON shape, embed vs reference, profiling vocabulary |
| [mongodb-connection](reference/mongodb/mongodb-connection/SKILL.md) | Connection and monitoring when live DB access exists |

Attribution: [reference/mongodb/SOURCE.md](reference/mongodb/SOURCE.md)

### AWS (`reference/aws/`)

| Skill | Use in PTREE |
|-------|----------------|
| [securing-s3-buckets](reference/aws/securing-s3-buckets/SKILL.md) | Media/CDN bucket hardening |
| [troubleshooting-s3-files](reference/aws/troubleshooting-s3-files/SKILL.md) | Object access and path issues |
| [aws-solution-architect](reference/aws/aws-solution-architect/SKILL.md) | EventBridge / serverless migration topology |

Attribution: [reference/aws/SOURCE.md](reference/aws/SOURCE.md)

## Wiring

```text
AltusNova/.agent/skills/<ptree-skill> → …/agent/skills/<ptree-skill>
```

Reference skills are loaded by path from this tree (`agent/skills/reference/…`); they are not symlinked at repo root unless added explicitly.
