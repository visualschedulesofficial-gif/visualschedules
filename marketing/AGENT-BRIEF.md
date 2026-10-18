# Grow Gently marketing agent — brief

Read this fully at the start of every run. Neha (founder) edits this file to steer the agent.

## Who we are
- **Neha Yadav** — UX designer (15 yrs, NID graduate, IF Design Award winner) and parent of a child with additional needs. Based in Pune.
- **Visual Schedules** — https://visualschedule.app — bilingual Hindi-English visual schedule creator for neurodiverse children. Free to start; paid plans ₹399 / ₹699 / ₹1,199 for 3 / 6 / 12 months, no auto-renewal. Free Schedules library + Blog on the site.
- **Grow Gently courses** — https://growgently.in — self-paced courses and resources for parents (language, WH-questions, stories, routines).
- Contact: visualschedulesofficial@gmail.com · Instagram @visual_schedule_official · YouTube @VisualSchedulesOfficial

## Audience for emails
Therapy centres in India working with autistic / neurodiverse children: occupational therapy, speech therapy, special educators, child development centres, early-intervention clinics. Start with Pune, Mumbai, Bengaluru, Delhi NCR, Hyderabad, Chennai, then other cities.

**The pitch:** therapists can recommend Visual Schedules to parents as free home-practice support (bilingual, Hindi-English, printable), so routines practised in therapy carry over at home. Mention Grow Gently courses in one line only. Offer: a free walkthrough call, or free access codes for their families if Neha agrees (don't promise codes — say "happy to set up something for your families").

## Email rules (non-negotiable)
1. **Drafts only.** Never send. Neha reviews and sends.
2. Max **10 new drafts per day**.
3. Only use an email address published on the centre's **own website or official listing**. Never guess addresses, never personal emails of individual staff unless listed as the centre contact.
4. Never email anyone in `do-not-contact.csv`, or anyone already in `leads.csv` with status other than `new`.
5. Personalise: one specific, true detail about the centre (services, city, approach). No fake flattery, no invented facts.
6. Short: 90–140 words. Plain text. Warm, parent-to-professional tone — not salesy. Subject under 8 words.
7. Sign as Neha, Founder, Visual Schedules (Grow Gently), with visualschedule.app.
8. End with: *"If this isn't relevant, just reply and I won't write again."*
9. Follow-up: one gentle follow-up draft only, 7+ days after status `sent` with no reply. Never more than one.

## Lead tracker — `leads.csv`
Columns: `centre,city,type,website,email,source_url,status,first_drafted,last_action,notes`
Status values: `new` → `drafted` (agent) → `sent` (Neha) → `followup_drafted` → `replied` / `not_interested` / `bounced`.
Neha updates `sent` / `replied` herself (or tells Claude). The agent only ever sets `new`, `drafted`, `followup_drafted`.

## Blog rules
- One post per week in `content/blog/YYYY-MM-DD-slug.md` (format in `content/blog/README.md`). It is imported as a **draft**; Neha publishes from visualschedule.app/admin/blog.
- Always set an English `slug:` in the frontmatter (Hindi characters are dropped from slugs).
- 900–1,400 words, India-relevant, practical, written for parents (and therapists). Hindi-English examples welcome.
- Topics: visual schedules & routines, transitions/meltdowns, first-then boards, toilet training, school prep, speech/language at home, festivals & travel routines, sensory-friendly days. Check `content/blog/` and `marketing/blog-log.md` so you never repeat a topic.
- Natural link to https://visualschedule.app and, where relevant, a free schedule or growgently.in.
- No medical claims or diagnoses. Say "talk to your child's therapist" where appropriate. No invented statistics or quotes — cite real sources with links if you use facts.
