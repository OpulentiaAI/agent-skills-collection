# Source Discipline

## Fact Hierarchy

Use facts in this order:

1. Customer-provided documents, emails, data exports, and decks.
2. Calculations directly reproducible from those files.
3. Clearly labeled assumptions used only for discussion.
4. External/public sources, cited quietly.

Do not invent precision to make a slide feel stronger.

## Farnsworth-Style Validated Numbers

These are examples from the reference deck and Claude/Codex workstream. Use them only when the user's source files match the Farnsworth case or when building the Farnsworth reference deck.

Validated or customer-stated:

- 1,036 respondents in the May 26 closeout-style file.
- 0 recommended exclusions.
- PMs spend 1+ hour reviewing the AI output.
- Cleaning happens a few times a week.
- Routine batches are roughly 50-200 respondents.
- Current custom GPT has not reached company-wide adoption after about a year.
- PMs do not trust the review of open-ended questions enough to skip manual re-review.

Derived from the analyzed file:

- About 3,250 open-ended responses.
- 785 respondents drew open-end concern.
- 557 respondents had moderate-or-higher open-end concern.
- 4 speeders, 35 straightliners, 47 brand inconsistencies caught by rule checks.
- About 841 respondents carried no concerns.
- About 48 respondents were elevated enough to need focused judgment in the working model.

## Do Not Say

Do not say:

- "10-20 minutes" as a promised review time unless the customer supplied that target.
- "Several times a week" if the actual source says "a few times a week"; keep the customer's phrasing.
- A dollar ROI unless loaded PM cost, cycles per week, PM count, incentive per complete, and bad-actor rate are known or explicitly labeled as assumptions.
- "The GPT failed." Say it did not become trusted, adopted decision support.

## Value Framing

Use three value buckets:

1. Incentive leakage: fraudulent completes are paid incentives.
2. PM labor: repeated re-review consumes time every week.
3. Client-trust risk: bad respondents reaching deliverables damages defensibility.

Best slide phrasing:

"The payout has three parts we will size with you in Discovery: incentive dollars paid to fraudulent completes, PM labor to filter them, and client-trust risk if a bad respondent slips through. These are inputs to the conversation, not numbers on the page."

## Citations And Source Notes

For client decks:

- Put quiet source notes in speaker notes, a small bottom source line, or a final appendix if the deck is source-heavy.
- Cite customer-supplied source types without over-explaining: "Source: Robin email, May 2026" or "Source: May 26 Decipher export analysis."
- If using external sources, include title, organization, date, and URL in a source ledger.
- If a number is calculated, store the formula in a source ledger or note.

## Discovery Inputs To Capture

Ask these before pricing or ROI:

- Incentive per complete.
- Estimated bad-actor rate.
- Loaded PM cost.
- Number of PMs.
- Cleaning cycles per week.
- Interim batch, closeout file, or both?
- Which output format should the pilot target first?

## Guardrail For Tech Claims

Every technology claim needs evidence or restraint:

- "Reviews every respondent" is acceptable if the proposed system processes every row.
- "Catches more real fraud" is directional unless validated against a labeled holdout.
- "Learns from every override" is acceptable only if the workflow stores overrides and updates thresholds/rubrics.
- "Bad respondents never reach a deliverable" is aspirational unless framed as the target state.
