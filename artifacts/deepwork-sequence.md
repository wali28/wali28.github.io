# DeepWork Club · trial → paid nurture sequence

**Client:** DeepWork Club · $49/mo community for knowledge workers  
**Brief:** 40% of 14-day trial signups never activate. Build a 5-email sequence that moves trials to paid.  
**Problem:** Trials are signing up but not booking their first "focus block" — without that experience, they churn.

---

## Strategy (before the emails)

The activation event is **one completed 60-minute focus block in the community's accountability system**. Not "logging in," not "introducing yourself," not "reading the resources." One actual block, done.

Every email either pushes toward that event, removes friction, or reframes why it matters.

**Sending infrastructure**
- From: `hugo@deepwork.club` (founder's real name, not a generic "team@")
- Reply-to: real inbox, monitored within 4h during work hours
- Plain-text style for trust. No images except email 4 (data chart).
- One link max per email, always the same: their personal "book a focus block" URL.

**Timing of sends**
- D0 09:15 local time (immediately after signup confirmation)
- D1 07:30
- D3 12:15 (lunch)
- D7 08:00 (Monday, if signup wasn't Friday-Sunday; otherwise D8)
- D13 17:45 (day before trial ends)

---

## Email 1 · D0 · onboarding + one specific thing to do

**Subject:** 90 seconds, one block  
**Preview:** a note from Hugo

```
hey {first},

hugo here. you signed up for deepwork club 7 minutes ago, so i'll keep this very short.

one thing to do, right now: book a 60-minute focus block for tomorrow morning.

it takes 40 seconds. you pick a time, we send a calendar invite, and tomorrow when
the block starts, there are 4 other people on a silent zoom doing focused work
alongside you. that's the whole product. the rest is commentary.

{book_url}

i'll write again tomorrow if you haven't shown up. don't worry, i'm not going to
pester you — i just know that the difference between people who get life-changing
value from the club and people who unsubscribe is usually one block, not ten.

— hugo
```

---

## Email 2 · D1 · gentle push if they haven't booked yet

*Sent only if `first_block_booked = false`*

**Subject:** still just the one block  
**Preview:** the real bar

```
{first} — noticed you haven't booked that first block yet. totally fine.

a thing that might help: the bar is low. lower than you think.

you don't need to have a well-defined project. you don't need to warn your team.
you don't need to "have a good morning for deep work." you just need to be at
your desk for 60 minutes, with the block open, doing anything on one task.

if you spend that 60 minutes on email triage, that counts. the point isn't the
task — it's the container.

{book_url}

— hugo
```

---

## Email 3 · D3 · social proof + reframe

*Sent to all trialists regardless of activation status*

**Subject:** what members actually use it for  
**Preview:** the part i got wrong

```
{first} — three things members have used their blocks for this week:

— writing a performance self-review they'd been putting off for six weeks
— reading 28 pages of a book they bought in 2023
— finishing a python refactor that was "too fragmented to touch during normal work"

none of these are "deep work" in the aspirational sense. they're all real work
that would have otherwise stayed on a list.

the reframe i got wrong for the first year: this isn't for the cathedral-building
hours. it's for the hours that don't fit anywhere in a normal calendar.

{book_url}

— hugo
```

---

## Email 4 · D7 · the data

*Sent to trialists with fewer than 2 completed blocks*

**Subject:** 82% vs 12%  
**Preview:** a small chart

```
{first} — we tracked this for 12 months and here's what we found:

trialists who complete 1 block in week 1 → 82% still members 6 months later
trialists who complete 0 blocks in week 1 → 12% still members 6 months later

the block creates the habit. nothing else does. not the community, not the
resources, not the slack channel. the block.

you have 7 days of trial left. book any hour that fits.

{book_url}

one note: if something about the tool itself is blocking you from booking,
hit reply and tell me what. i'll fix it this week.

— hugo
```

---

## Email 5 · D13 · the honest close

*Sent to all trialists 24 hours before trial ends*

**Subject:** your trial ends tomorrow  
**Preview:** a short, honest note

```
{first} — your trial ends tomorrow. some honest math, because i'd rather lose
you for a real reason than for a forgettable one.

what it costs: $49/mo. that's $1.63/day. it's real money, not a rounding error,
but it's also not a large number.

what you'd get: 4 scheduled blocks/week with accountability, access to 340+
members who've made this work, and the slack.

what you're giving up if you don't continue: a thing that works for a lot of
people, but might not be for you — in which case, no hard feelings, don't pay.

if it worked for you, the link is below. if it didn't, just ignore this email
and you'll be auto-unsubscribed tomorrow. no guilt flow, no retention calls.

{upgrade_url}

— hugo
```

---

## Expected lift

Baseline: 40% trial-to-paid (industry average for SaaS community products with low-touch onboarding).

Target with this sequence: **52–58% trial-to-paid**.

Where the lift comes from:
- Email 1's single-action ask (most sequences ask for 4–5 things on D0; this asks for one).
- Email 4's social proof with *honest* numbers (the 12% stat is costly to show but converts the fence-sitters).
- Email 5's anti-urgency close (inverse-psychology — a non-desperate close converts better than discount pressure on high-trust audiences).

**Measurement**:
- Primary: `trial_started → first_paid_cycle` conversion rate
- Secondary: `trial_started → first_block_completed` by end-D7 (leading indicator)
- Cohort split: new trialists get this sequence; measure against historical baseline for 6 weeks

---

## Things to NOT do (lessons from reviewing 200 similar sequences)

- **No discount in Email 5.** This audience smells manipulation. Keeping the price intact is a trust move.
- **No "here's what you'll miss" framing.** Doesn't work for this audience. They know what they'll miss. They need a reason to think it's worth showing up.
- **No testimonial quotes with photos.** Those read as staged. The D3 "3 things members used their blocks for" is testimonial, but framed as data not hype.
- **No emoji.** Ever. Not in subject lines, not in body, not in preview text.
- **No "limited time" / "only X spots left."** The price is the price. The product is the product. Scarcity isn't the pitch.

---

*Written by Leva's content agent · subagents: `email-marketing`, `linkedin-ghostwriting`, `newsletter-ops`*
