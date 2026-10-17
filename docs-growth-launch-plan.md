# FinDash: first-user launch plan

Audience: students and newer investors. Status: prepared launch material; no outreach or community posts have been sent.

## Positioning

FinDash is a customizable workspace for learning a watchlist/portfolio-tracking routine. The first promise is a usable sample-data demo without an account or API key—not better investment returns. Real market data requires the visitor's own Finnhub key.

Primary link: https://fin-dash-design-ad43.vercel.app/demo
Guide link: https://fin-dash-design-ad43.vercel.app/guides/first-stock-watchlist
Feedback: https://github.com/JayadityaVetsa/FinDashDesign/issues/new?template=beta-feedback.yml

## First two weeks: a small, measurable experiment

These are targets, not existing results or guarantees.

1. Invite 10 people from your existing student network to a five-minute usability session. Ask each to open the demo, change a watchlist, edit a sample holding, and explain what they think they saved. Ask for honest feedback, not signups or likes.
2. Ask one student investing/finance club organizer whether a short demo and feedback request would be appropriate for the club. Contact people you actually know, or get permission from a moderator. Do not send a mass direct-message campaign.
3. Make a 30–45-second screen recording: open the no-signup demo, edit a watchlist, move a widget, change a sample holding, and point out that all demo data is illustrative. Link directly to /demo.
4. Publish one appropriate public launch after the feedback fixes. Check the community's current rules first. Avoid investment-advice subreddits as a default promotion channel. Do not buy traffic, followers, testimonials, or upvotes.
5. Review the first cohort after seven days: what did people try, what blocked them, and who voluntarily returned? Fix the most repeated obstacle before a second launch.

## Measurement

Vercel Web Analytics: visits and referring sources for the landing page, demo, login page, and guides. URL query/hash data is removed; private workspace pages are excluded. DNT/GPC requests are respected by the app's event filter. Enable Web Analytics in the Vercel project dashboard; the package alone does not enable the service. This implementation uses page views, not paid custom conversion events.

Run `npm run growth:report` with an operator DATABASE_URL to get aggregate account/onboarding counts. The command does not print emails, holdings, tokens, or API keys. Compare signup and onboarding counts over the same time window as visits. Page views are not unique users or proof of retention. Exclude known deployment-check accounts from account reporting.

Suggested week-one learning goals: 10 real demo testers, 5 specific feedback responses, and 3 people who independently choose to return. These are deliberately small validation targets. Do not report them as achieved until observed.

## What to ask testers

- Before clicking, what do you expect this tool to do?
- Can you add a symbol to the watchlist without help?
- Which numbers do you think are real? (Correct answer: demo prices/news are invented.)
- Where do you expect your changes to be saved?
- Does getting a Finnhub key stop you from creating a real workspace?
- What would make you open this again next week?

## Draft for your own student network (not sent)

I built FinDash, a customizable financial dashboard, and I'm looking for feedback from students who are learning to follow stocks. You can try it without signing up: https://fin-dash-design-ad43.vercel.app/demo

The demo uses invented data, so it's for exploring the interface—not making investment decisions. Could you spend five minutes adding a watchlist symbol and changing a sample holding? I'd especially like to know what felt confusing and whether this would be useful enough to reopen.

## Short social launch draft (not posted)

I've been building FinDash for students and newer investors who want a watchlist, portfolio tracker, and company context in one workspace.

The new interactive demo needs no account or API key. Rearrange widgets, edit a watchlist, and try sample holdings. All demo prices and news are illustrative.

Try it: https://fin-dash-design-ad43.vercel.app/demo

I'm looking for specific usability feedback: what would make you come back to this next week?

## Developer-community option

A Show HN is an optional developer-feedback channel, not the main student acquisition channel. Its official guidelines favor something people can actually try without signup, so use /demo rather than a signup page. Do not ask friends for upvotes. Read the current guidelines and write your own personal explanation of why you built it; do not post generated comments.

Sources: https://news.ycombinator.com/showhn.html and https://news.ycombinator.com/newsguidelines.html

Outline only: what you built personally; the friction that motivated the no-key demo; one technical tradeoff; a specific usability question. Do not invent a founder story or claim traction.

## Next product experiments, after real feedback

- Save/import a demo layout into a new account if testers repeatedly expect that behavior.
- Add research notes or a weekly review checklist if interviews show those are missing from the routine.
- Revisit the bring-your-own-key requirement using provider-approved data licensing and actual costs. Do not expose a shared private API key or assume free market-data redistribution is permitted.
- Consider email reminders only after opt-in, an email provider, and a useful return habit exist. No unsolicited reminders or contact-list imports.
