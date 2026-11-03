---
name: Secret Santa
description: A gift-exchange draw in the Cultural Fest 2027 CI, stamp-edged cards and stickers over a grainy night of lights.
colors:
  night: "#2c2825"
  gold: "#e2c75c"
  ribbon: "#e2c75c"
  santa: "#ab2828"
  santa-deep: "#8a1f1f"
  accent: "#126e29"
  accent-strong: "#0c5520"
  accent-ink: "#faf9f6"
  paper: "#e2d3bc"
  paper-light: "#f3ebdd"
  sticker: "#faf9f6"
  cream: "#f5eee2"
  ink-2-night: "#ddd2c0"
  ink-3-night: "#c0b4a1"
  line-night: "rgb(245 238 226 / 0.25)"
  ink-paper: "#2c2825"
  ink-2-paper: "#554a42"
  ink-3-paper: "#62564c"
  line-paper: "rgb(44 40 37 / 0.22)"
  danger: "#a4231f"
  warn: "#7c5208"
  warn-soft: "#f6e2ae"
typography:
  display:
    fontFamily: "Satisfy, Charm, Brush Script MT, cursive"
    fontSize: "clamp(84px, 25vw, 168px)"
    fontWeight: 400
    lineHeight: 0.95
  headline:
    fontFamily: "Satisfy, Charm, Brush Script MT, cursive"
    fontSize: "56px"
    fontWeight: 400
    lineHeight: 1.05
  title:
    fontFamily: "Satisfy, Charm, Brush Script MT, cursive"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.25
  button:
    fontFamily: "Fraunces (SOFT 100, wght 560), Noto Serif Thai, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
  label:
    fontFamily: "Fraunces (SOFT 100, wght 560), Noto Serif Thai, Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
  small-header:
    fontFamily: "Instrument Serif, Noto Serif Thai, Georgia, serif"
    fontSize: "15-20px"
    fontWeight: 400
  body:
    fontFamily: "Fraunces (SOFT 100, wght 470), Noto Serif Thai, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  body-small:
    fontFamily: "Fraunces (SOFT 100, wght 470), Noto Serif Thai, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.375
  calendar:
    fontFamily: "Salsa, Noto Serif Thai, Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
  caption:
    fontFamily: "Fraunces (SOFT 100, wght 470), Noto Serif Thai, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
rounded:
  ticket: "8px"
  control: "10px"
  bubble: "12px"
  sheet: "18px"
  frame: "22px"
  full: "9999px"
spacing:
  section-title: "8px"
  stack: "14px"
  gutter: "16px"
  note: "20px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.santa}"
    textColor: "{colors.paper-light}"
    typography: "{typography.button}"
    rounded: "{rounded.ticket}"
    padding: "0 28px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.santa-deep}"
  button-green:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.ticket}"
    padding: "0 20px"
    height: "48px"
  button-green-hover:
    backgroundColor: "{colors.accent-strong}"
  button-secondary:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.ink-paper}"
    typography: "{typography.button}"
    rounded: "{rounded.ticket}"
    padding: "0 22px"
    height: "48px"
  button-ghost:
    textColor: "{colors.gold}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "48px"
  input:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.ink-paper}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "48px"
  chip:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.ink-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  note:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-paper}"
    edge: "stamp bites, 16px across every 27px"
    padding: "{spacing.note}"
  sticker-button:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.ink-paper}"
    rounded: "{rounded.full}"
    size: "44px"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-paper}"
    rounded: "{rounded.sheet}"
---

# Design System: Secret Santa

## Overview

**Creative North Star: "The Christmas Market Stamp Book"**

A gift exchange should feel like the Cultural Fest 2027 Christmas Market, not a tidy app. Gold script sits on a grainy night of blurred red, green and gold lights, and everything you read or touch is a physical scrap laid on top: cream cards with perforated stamp edges, punched tickets, gift tags, die-cut stickers and calendar pages.

The palette, faces, shapes and stickers follow the CI section of the Cultural Fest 2027 Figma file. The 21 stickers in `public/stickers` are that section's own vector artwork. The festival's logo and wording are never reused, and neither are the CI's "background shades": those are photos saved from Pinterest, not the team's own, so the site keeps its own blurred lights with the CI's blur-and-grain treatment.

There is one dark theme and no switch. Paper surfaces use dark ink because they are objects on the night, not a light mode. The interface is English only, while names and wishes people type can be Thai.

**Key Characteristics:**
- A fixed night of blurred lights behind every screen.
- Content on cream cards with perforated stamp edges, slightly tilted.
- Actions on tickets with punched edges and a stitched inner line.
- Phone first, one 640px column, with a wider poster hero on large screens.

## Colors

The CI's warm charcoal, cream card stock and three festive inks: gold, Santa red and evergreen. The CI values are #2C2825 text and night, #E2D3BC cards, #AB2828 red, #126E29 green, #E2C75C gold and #FAF9F6 sticker outlines.

### Primary
- **Santa Red** (`santa`, hover `santa-deep`): main-action tickets, the promise ticket, step numbers, calendar page headers and the drawn name on the gift tag.

### Secondary
- **Evergreen** (`accent`, hover `accent-strong`, text `accent-ink`): positive actions, confirm buttons, the sender's chat bubbles and success stickers.

### Tertiary
- **Fair Gold** (`gold`): script headings, sparkles, focus rings on the night and ghost actions.
- **Ribbon Gold** (`ribbon`): washi tape and the gift's ribbon.

### Neutral
- **Night** (`night`): the page behind the lights, under a fine film grain.
- **Cream** (`cream`, `ink-2-night`, `ink-3-night`, `line-night`): text and lines on the night.
- **Paper** (`paper`, `paper-light`): cards and sheets, then the brighter tickets, tags, inputs and stickers on them.
- **Sticker** (`sticker`): the die-cut outline of stickers and the gift. The CI keeps it off cards.
- **Paper Ink** (`ink-paper`, `ink-2-paper`, `ink-3-paper`, `line-paper`): text and lines on paper.
- **Alerts** (`danger`, `warn`, `warn-soft`): destructive text, warning icons and warning pills.

### Named Rules
**The Surface Ink Rule.** Text colour follows the surface: cream on the night, dark ink on paper. Gold text belongs on the night or on red, never on paper.

**The Ticket Colour Rule.** Red is the view's main action, green a positive action that is not the main one, and cream every neutral action.

## Typography

**Display Font:** Satisfy, standing in for the CI's Vintage Goods big headers (Thai falls back to Charm)
**Body Font:** Fraunces at SOFT 100 and weight 470, standing in for Roca One (Thai falls back to Noto Serif Thai)
**Label Font:** the same soft Fraunces at weight 560, like the CI's Roca One card labels (`font-label`)
**Small Header Font:** Instrument Serif, standing in for Times New Roman MT Condensed (`font-serif`, Thai falls back to Noto Serif Thai)
**Calendar Font:** Salsa, used only on calendars, as the CI asks

**Character:** A brush-pen market-stall script over a soft, rounded serif, with a tall condensed serif for small headers, the same three roles as the CI. The CI's own faces are paid fonts, so the closest free Google Fonts, matched side by side with the CI's samples, stand in for them.

### Hierarchy
- **Display:** the home page's Secret Santa, in gold.
- **Headline:** page titles and group names, in gold.
- **Title:** section headings above cards, in gold. The script also carries the top-bar signature (27px), the drawn name (70px) and short gift moments (42-44px).
- **Calendar:** the countdown pages and the date picker.
- **Button and Label:** every button, chip, tab, ticket and sticker label, in heavier soft Fraunces.
- **Small Header:** sheet and alert titles, counts beside headings, and the lines around the drawn name, in Instrument Serif.
- **Body, Body Small and Caption:** reading text, notes and fine print. Counters use tabular figures.

### Named Rules
**The Script Heading Rule.** Headings use Satisfy. Sheet and alert titles are small headers, in Instrument Serif at 19-20px.

**The Thai Partner Rule.** Every face keeps its Thai partner in the stack, because any name or wish can be Thai. Headings use Charm, a Thai calligraphy that sits with Satisfy. Labels and body use Noto Serif Thai, whose looped letters sit with the serifs.

## Layout

One centred column, 640px at most, with 16px gutters and 24px between sections. Notes stack 14px apart, with section titles 8px above them. The home hero alone breaks out, up to 1080px inside a thin gold frame, and becomes two columns from 768px. Tap targets are at least 44px, and most controls are 48px. Nothing is fixed to the screen except the backdrop and falling snow or confetti.

## Elevation & Depth

Depth is a paper pile under one soft light from above. Shadows are soft and black, and they lift scraps off the night. Tickets stay flat, as if printed.

### Shadow Vocabulary
- **Card** (`drop-shadow(0 1.5px 1.5px rgb(0 0 0 / 0.5))`): every stamp card, following its bites. This is the CI's own tight card shadow at 0.7 scale.
- **Sticker** (`0 0 0 2.5px #faf9f6, 0 6px 14px rgb(0 0 0 / 0.4)`): round sticker buttons. Hero stickers use 12px of blur.
- **Lifted tag** (`0 8px 16px rgb(0 0 0 / 0.45)`): the chosen tab, and calendar pages at 0.4.
- **Sheet** (`0 24px 60px rgb(0 0 0 / 0.6)`): sheets and alerts, over a `rgb(12 6 5 / 0.65)` backdrop.

### Named Rules
**The Die-Cut Rule.** A sticker has a solid #FAF9F6 edge with its soft shadow beneath. That edge marks it as cut out, so cards and tickets do not get one.

## Shapes

Cards have no corners to speak of: their edge is a row of perforations, like a postage stamp. Tickets and tags use 8px and controls 10px. Sheets and alerts use 18px, the poster frame 22px, and only stickers and number badges are round. Each ticket has a 9px half-circle punched from both short edges and a dashed line inset 6px. Each card is cut to the CI's measurements at 0.7 scale: round bites 16px across every 27px, centred on the edge so a quarter bite takes each corner. They are drawn as background layers on the card's paper layer only, so text is never touched. The CI's paper texture, a fine ink grain, sits on top, cut to the same shape.

## Components

### Buttons
- **Shape:** tickets with punched edges (8px); the ghost button is a plain 10px shape.
- **States:** press scales to 0.96 on a spring. Hover deepens the fill, or turns cream to white. Focus is a 2.5px solid line replacing the stitch, gold on red and green, red on cream. Disabled drops to 45% opacity.
- **Compact confirm:** a flat evergreen square (12px radius) or circle holding an icon, used for add, send and sheet confirm.

### Stickers and Tags
- **CI stickers:** die-cut vector stickers from the CI (`<Sticker>`), each with its own #FAF9F6 edge and a soft CSS shadow. A section heading can end with one, inline after the last word and tilted about 9deg, chosen for what the section is about: a stocking on a wish list, a megaphone on the invite link, a question mark on guessing. It wraps with the title and is left out when the heading has an action or count on its right, so it never squeezes or covers text. The home poster scatters a bell, tree, ornament and star around the present, and empty states carry one beside their text. The SVGs hold no filters: their shadow is CSS, so they stay sharp at any size.
- **Sticker button:** a 44px round cream die-cut holding a 2px-stroke line icon.
- **Name tag:** a person as a small paper gift tag (`NameTag`): bright paper, a thin ink border, a punched hole at one end and a slight tilt that varies along the row. Yours is red. "Who's in" lists them, and "Already joined?" makes them tappable, with a small lock on tags that already have a PIN.
- **Tabs:** dashed gold tags on the night; the chosen one becomes solid paper, lifts 2px and tilts -1.2deg.
- **Chip:** bright paper, a thin ink border, 10px corners.

### Cards / Containers
- **Stamp card:** flat cream card stock with perforated edges, 16-20px of padding, and inset hairlines between rows. Some carry washi tape or a small pinned gift sticker.
- **Callout:** a stamp card with a round die-cut tone sticker. Text stays in paper ink, and the sticker carries the tone.

### Inputs / Fields
- **Style:** bright paper, 1.5px ink border at 30%, 10px corners, a red caret.
- **Focus:** a red border and a 2px red outline.

### Navigation
A centred script signature with two sparkles at the top of every page but home. There is no other global navigation, and no fixed bars.

### Sheets and Alerts
Native dialogs on plain paper. Sheets rise from the bottom in 0.45s with a drag handle, a close sticker on the left and an optional confirm on the right. Alerts scale in over 0.35s at 330px wide at most. Their Cancel takes only its word's room and the action ticket the rest, so a two-word action like "Draw names" stays on one line, clear of its notches.

### Link Preview
Every invite link unfurls in chat apps as a stamp card on the lights: "You're invited to", the group name in red script, the budget ticket and date tag, and how many people have joined. The site's own link gets the same card with the promise ticket. Both are drawn in `src/lib/og.tsx`, and the organiser sees the invite card above the link.

### Gift and Reveal
An original die-cut present that bobs, shakes when tapped, then loses its lid while a stamp-edged paper tag swings out on a gold string with the drawn name in red script. Calendar-page tiles count down to the party in Salsa, with a red header over a bright paper face. Snow falls slowly on every page. The drawn name writes itself onto the tag, and so does a group's name the first time a phone opens it, before its tickets drop and its cards rise in turn (only opacity, translate and scale move, so cards keep their tilt). When the organiser draws, everyone's name tag pops up around the present and drops into it, the present shakes, and confetti bursts. Whatever arrives while a page is open moves in once its list is on screen: a name tag drops into Who's in with a small swing, a saved wish slips onto the list beside a tick that pops and fades, a message slides up into the thread while the one you sent flies off as a sealed envelope, and the guess results flip over like cards, one after another, the first time a phone sees them. Reduced motion turns all of this off.

## Do's and Don'ts

### Do:
- **Do** put lists, forms and long text on a stamp card or sheet, with short script headings and labels on the night.
- **Do** keep tilts small on things people read: cards at 0.7deg or less, tickets at 1deg. Decorative stickers can go up to 9deg.
- **Do** use the CI stickers for decoration, draw any other new artwork as original SVG, and keep the fixed lights backdrop on every page.
- **Do** show where a wish link goes as a plain globe and site name, the same for every shop. There are no brand-coloured badges.

### Don't:
- **Don't** reuse the logo, photos or wording of Cultural Fest 2027, or the CI's Pinterest background shades; take only its palette, faces, shapes and stickers.
- **Don't** add a light theme or a theme switch.
- **Don't** translate the interface into Thai, or remove a Thai font from a stack.
- **Don't** set reading text in Satisfy, use Instrument Serif for buttons or labels, or use Salsa outside calendars.
- **Don't** add fixed top bars, tab bars or floating buttons.
- **Don't** add new motion without a reduced-motion path.
