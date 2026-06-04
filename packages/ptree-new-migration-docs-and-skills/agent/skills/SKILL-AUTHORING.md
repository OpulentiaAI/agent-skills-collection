# Skill authoring — PTREE package

Merged guidance from [Letta creating-skills](https://github.com/letta-ai/letta-code/tree/main/src/skills/builtin/creating-skills), [Cursor pstack](https://github.com/cursor/plugins/tree/main/pstack/skills), and this repo's analysis contract.

## Frontmatter (required)

```yaml
---
name: skill-name          # lowercase, hyphens; must match directory name
description: …            # third person; WHAT + WHEN/trigger keywords (max ~1024 chars)
---
```

Only `name` and `description` drive auto-selection — make triggers explicit ("Use when…", "not for…").

## Body structure (PTREE convention)

Keep RECREATE prompt tone: readable prose, no gate theater.

| Section | Purpose |
|---------|---------|
| **When to use** | Triggers and task types |
| **When not to use** | Route to sibling skill |
| **Inputs** | Paths under `discoveries/`, `client-data/` |
| **Outputs** | Deliverable paths |
| **Principles** | 3–5 bullets; cite pstack by **path** (`reference/pstack/…`), don't paste whole skills |
| **Workflow** | Short prose sequence — not a 20-step rubric |
| **Evidence** | Confluence PDF + `source_profile.json` for analysis; artifacts + read-back for execution |

Optional: **Related** links to other skills and master brief.

## Letta patterns to follow

- **Concise is key** — context is shared; challenge every paragraph's token cost.
- **Progressive disclosure** — keep SKILL.md lean; put schemas and long references in `references/` subfolders.
- **Degrees of freedom** — high freedom for analysis judgment; low freedom for load order and idempotency.
- **Imperative voice** in instructions ("Read the profile", not "You should read").
- **Anti-patterns:** README/CHANGELOG inside skill dirs; duplicating reference material in PTREE skills; verbose explanations the model already knows.

## Pstack patterns to weave (by reference)

| Pattern | Reference skill | PTREE use |
|---------|-----------------|-----------|
| Auditable playbook | `reference/pstack/figure-it-out` | Large multi-phase work with no narrower skill |
| Decision trail | `reference/pstack/show-me-your-work` | `discoveries/matrices/decision-log.tsv` |
| Verify real artifacts | `reference/pstack/principle-prove-it-works` | Profile paths, reconciliation, not self-report |
| Stress-test claims | `reference/pstack/interrogate` | Adversarial caveats on PASS/PARTIAL |
| Migration sequencing | `reference/pstack/principle-migrate-callers-then-delete-legacy-apis` | Callers/contracts before deleting legacy paths |

Do **not** copy full pstack bodies into PTREE skills — link and apply lightly.

## Testing / validation

Before treating a skill as done:

1. **Trigger test** — description alone should distinguish from sibling skills (segment vs intent vs blocker).
2. **Path test** — every input/output path exists or is documented as created by the skill.
3. **Evidence test** — analysis skills never cite gate JSON as primary proof; execution skills require artifact paths.
4. **Symlink test** — from repo root: `test -f .agent/skills/<name>/SKILL.md` for wired PTREE skills; `test -f agent/skills/reference/.../SKILL.md` for reference links.
5. **Tone test** — read against `RECREATE-ANALYSIS-AGENT-PROMPT.md` Part 6; sponsor-facing, not internal jargon.

## Adding a new PTREE skill

1. Create `agent/skills/<name>/SKILL.md` with frontmatter + sections above.
2. Add row to `agent/skills/README.md`.
3. Symlink: `AltusNova/.agent/skills/<name>` → package path (relative from `.agent/skills/`).
4. Update `RECREATE-ANALYSIS-AGENT-PROMPT.md` Part 7 if agents should discover it.
5. Update `notes/evidence_index.md` if the skill produces indexed artifacts.

## Further reading

Package-level summaries (not skill bodies)—see [`references/README.md`](../../references/README.md):

- [Anthropic self-service analytics](../../references/anthropic-self-service-analytics.md) — governed metrics, pairwise skills, eval maintenance (maps to `semantic-layer.md` and analysis skills).
- [Factory Agent Readiness](../../references/factory-agent-readiness.md) — repo feedback loops and docs before scaling agents.
- [Cognition multi-agents](../../references/cognition-multi-agents-working.md) — single-writer orchestration; review with clean context.
- [Capy Captain vs Build](../../references/capy-captain-vs-build.md) — planner vs executor boundaries for analysis vs load skills.

## Reference imports

Copy or symlink upstream skills under `agent/skills/reference/{pstack,mongodb,aws}/`. Add `SOURCE.md` with upstream URL. Prefer symlinks when disk is tight; paths must resolve from the symlink location (six `../` from `reference/<vendor>/<skill>` to repo root).
