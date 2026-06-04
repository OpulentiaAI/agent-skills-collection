# Evidence index — PartsTree → Shopware migration

Generated for Batch A **Project Evidence Agent**. Update when new artifacts land.

Paths are relative to **`ptree-new-migration-docs-and-skills/`** unless noted as repo root (`AltusNova/`).

## Authoritative control plane

| Artifact | Path | Gate / batch |
|----------|------|----------------|
| Agent workstream matrix | `discoveries/matrices/agent-workstream-matrix.csv` | All batches |
| Verification gates | `discoveries/matrices/verification-gates.csv` | G0–G8 |
| Migration workflow | `agent/orchestration/workflow.md` | Phased playbook (loads) |
| Workstream matrix usage | `agent/orchestration/matrix-usage.md` | Role reference only |
| Gate verdicts (machine) | `discoveries/matrices/gate_verdicts.tsv` | All (run `node agent/scripts/verify-gates.mjs`) |

## Confluence / product intent

| Artifact | Path | Themes |
|----------|------|--------|
| Confluence export | `client-data/confluence/Confluence-PTREE-010626-130110.pdf` | Catalog sync, headless storefront, IPL plugin, custom fields, DocumentDB→Shopware mapping, change streams, EventBridge, ongoing sync |
| Catalog overview | Inside `input-sample-data.zip` → `Opulent/partstree_catalog_shopware_overview.md` | Brand→Model→IPL→Parts hierarchy, Shopware as target |
| **Semantic layer** | `discoveries/semantic-layer.md` | Governed metrics, segments, intent registry (INT-*) |
| Self-service guide | `notes/guides/analysis-self-service-guide.md` | Question → metric → answer workflow |
| Source profile (compiled) | `discoveries/profiles/source_profile.json` | Metric values for semantic layer |
| Segment findings | `discoveries/segments/*.md` | Output of `ptree-segment-data-analyst` |
| Intent comparison | `discoveries/intent/intent-comparison-report.md` | Output of `ptree-intent-comparison-analyst` |
| Blocker delay matrix | `discoveries/blockers/blocker-delay-matrix.tsv`, `discoveries/blockers/blocker-delay-narrative.md` | Output of `ptree-blocker-delay-mapper` |

## Source data evidence

| Artifact | Path | Notes |
|----------|------|-------|
| Sample archive | `agent-skills-collection/docs/input-sample-data.zip` (repo root) | Nested `catalog.zip`; see `client-data/sample/README.md` |
| Source snapshot manifest | `client-data/manifests/source_snapshot_manifest.json` | Sample boundary + deferrals |
| Restore proof | `client-data/manifests/restore_proof.md` | Local extract steps |
| Blocker report | `discoveries/blockers/blocker-strategy-report.md` | BSON profile, delay causes |
| Dry-run summary | `discoveries/matrices/local-migration-dry-run-summary.json` | Loadable/blocked counts |
| Dry-run groups | `discoveries/matrices/dry-run-groups.csv` | Per target entity |
| Quality issues | `discoveries/matrices/quality-issue-counts.csv` | DQ queue counts |
| Mapping starter | `discoveries/matrices/mapping-contract-starter.csv` | Not approved contract |
| Decision log | `discoveries/matrices/decision-log.tsv` | pstack audit trail |

## Batch A deliverables status

| Deliverable | Agent | Status |
|-------------|-------|--------|
| `access_matrix.csv` | Access/Infra | Starter (mostly unknown/deferred) |
| `environment_matrix.csv` | Access/Infra | Template |
| `secrets_readiness.md` | Access/Infra | NOT_VERIFIED |
| `quota_limits.md` | Access/Infra | Partial (dry-run sizing only) |
| `source_snapshot_manifest.json` | Source Snapshot | INCONCLUSIVE (checksums pending) |
| `restore_proof.md` | Source Snapshot | INCONCLUSIVE |
| `shopware_schema_snapshot.json` | Target Shopware | Missing |
| `api_smoke_results.json` | Target Shopware | Missing |
| `evidence_index.md` | Project Evidence | This file |
| `open_decisions.tsv` | Project Evidence | Present |

## Open decisions register

See `discoveries/matrices/open_decisions.tsv` — **15 rows without owners** until Human Domain Owner assigns.

## Assessment artifacts (post-mortem 2026-06-02)

| Artifact | Path | Notes |
|----------|------|-------|
| Target-state JSON schemas | `discoveries/assessment/schemas/` | Source, normalized, Shopware, compact sync |
| EventBridge IaC | `discoveries/assessment/infrastructure/eventbridge/template.yaml` | Deployable SAM; local sim available |
| EventBridge simulator | `discoveries/assessment/scripts/simulate_eventbridge.mjs` | No AWS credentials |
| Transform dry-run | `discoveries/assessment/scripts/run_transform_dry_run.mjs` | Real BSON sample limits |
| Assessment verifier | `discoveries/assessment/scripts/verify_assessment.mjs` | Output + error rate checks |
| Issues matrix | `discoveries/matrices/assessment-issues-matrix.md`, `.tsv` | ≥40 rows, 9mo vs 3mo narrative |
| Transform stats | `discoveries/assessment/output/transform_stats.json` | gitignored JSONL outputs |

Run from **AltusNova repo root**:

```bash
node NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/discoveries/assessment/scripts/run_transform_dry_run.mjs
node NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/discoveries/assessment/scripts/verify_assessment.mjs
```

## Skills (unified tree)

| Category | Path | Notes |
|----------|------|-------|
| Index | `agent/skills/README.md` | PTREE generated + reference imports |
| Authoring | `agent/skills/SKILL-AUTHORING.md` | Letta + pstack + PTREE conventions |
| PTREE generated (6) | `agent/skills/ptree-*`, `evidence-driven-migration`, `agentic-migration-orchestration`, `human-escalation-judgment` | Analysis + execution skills |
| Reference pstack | `agent/skills/reference/pstack/` | figure-it-out, show-me-your-work, prove-it-works, interrogate, migrate-callers |
| Reference MongoDB | `agent/skills/reference/mongodb/` | schema-design, connection (BSON profiling) |
| Reference AWS | `agent/skills/reference/aws/` | S3 security/troubleshooting, solution architect |
| Cursor symlinks | `AltusNova/.agent/skills/` | → PTREE generated skills only |

## References (external articles)

| Artifact | Path | Notes |
|----------|------|-------|
| References index | `references/README.md` | Table, demo reading order, attribution |
| Agent Readiness (Factory) | `references/factory-agent-readiness.md` | Repo maturity for autonomous agents |
| Self-service analytics (Anthropic) | `references/anthropic-self-service-analytics.md` | Governed metrics, skills, evals |
| Multi-agents (Cognition) | `references/cognition-multi-agents-working.md` | Single-writer + review patterns |
| Captain vs Build (Capy) | `references/capy-captain-vs-build.md` | Plan/execute agent split |
| Capy April 2026 update | `references/capy-april-2026-update.md` | Captain-only workflow, CI awareness |

## Client-facing notes

| Artifact | Path | Notes |
|----------|------|-------|
| Glossary & findings | `notes/glossary-and-findings.md` | Key terms (Confluence + sample) and measured findings → blockers for demo sponsors |

## Related workspace docs

| Path | Role |
|------|------|
| `AGENTS.md` | Repo agent entrypoint |
| `agent/scripts/run_self_service_analysis.mjs` | Self-service analysis checklist |
| `agent/scripts/verify-gates.mjs` | Gate checker |
