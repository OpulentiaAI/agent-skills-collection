---
name: producing-agentic-poc-decks
description: Produces outcome-led B2B POC proposal decks for agentic AI/workflow automation opportunities, especially when a user needs a Farnsworth-style deck, sales presentation, pilot/SOW deck, meeting narrative, or editable PPTX that turns technical agents into business outcomes.
---

# Producing Agentic POC Decks

## Use This Skill When

Use this skill to create or revise a consultative POC deck where the buyer has a painful manual workflow, an under-adopted AI/GPT attempt, or a trust gap around data quality, operations, review, compliance, or client deliverables.

The output should be a polished editable `.pptx`, not only a written outline.

## Core Workflow

1. Read the brief, source files, meeting notes, and any prior deck.
2. Read `references/deck-dna.md` before writing the narrative.
3. Read `references/source-discipline.md` before using numbers, ROI claims, citations, or customer quotes.
4. Create the claim spine before building slides:
   - business pain
   - why the current process breaks
   - why a static GPT/prompt is not enough
   - agentic workflow as the operating model
   - measurable pilot path
   - value discussion without invented precision
   - next step / POC commitment
5. Build with `scripts/build_agentic_poc_deck.py` when a native starter deck is useful. Copy and edit the generated PPTX rather than rebuilding boilerplate every time.
6. Compare the output against `assets/reference-farnsworth-agentic-poc-deck.pptx` for rhythm, density, typography, and slide grammar.
7. Render or otherwise inspect the final PPTX. Fix clipped text, stale page markers, contrast issues, and inherited artifacts before delivery.

## Deck Shape

Default to a 14-16 slide deck:

1. Cover: from full-file/manual review to exception review.
2. Executive summary: the customer needs a trusted workflow, not a better prompt.
3. Challenge today: current steps and bottleneck.
4. Sample/evidence review: validated file-level facts.
5. Why bad data gets in / why static GPT cannot keep it out.
6. What to expect: operating change and recurring saving.
7. How success is measured.
8. Technical overview: show agents only after the business problem is established.
9. How we would help: mechanism -> so-that outcome.
10. Opportunity: today versus target state.
11. Implementation options.
12. Engagement / phases.
13. Discovery questions.
14. Potential add-ons.
15. Commitment and next steps.
16. Thank you.

Shorten by combining add-ons/next steps or omitting the technical overview. Lengthen only when the user explicitly asks for appendix-level proof.

## Design System

Use the Farnsworth-style system unless a supplied template overrides it:

- 16:9 widescreen.
- Bright white canvas with very faint gray hairline grid.
- Helvetica Neue or Arial fallback.
- Black headline, dark gray body, light gray metadata.
- Sparse, full-width layouts; white cards with thin black outlines.
- Header: small uppercase section label left, confidential/page marker right.
- Footer: only when it is a source note, business alignment line, or closing identity.
- Avoid decorative gradients, rounded cards, and generic SaaS icon grids.

## Language Rules

- Sell the outcome, not the AI.
- Prefer "trusted workflow", "exception review", "defensible data", "audit trail", "company-wide adoption", "bad respondents never reach a deliverable".
- Use the pattern `mechanism -> so that outcome` whenever technology appears.
- Treat the current GPT respectfully: it surfaced useful signals, but it annotates; agents decide.
- Lead fraud value with incentive leakage, PM labor, and client-trust risk. Do not put unsupported ROI math on the slide.
- Do not say fabricated minute targets. If a target is unknown, put it in Discovery.

## Bundled Resources

- `scripts/build_agentic_poc_deck.py`: editable PPTX generator and code template.
- `assets/example-brief.json`: input brief format for the generator.
- `assets/reference-farnsworth-agentic-poc-deck.pptx`: completed reference deck.
- `references/deck-dna.md`: tone, narrative, slide grammar, and meeting/deck strategy.
- `references/source-discipline.md`: validated fact handling, citation rules, and do-not-say list.
- `references/conversation-distillation.md`: distilled lessons from the Codex deck-building thread and the attached Claude strategy thread.
