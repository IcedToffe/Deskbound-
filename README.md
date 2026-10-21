# Deskbound

**Study long. Move every so often. One minute, one stretch.**

Deskbound is a desk-break timer for students who sit for hours. Instead of a plain Pomodoro break, it gives you a one-minute guided stretch with a small animated figure to follow. It is private, works offline, and needs no sign-up.

> Add here: live demo link, a 30-second demo GIF, and a screenshot of the main screen.

---

## Why I built it

Students often sit for hours without moving, and standard break timers are easy to ignore. I wanted a break that is quick, fun and clear enough to actually do. Each break is one minute, one stretch, with a visual guide so there is nothing to look up.

## Features

**Core**
- Work timer with a progress ring, pause, and a break after each block
- Randomized one-minute stretches with animated figures and a breathing guide
- Stretch library with your own custom stretches, plus a "Tired eyes" mode (eyes and neck only)
- Sitting alert, daily goal, streak and a 7-day chart
- Weekly recap you can copy or download as an image
- Pop-out timer (Picture-in-Picture), desktop notifications and screen wake lock during breaks

**Personalization**
- Presets: Study, Deep work, Light day
- Light and dark mode, four accent colours, high contrast mode
- Chime styles (soft, bell, pluck) or your own alarm sound
- English and Filipino

**Insights and motivation**
- 12-week heatmap, best weekday, most skipped stretch and a smart suggestion
- Five badges, goal confetti and unlock toasts

**Product basics**
- Installable PWA that works offline
- All data stays in the browser, with JSON export and import
- Keyboard shortcuts (press `?`) and reduced-motion support

## Design decisions

- **Colour tokens.** All colours are CSS variables (`--vio`, `--mint`, `--soft`, `--ink`), so dark mode, accents and high contrast are just value swaps.
- **Type pairing.** Fraunces for display numbers and headings, Figtree for body text.
- **Mood-aware figure.** The stretch character looks happy, proud or sleepy depending on how your day is going.
- **Accessibility.** Visible focus rings, ARIA labels and live regions, full keyboard flow and respect for `prefers-reduced-motion`.
- **Privacy by default.** No account, no server, no tracking.

## Tech

HTML, CSS and vanilla JavaScript, with Tailwind (CDN) for layout. Browser APIs used: localStorage, IndexedDB, Web Audio, Notifications, Wake Lock, Document Picture-in-Picture and Service Worker.

## Run it locally

1. Download or clone the project.
2. Open the folder in VS Code and start **Live Server** on `index.html`. (A local server is needed for notifications and the service worker.)
3. Open the page, press **Start session**, or use **Try a stretch now**.

Tip: pick "10 seconds (demo)" in *Stretch every* to see a full cycle quickly.

## Project structure

```
index.html      page structure
style.css       design tokens, components, stretch animations
features.css    accents, high contrast, insights, badges
app.js          timer, stats, library, recap, PWA
features.js     insights, badges, presets, filters, sound styles
i18n.js         Filipino translations
sw.js           offline cache (bump VERSION on every change)
manifest.json   install settings and icons
```

## What I learned

- Designing a timer so it stays accurate when the tab is throttled (timestamps, not counters)
- Building an offline-first PWA with a cache versioning strategy
- Keeping a visual system flexible with design tokens
- Making a small product feel complete with onboarding, empty states and feedback

## Roadmap

- [ ] Custom illustrated stretch characters
- [ ] Optional account sync across devices
- [ ] Translations beyond Filipino
- [ ] Usability test with classmates, results added to the case study

## Case study and design files

- Figma: _add link_
- Case study: _add link_

## Contact

**Milo** · UI Designer · Davao, Philippines
LinkedIn: _add link_ · Email: _add email_
