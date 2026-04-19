# UGC Creative · Content Ops Playbook

_How I run batched AI-driven UGC ad creative for DTC brands. Internal reference doc for briefs, angles, delivery, QC._

## The premise

DTC brands on Meta/TikTok need fresh creative **weekly, not monthly**. Traditional agencies ship 4 creatives in 3 weeks for €8k. I ship **20 in 48 hours for €1k** using AI image gen + design sensibility + a structured angle library. Quality is 80% of a studio shoot, at 15% of the cost and 5% of the time. Trade-off: you can't use it for national TV. You can use it for everything else.

## The 4 core creative angles

Every batch tests these. One brand might lean harder into one vs. another, but the angles are MECE.

**1. Product-story** — still life of the product in its world. Marble counter, gym floor, cafe table. No model. No copy on the image. Caption does the work. Aesthetic: editorial catalog.

**2. Problem-hook** — POV or split-screen that activates the pain the product solves. "Your morning currently" vs "Your morning on X." No model faces; just scenes.

**3. UGC-testimonial** — a person mid-action using the product. Phone-filmed energy, hand-held, slightly imperfect, first-person. The "one my friend sent me" look.

**4. Lifestyle** — the customer's aspirational world with the product present but not the hero. Identity sell: "people who buy this live like this."

20-creative batch = 5 per angle.

## Brief intake · the 8 questions

Before I start any batch:

1. **Who buys this** (one sentence, not demographics)
2. **What does it replace** (what are they switching from — not just competitors, but habits)
3. **Three real reviews** (quotes from actual customers, words they used)
4. **Current winning creative** (whatever's running best right now — I mirror the feeling, vary the execution)
5. **Forbidden territory** (claims I can't make, aesthetics that feel off-brand)
6. **Platform** (Meta feed / IG reel / TikTok / all three — changes aspect ratios)
7. **Deadline** (first batch delivered within X hours of brief)
8. **Success metric** (CTR vs. CVR vs. ROAS — I write the hook differently for each)

Kickoff is 20–30 min on Zoom. I transcribe. I send back the 4 angles in writing within 24 hours.

## Production stack

| Layer | Tool | Why |
|---|---|---|
| Image generation | **Pollinations.ai** (free, Flux under the hood) for samples; **Replicate + Flux 1.1 Pro** for client work (€0.04/image) | Quality ceiling is Flux 1.1 Pro. Schnell for drafts. |
| Text / typography overlay | **Satori** (React → SVG → PNG) | Pixel-perfect, exports sharp type |
| Post / grade | **ImageMagick** CLI batch | Unified look across the batch |
| Final export | ffmpeg + ImageMagick | 1:1 / 4:5 / 9:16 from one master |
| Delivery | Folder per brand + naming convention | `BRAND_ANGLE_HOOK_RATIO_v1.jpg` |

## Prompt anatomy (every image)

```
[subject + product]
[specific setting with textures named]
[lighting direction — "soft morning light through window"]
[colour palette — 2–3 specific colours]
[style — "editorial commercial photography" / "ugc instagram style" / "minimalist menswear catalog"]
[negatives — "no text, no logo, no crop"]
```

Always specify negatives. Always specify lighting. Never leave aesthetic to "creative" or "beautiful" — those words mean nothing to the model.

## Hook library — what goes on the creative

Text overlays I rotate through. Each hook is paired with one of the 4 angles.

**Problem-hooks** (pair with Angle 2):
- "Your morning, currently."
- "If this is you…"
- "[Product] is what I use now instead of [old behaviour]"
- "I gave up on [old category]. Here's why."

**Product-story hooks** (pair with Angle 1):
- "The only [category] I don't get bored of"
- "[Number] days. One [product]."
- "Small container, entire shelf replaced"

**UGC hooks** (pair with Angle 3):
- "Found what I was looking for"
- "Three weeks in. Not going back."
- "My girlfriend noticed first"
- "POV: you finally fixed [problem]"

**Lifestyle hooks** (pair with Angle 4):
- "Slow mornings, cold coffee"
- "Saturday uniform"
- "This is the life we wanted, turns out"

Rule: one hook per creative. Never two lines of text on a single ad unit. Breaks mobile scroll.

## Quality bar · what fails review

Before a creative ships to client:

- [ ] **Clear at 240px wide** — thumb on phone, arm's length. If hook is unreadable, redo.
- [ ] **First 1.5 seconds** — can the product + promise land without reading the caption? If no, redo.
- [ ] **No licensed IP** — celebrity faces, brand logos not belonging to client, movie/sports references.
- [ ] **No extremities** — gore, sexual content, political content, minors.
- [ ] **Model faces** that look obviously AI-generated (melted ears, hands with 6 fingers, dead eyes) — regenerate.
- [ ] **Colour grade** matches the batch — inconsistent creatives look unprofessional.
- [ ] **Aspect ratios correct** — 1:1 for IG feed, 4:5 for IG feed-preferred, 9:16 for reels/stories/TikTok.
- [ ] **File naming** matches convention so the client can find it in ad manager.

## Delivery

**Folder structure**:
```
brand-q2-batch-1/
├── 01-product-story/
│   ├── aura_ps_6am-different_1x1.jpg
│   ├── aura_ps_6am-different_4x5.jpg
│   └── aura_ps_6am-different_9x16.jpg
├── 02-problem-hook/
├── 03-ugc-testimonial/
├── 04-lifestyle/
├── brief.pdf (original brief)
├── angle-rationale.pdf (why these angles)
└── hook-log.csv (every hook, every ratio, seed, prompt)
```

Shared via Dropbox link or Google Drive shared folder. Client downloads, uploads to their ad manager, labels their tests. I hold back nothing — source images + prompts + seeds all go with the delivery so they can reproduce or iterate without me.

## Reviewing performance · the week-2 call

Two weeks after delivery:

1. Pull the client's ad manager data. Best performer by CTR, by CVR, by ROAS.
2. Identify which **angle** won (not which specific creative — the pattern).
3. Identify which **hook** won (pattern again).
4. Draft batch 2 to double down on the winning axes.

I don't bill for this call. It's built into the subscription.

## What this isn't

- Not video production. Those 9:16 exports are stills for reels, not video reels. Video is a separate (larger) offering.
- Not strategic brand positioning. I take your brand as-is and execute creative within it. If your brand direction is the problem, we do a separate engagement.
- Not ad media buying. I produce the assets; you (or your agency) run them.

## Pricing logic

- **€1,000 one-off** — profitable at ~3 hours of my time. Mostly a test-the-water offer.
- **€2,500/mo standard** — 2 batches, one weekly-ish review. True sweet spot for a brand doing €15–50k/mo ad spend.
- **€5,000/mo scale** — 4 batches, dedicated Slack, 24h turnaround. For €30k+/mo spend where creative fatigue is measurable.

Cost structure: €80–120/batch in API credits (Replicate Flux Pro × 80 images per batch). Margin is the rest.

## What to always ask yourself before batching

> "If this creative showed up in my own feed, would I stop scrolling?"

If the answer is no for more than 2 of 20, redo those. The whole reason this works is creative quality + quantity. Lose quality, lose the margin over agencies. Lose quantity, lose the speed advantage over solo designers.

---

_Maintained by Waleed · last update April 2026._
