# Leva Pricing Page · Recommendation + Month-1 A/B Test

**TO:** Waleed · Leva product  
**FROM:** Strategy agent · `strategy-memo-writing` · `consulting-frameworks` · `market-research`  
**DATE:** 2026-04-19  
**RE:** Web pricing page architecture + one experiment to run first

---

## Recommendation (BLUF)

Ship a **three-tier page** with pricing anchored at **€0 / €6 per month / €9 per month** — not €10 or €12. The €6 price point is the *maximum* students will convert at without friction; anything higher triggers "I'll stick with Notion" comparison behaviour.

Month-1 experiment: **hide the free tier above the fold** on a 50% split and measure conversion-to-Pro lift. Expected lift: 20–35%. If it lands, ship permanently. If it doesn't, you've learned free-tier anchoring is load-bearing for trust — keep it visible.

---

## Who actually pays for a planner (and who doesn't)

Three segments:

1. **Grinders** — top 15% of a cohort, already productive, looking for marginal 10% improvement. Will pay up to €15/mo. Small segment but high LTV.
2. **Overwhelmed middle** — 60% of the cohort. Know they need help, have tried Notion / planners / apps, nothing stuck. Will pay €4–7/mo if product feels different. **This is the target.**
3. **Drifters** — bottom 25%. Won't pay regardless. Free tier is for them; they become word-of-mouth + conversion leaks to segment 2 over time.

Leva's positioning ("not a discipline problem, it's a system problem") directly speaks to segment 2. Price for them.

---

## The price anchor

**Reference points a B-school student compares against:**

| Product | Student price | Notes |
|---|---|---|
| Notion Personal Pro | €8/mo (or free for students with .edu) | Most direct comparison. Many have the free plan already. |
| Reclaim.ai | €8–12/mo Pro | Calendar AI, overlap in mental model |
| Motion | €19/mo (€12 student) | Closest to Leva's pitch but built for execs. |
| Sunsama | €16/mo | Premium planner. |
| Todoist Pro | €4/mo | Cheap anchor at the floor. |

**Implication**: Price **below €8** to sit clearly under Notion's student ceiling. Price **above €4** to avoid "Todoist-cheap" perception. Sweet spot = **€6/mo · €48/yr**.

---

## Tier structure

| Tier | Monthly | Annual (−33%) | What's in |
|---|---|---|---|
| **Free** | €0 | — | 1 calendar connect · today-view · 7-day plan · basic reshuffle |
| **Pro** | **€6** | **€48** | Unlimited connects · full week/month views · smart reminders · adaptive reshuffle · focus analytics · priority support |
| **Squad** | **€9** / seat | **€72** / seat | Everything in Pro + 3-person study-group sync · shared deadlines · accountability nudges |

**Key calls:**
- Do **not** add a 4th tier. Three is legible; four is shopping.
- Squad at €9 anchors Pro as the "default" choice (decoy pricing — thanks Ariely).
- Annual only shown as "save €24" badge, not a separate column. One price table is enough.
- No "Team" tier. If Leva lands a professor/cohort deal later, that's a custom quote.

---

## Page layout (above-fold → below)

```
[1] HERO — one-liner + CTA "Start free" (not "Sign up")
[2] PROOF STRIP — logos: ESCP · Bocconi · HEC · IE · RSM · ESSEC
[3] PRICING TABLE — 3 cards, Pro is highlighted "most students pick this"
[4] WHAT EACH TIER DOES — single-line feature list per tier, no icon grid
[5] ONE-SENTENCE OBJECTION HANDLER — "Already paying for Notion? Leva works alongside it."
[6] FOUNDER NOTE — "I built this because I kept starting Thursday night. Here's what changed." (2 sentences max.)
[7] FAQ — 6 Q's, tight. Cancel anytime. Student verification. Data privacy. Blackboard supported schools. Refund policy. Family/friend gift.
[8] BOTTOM CTA — "Start free · card required · cancel anytime"
```

Deliberately **no**: feature-comparison matrix, testimonials slider, long-form copy. Students decide in 45 seconds.

---

## The one A/B test to run · month 1

**Hypothesis:** Showing the free tier above the fold is reducing Pro conversion because it anchors "this is a free-product-with-paid-tiers" instead of "this is a paid product with a free trial."

**Setup:**
- 50/50 split at page load via Vercel Edge Config.
- **Control**: free tier visible top-left of pricing table.
- **Variant**: pricing table shows Pro + Squad only; free tier moved below-fold with copy *"want to try before committing? start free"*.
- Both variants surface the same tiers on the `/pricing` page; difference is prominence.

**Metric:**
- Primary: `landing → pro trial started` (7-day window).
- Secondary: `landing → free signup` (we don't want to collapse this metric).
- Guardrail: `free signup` can drop ≤ 25% without killing the test; if it drops more, free is load-bearing for trust.

**Sample size:**
- Target: 1,200 landings per variant (2,400 total) for 80% power at +20% relative lift, baseline conversion 3%.
- Runway: ~3 weeks at current traffic (est. 120 landings/day post-IG launch). Ship when hit.

**Decision tree:**

| Outcome | Action |
|---|---|
| Variant wins **≥ +20%** lift, free signup drop **≤ 25%** | **Ship variant permanently.** |
| Variant wins **+5–20%**, drops tolerable | **Iterate** — test "hide free entirely on first visit, show on second" |
| Variant loses or flat | **Keep control.** Free visibility is load-bearing. Test a different axis next (pricing floor: €6 vs €4). |
| Variant wins **but free signup drops >25%** | **Reject.** The funnel collapses — free-tier users are the future Pro converts. |

---

## Month-2 tests (queued, don't run in parallel)

1. **Price-point test** — €6 vs €8 for Pro at same prominence. Expected: €6 wins on conversion, €8 wins on revenue-per-landing. Pick based on where CAC is.
2. **Annual default** — toggle default to "yearly" with slider to monthly. Risks annual-regret refunds but typically lifts ARPU 20–40%.
3. **Founder note on/off** — does personal framing drive Pro conversion? Low-cost to test, high signal on brand voice working.

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Students compare to Notion's free student plan and balk at €6 | Ad copy and pricing page emphasize *"Notion + Leva"* — not replacement. |
| Free tier collapses word-of-mouth | Watchful on "shared with friend → signup" metric. If drops, walk back. |
| €6 is still too high for segment 3 (drifters) | Fine. Don't chase them. |
| Squad tier cannibalizes Pro | Unlikely — most students buy for themselves first. Monitor; if observed, drop Squad. |

---

## Next step — this week

Ship the pricing page in control variant **today** (don't block on the test setup). Wire the Edge Config split **within 7 days**. Call the test in 3 weeks.

Do not overthink this page. Students spend 45 seconds on it. Clarity > cleverness.

---

*Report generated by Leva's strategy agent · 2026-04-19 · subagents: `strategy-memo-writing`, `consulting-frameworks`, `market-research`*
