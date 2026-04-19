# ESCP Finance Society · Notion workspace spec

**Client:** ESCP Finance Society · Paris/Turin/Berlin  
**Brief:** 120 members, 20 events/semester. Currently tracking in Excel (breaks every other week). Need a Notion workspace for events, speakers, sponsors, budgets, and a weekly newsletter tracker.  
**Must haves:** Single source of truth · less than 2 days to migrate from current Excel · usable by non-technical board members · no monthly cost.

---

## Workspace structure · 8 connected databases

```
🏛 ESCP Finance Society
│
├── 🏠 Home (hub page)
│   ├─ "this week" view
│   ├─ upcoming events
│   ├─ pending decisions
│   └─ quick-capture form
│
├── 📅 Events (database)
├── 👥 Speakers (database)
├── 🏢 Sponsors (database)
├── 💰 Budget (database)
├── 📧 Newsletter (database)
├── ✅ Tasks (database)
├── 🗂 Resources (database)
└── 👤 Members (database)
```

---

## Database schemas

### 📅 Events

| Property | Type | Notes |
|---|---|---|
| Title | text | e.g. "Alumni Fireside · April 24" |
| Date | date | |
| Campus | select | Paris / Turin / Berlin / Online |
| Status | select | Idea · Confirmed · Promoted · Done · Cancelled |
| Attendees (goal) | number | |
| Attendees (actual) | number | |
| Speaker | relation → Speakers | |
| Sponsors | relation → Sponsors (multi) | |
| Tasks | relation → Tasks (multi) | |
| Budget items | relation → Budget (multi) | |
| Total cost | rollup of Budget.Amount | sum |
| Total sponsor revenue | rollup of Sponsors.Contribution | sum |
| Net P/L | formula | `prop("Total sponsor revenue") - prop("Total cost")` |
| Debrief doc | page | nested page for notes |

**Views:**
- **This semester** — calendar view by Date, this semester filter
- **Status board** — board grouped by Status
- **P/L table** — table sorted by Date DESC with Total cost, Revenue, Net P/L

### 👥 Speakers

| Property | Type |
|---|---|
| Name | title |
| Company + role | text |
| Email | email |
| LinkedIn | URL |
| Type | select (Alumni · Practitioner · Academic · Student) |
| Events spoken | relation ← Events (auto) |
| Speaker fee | number |
| Contacted by | person |
| Status | select (Target · Pitched · Confirmed · Spoken · Declined) |
| Follow-up date | date |
| Notes | long text |

### 🏢 Sponsors

| Property | Type |
|---|---|
| Company | title |
| Tier | select (Principal €5k+ · Supporter €1-5k · Partner in-kind) |
| Contact person | text |
| Email | email |
| Status | select (Lead · Pitched · Signed · Invoiced · Paid · Ended) |
| Contract start / end | dates |
| Contribution (€) | number |
| Events associated | relation ← Events (multi) |
| Sponsor responsibilities | multi-select |

### 💰 Budget

Single database for line items across all events.

| Property | Type |
|---|---|
| Line item | title |
| Event | relation → Events |
| Category | select (Venue · Catering · Marketing · Travel · Speaker fee · Misc) |
| Amount | number |
| Paid? | checkbox |
| Receipt | file |
| Paid by | person |
| Reimbursed? | checkbox |

### 📧 Newsletter

| Property | Type |
|---|---|
| Issue N° | number |
| Send date | date |
| Subject line | text |
| Features | multi-select |
| Events covered | relation → Events |
| Opens | number |
| Clicks | number |
| Open rate | formula `prop("Opens") / 120` |
| Status | select (Draft · Ready · Sent) |
| Draft page | page |

### ✅ Tasks

Used across events + operations. Generic.

| Property | Type |
|---|---|
| Task | title |
| Event | relation → Events (nullable) |
| Owner | person |
| Due | date |
| Status | select (Not started · Doing · Done · Blocked) |
| Priority | select (🔴 · 🟠 · 🟢) |
| Days until due | formula `dateBetween(prop("Due"), now(), "days")` |

### 🗂 Resources

Shared files — pitch decks, vendor contacts, photo libraries.

### 👤 Members

Just a list: name, email, campus, role, joined date. Mostly for newsletter targeting + handover continuity.

---

## Signature formulas

**Days until event** (in Events):
```
dateBetween(prop("Date"), now(), "days")
```

**Event health** (in Events):
```
if(empty(prop("Speaker")), "🔴 No speaker",
  if(prop("Total cost") > prop("Total sponsor revenue"), "🟠 Cost > revenue",
    "🟢 On track"))
```

**Newsletter open rate % badge**:
```
format(prop("Opens") / 120 * 100) + "%"
```

---

## Home-page hub (one page, everything you need)

```
┌─────────────────────────────────────────────┐
│ ESCP Finance Society · Home                 │
├─────────────────────────────────────────────┤
│                                             │
│ 🚨 THIS WEEK                                │
│ [linked DB: events where date within 7d]    │
│                                             │
│ ⚠️  DECISIONS NEEDED                        │
│ [linked DB: tasks priority=🔴 AND overdue]  │
│                                             │
│ 📅 NEXT 4 WEEKS                             │
│ [linked DB: timeline view]                  │
│                                             │
│ 💰 SEMESTER P/L                             │
│ [linked DB: events rollup table]            │
│                                             │
│ 📧 NEWSLETTER                               │
│ [linked DB: next issue status card]         │
│                                             │
│ + QUICK CAPTURE                             │
│ [button → new Task]                         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Automations (Notion native, free)

1. **"Event confirmed" trigger**: When `Events.Status` changes to "Confirmed" → auto-create 6 default Tasks (book venue · brief speaker · design poster · draft newsletter blurb · confirm catering · post-event debrief note) with due dates relative to Event date.

2. **"Sponsor signed" trigger**: When `Sponsors.Status` changes to "Signed" → auto-create Budget item with the contribution as revenue + 1 Task "send invoice by {signed_date + 3 days}".

3. **Weekly digest**: Every Friday 5pm, Notion sends the board group a page snapshot of the coming week's events + pending tasks + newsletter status.

---

## Migration from Excel (half-day task)

1. Export current Excel to CSV per tab.
2. In each Notion DB, use "Merge with CSV" (Import from CSV is the native feature).
3. Manually relink cross-database references (Excel doesn't carry relations).
4. Archive old Excel file to Resources DB (file attachment).

---

## Sharing + permissions

- **Board members**: edit access to everything.
- **Active committee members**: edit on their own event pages only (via guest sharing on specific pages).
- **All members**: read-only on Events page (published as a public page via Notion Sites).
- **External sponsors**: shared view of one curated "Sponsor welcome" page each.

---

## Cost

- Notion Personal plan (free) works for up to 10 guests. For 120 members with 20 editors, you'll want Notion Plus at $10/user/month — OR keep non-editor access via the public Sites feature which is free.
- Realistic setup: **4 board-member editors on Plus (€40/mo)** + rest of society read-only via public share. €480/year.

---

## Handover / continuity

One page titled "For next year's board" — living doc with:
- Login credentials location (1Password vault link)
- Sponsor relationships context (who said yes, who said no, and why)
- Speaker target list for next semester
- "What we'd do differently" section updated at end of each semester

This is the thing that breaks most student-org systems — knowledge leaves when the graduating class graduates.

---

*Spec by Leva's ops agent · subagents: `notion-systems`, `airtable-bases`, `automation-plumbing`*
