# 5. Process and Governance Failures

This section documents how the PartsTree Catalog DB → Shopware migration was governed in practice versus how the gated control plane in `verification-gates.csv`, `agent-batch-launch-plan.md`, and `agentic-migration-execution-strategy.md` prescribes it should run. The evidence is drawn from gate automation (`gate_verdicts.tsv`), the 26-role workstream matrix (`agent-role-results.md` / `.tsv`), open human decisions (`open_decisions.tsv`), and the target-vs-current synthesis (`target-vs-current-state.md`). The intent is historical diagnosis: what process structures were absent or bypassed, and how that correlates with the 3-month plan stretching to nine months of delivery.

## Gated batches were defined but not enforced

The replacement operating model is explicit: **do not start loader agents (Batch D+) until G0–G4 are verified**—access and source freeze, measured source profile, approved mapping contract, Shopware target schema/plugin contract, and dry-run normalization with deterministic hashes and reconciliation. `agent-batch-launch-plan.md` further requires that each batch launch only after the prior batch is **inspected**, not merely summarized, and that child agents return structured verdicts (`VERIFIED`, `NOT_VERIFIED`, `INCONCLUSIVE`) with artifact paths, not narrative self-certification.

In the June 2026 evidence snapshot, automated gate verification (`node agent/scripts/verify-gates.mjs`) reports **5 of 12 gates passing**: G1 (source profile file present), G4 (dry-run summary presence), SETUP, and two REF checks (Confluence PDF and sample zip on disk). **G0, G2, G3, G5, G6, G7, and G8 all fail.** That pattern is consistent with parallel workstreams continuing—or being planned—while upstream contracts remained open:

| Gate | Label | Pass? | What governance required vs what existed |
|------|-------|-------|------------------------------------------|
| G0 | Access and source freeze | FAIL | Live access `ready=false` despite five starter artifact files; DocumentDB deferred; empty `environment_matrix.csv` |
| G1 | Source profile | PASS | `source_profile.json` exists; join report and quality sqlite still missing |
| G2 | Mapping contract | FAIL | Only `mapping-contract-starter.csv`; no `mapping_approval_record.md` |
| G3 | Target schema | FAIL | **0/4** Shopware contract artifacts; no OAuth smoke |
| G4 | Dry-run normalization | PASS | Five dry-run groups summarized; **no** `normalized_payloads/`, hash ledger, or `dry_run_reconciliation.json` |

The Confluence-era program behaved as if **implementation velocity** (transforms, Lambdas, loader sketches) could run in parallel with **contract formation** (mapping rows, target schema proof, sample boundary). The assessment timeline in `assessment-issues-matrix.md` describes the inversion: weeks 1–4 advanced target architecture on paper; months 2–4 churned on transforms while OD-01, missing `assets.bson`, and `meta.*` workflow paths stayed open; months 4–7 proceeded without Shopware OAuth or G3 smoke; months 7–9 reworked stock, publication, and media/IPL gaps that a gated Batch B would have forced earlier.

`agentic-migration-execution-strategy.md` states the 3-month → 9-month slip is consistent with **late discovery** of unresolved decisions, under-profiled source data, incomplete media/IPL inputs, late eventing design, and **insufficient replayable verification**—not slower typing. Process failure here means the **sequence** was wrong: fan-out before freeze.

## Mapping contract never reached approval (G2)

Governance for Phase 2 / Batch B requires `mapping_contract.csv` with **zero blocker rows**, each approved row carrying an owner and Shopware payload path, plus `mapping_approval_record.md` for human sign-off (`verification-gates.csv` G2 pass condition). The Mapping Contract Agent verdict is **BLOCKED**: workspace holds a starter file only; G2 fails in `gate_verdicts.tsv`.

Seventeen rows in `open_decisions.tsv` include **fifteen without assigned owners** at the Project Evidence Agent review. Blocker-tier decisions with direct load impact include:

- **OD-01** — model records → Shopware category vs custom entity (**141,758** of 382,743 models blocked in dry-run).
- **OD-04 / OD-05** — stock fallback when `products.stock` is empty (**973,287** rows) and policy when `quantity_on_hand` is absent (**2,735,879** inventory rows).
- **OD-06** — publication semantics for **438,979** `meta.deleted` and **26,545** unapproved products.
- **OD-17** — whether cataloger workflow flags live under `meta.*` vs top-level `sync`, risking silent mis-load if transforms assume the wrong path.

Without G2, downstream agents cannot honestly classify rows as `READY_TO_LOAD`, `REJECTED_WITH_REASON`, or `DEFERRED_WITH_APPROVAL`. The Normalization Harness Agent correctly reports **BLOCKED** with 323K blocked parts and 141K blocked models, yet aggregate dry-run summaries still allowed **G4 to pass** on presence alone—a governance gap treated in the next section.

The mapping contract unfrozen is not a documentation nit; it is the **permission system** for loaders. Batch D agents (Brand, Category/Model, Product, Inventory, Media/IPL) uniformly record recommended action: **Do not launch loader.**

## Sample data vs production boundary (OD-16)

G1 passed because `source_profile.json` was built from the **opulent-sample-2026-06-01** BSON archive (`REF` gate: sample zip on disk). That is appropriate for local proof but dangerous when interpreted as **production freeze**. Source Snapshot Agent and Source Profile Agent both flag `MEASURED_SAMPLE_NOT_PRODUCTION_FREEZE` and dependency **OD-16**: treat sample as sufficient for G1 vs require live DocumentDB freeze and checksums.

Measured facts from the sample (not estimates) show scale and shape risk:

- **5,142,183** product documents and **3,626,867** inventory rows profiled.
- **No `assets.bson`**, **no `attributes.bson`** in the zip—only `products` and `inventory` plus metadata stubs for incremental assets.
- **355,939** products carry an `ipl` field with **zero** joinable assets in scope.

Process failure: the program could report "we profiled the source" (G1 PASS) while **G0** still deferred live DocumentDB (B-08 / H-03) and **G7** prod cutover had no approved boundary. Prod Load and Prod Verification agents list OD-16 as a gate blocker for false confidence in prod loadability. Governance should have required an explicit **sample boundary record** in `source_snapshot_manifest.json` with `approved=false` until human Migration Lead signed deferral or a production checksum manifest existed. That record was not equivalent to a freeze.

## G4 superficial verification: a false green light

`verification-gates.csv` defines G4's true pass condition as: no UNKNOWN rows; **deterministic** payload generation across reruns; artifacts including `normalized_payloads/`, `migration_ledger.sqlite`, `quality_issue_counts.csv`, and **`dry_run_reconciliation.json`**, owned by Independent Verification Agent.

Automated check detail: `dry-run groups=5; media/IPL blocked=true`. That confirms summaries exist and notes media/IPL blockage—it does **not** prove hash stability, row-level terminal statuses, or reconciliation against blocked counts.

Independent Verification Agent verdict: **BLOCKED**. Issues that would have hit: G4 superficial vs verification-gates true condition; no determinism test; G2/G3 upstream FAIL. Normalization Harness Agent: aggregate dry-run only; **G4 PASS is presence-only**. Data Quality Queue Agent: seven aggregate issue types in `quality-issue-counts.csv` without row-level samples or sqlite ledger—e.g. **2.74M** `quantity_on_hand` bucket not rowed, **439K** deleted / **26K** unapproved without terminal classification tied to mapping.

This is a **governance instrumentation failure**: the gate script rewarded artifact filenames over the verification steps in `verification-gates.csv`. In a post-mortem framing, the organization experienced a **green G4** while Batch C was not `VERIFIED` and Batch D remained correctly blocked—creating tension between automated dashboards and role-level truth.

Recommended corrective action already appears in orchestration docs: tighten `verify-gates.mjs` G4 checks; emit `dry_run_reconciliation.json`; block Batch D until Independent Verification returns `VERIFIED`.

## The 24/26 agents blocked narrative

After profiling all roles in `agent-workstream-matrix.csv` (batches A–F), `agent-role-results.md` summarizes:

| Metric | Value |
|--------|------:|
| Roles profiled | 26 |
| BLOCKED | 24 |
| RISK | 2 |
| READY | 0 |

The two **RISK** (not READY) roles are Source Profile Agent (partial G1 artifacts; sample-not-prod) and Event Contract Agent (paper design possible; G8 0/2; infra ARNs unknown). **Zero** roles are READY to execute their target state without human or upstream gate clearance.

This is not an agent malfunction; it is the **expected output of a control plane working as designed** once evidence is applied. Parallel launch of 26 workstreams without G0–G4 would have produced conflicting artifacts, duplicate mapping guesses, and loader scripts that cannot reconcile to Shopware reads—exactly the rework loops described in months 4–9 of the assessment timeline.

Batch A (discovery): four agents **BLOCKED**—Access/Infra (live access false), Source Snapshot (assets/attributes missing), Target Shopware (0 G3 artifacts), Project Evidence (`next_batch_ready=false`, open decisions unowned). Batch B (contracts): three **BLOCKED**, one **RISK**. Batch C (dry-run build): four **BLOCKED**. Batch D (loaders): six **BLOCKED**, each explicitly instructed not to launch. Batch E (staging/prod): four **BLOCKED**. Batch F (sync): one **RISK**, three **BLOCKED**.

The narrative for leadership: **the matrix is red because governance gates were red**, not because automation failed. Attempting to "unblock" agents without closing H-01–H-10 human items and OD-01–OD-17 domain items would recreate the 9-month failure mode.

## Human decision registry without owners

`blockers_master.md` separates **credential/human-only** blockers (H-01 Shopware OAuth through H-10 Batch F AWS infra) from engineering work that can proceed on sample BSON (E-01–E-08). Project Evidence Agent blocked on **17 open decisions, 15 without owners**, gates G0, G2, G3, G4, G7.

Process gaps:

1. **No Migration Lead / Domain Owner assignment** on `open_decisions.tsv` rows—decisions cannot age out or escalate.
2. **Deferred treated as silent OK** — OD-15 cutover criteria deferred; OD-16 sample boundary open; DocumentDB access deferred without signed scope impact on G8 and prod.
3. **Parent aggregation checklist not operated** — `agent-batch-launch-plan.md` requires inspect artifacts, reject summary-only outputs, cross-check against `verification-gates.csv`, update `gate_verdicts.tsv`, launch next batch only when `VERIFIED` or human-deferred. The June re-run notes **no gate delta** despite role-level BLOCKED unanimity.

`decision-log.tsv` captures the **June 2026 assessment frame** (pstack discipline, BSON profiling, local dry-run without external credentials)—valuable audit trail for how the control plane was *designed*, not evidence that the legacy program operated it for nine months.

## Nine months vs three months: process slip causes

The README states the original migration was **scoped for three months and took nine**. `target-vs-current-state.md` treats that as historical fact. Process and governance failures below map slip causes to evidence (not individual blame):

| Process slip cause | Mechanism | Evidence |
|--------------------|-----------|----------|
| **Parallel work without gates** | Loaders, sync, and transforms proceeded while G0–G3 open | G5–G8 0/2 artifacts; 24/26 BLOCKED; assessment months 2–7 |
| **Contracts after code** | Mapping and target schema unfrozen during implementation churn | G2 starter only; G3 0/4; OD-01 open months 2–4 |
| **Sample mistaken for prod** | G1 pass interpreted as source readiness | OD-16; single `products` collection vs layered Confluence target |
| **Self-certified progress** | Summary JSON and gate presence without reconciliation | G4 PASS vs missing `dry_run_reconciliation.json`; IM-018 class findings |
| **Decision debt** | Domain blockers without owners or approval records | 15/17 open decisions unowned; publication/stock/media rows open |
| **Scope timing** | Batch F / EventBridge before baseline proof | G8 FAIL; Phase 7 in plan but infra ARNs unknown; IM-005 scope row |
| **Independent verification absent** | No target read-back vs payload hashes | Reconciliation agents BLOCKED; dev/staging/prod ledgers missing |

The consulting plan assumed a **known source shape**, **frozen Shopware mapping**, and early parallel loader/sync work. Measured reality—assets gap, hierarchy in one collection, `meta.*` flags, Shopware access never smokes—required **weeks of contract work before any load**. Running nine months without that control plane effectively paid **rework tax** on each discovery that gates G0–G4 were meant to surface in week 1–4.

## What good governance would have changed

If the gated model had been operational from program start:

1. **Batch A stop** until H-01/H-02 filled `environment_matrix.csv` and Shopware OAuth existed—or explicit deferral with scope impact on all Batch D–E roles.
2. **Batch B stop** until OD-01, OD-04–06, and OD-17 produced zero blocker rows in `mapping_contract.csv` and G3 four-artifact bundle existed.
3. **Batch C stop** until G4 required hashes and `dry_run_reconciliation.json`; media/IPL either loadable or `DEFERRED_WITH_APPROVAL` with owner (OD-02/03).
4. **No Batch D launch** until Batch C `VERIFIED`—aligning with current agent-role unanimous BLOCKED recommendation.
5. **OD-16** resolved before any prod narrative: sample boundary signed or production manifest checksumed.

The June 2026 workspace is a **post-hoc control plane**: it makes the failures visible. The nine-month slip is best explained as running a **delivery timeline** (three months) against an **unfrozen problem surface** (mapping, media, access, verification) without the gates that convert discovery into ordered, auditable batches.

## Related artifacts

| Artifact | Role in this section |
|----------|----------------------|
| `verification-gates.csv` | Intended pass conditions G0–G8 |
| `gate_verdicts.tsv` | Automated snapshot 2026-06-02 |
| `agent-role-results.md` / `.tsv` | 24 BLOCKED / 2 RISK / 0 READY |
| `open_decisions.tsv` | Unowned blocker decisions |
| `blockers_master.md` | H-* human vs E-* engineering lanes |
| `agent-batch-launch-plan.md` | Batch inspect-before-launch rules |
| `agentic-migration-execution-strategy.md` | 3→9 month failure mode table |
| `target-vs-current-state.md` | Measured gaps vs Confluence target |
| `assessment-issues-matrix.md` | Timeline of slip by month band |
