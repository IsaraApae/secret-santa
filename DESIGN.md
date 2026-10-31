---
name: Secret Santa
description: A gift-exchange draw styled as a Christmas fair poster, a paper collage over a night of lights.
colors:
  night: "#170c0a"
  gold: "#f4cb6c"
  ribbon: "#f0c75e"
  santa: "#b52a2a"
  santa-deep: "#8f1f20"
  accent: "#1d6b47"
  accent-strong: "#14523a"
  accent-ink: "#fbf5e7"
  paper: "#f1e6d0"
  paper-light: "#fbf5e7"
  cream: "#f3e8d2"
  ink-2-night: "#dccdb3"
  ink-3-night: "#bfae93"
  line-night: "rgb(243 232 210 / 0.25)"
  ink-paper: "#2a1713"
  ink-2-paper: "#5d463b"
  ink-3-paper: "#6f584c"
  line-paper: "rgb(42 23 19 / 0.22)"
  danger: "#a4231f"
  warn: "#7c5208"
  warn-soft: "#f6e2ae"
typography:
  display:
    fontFamily: "Yellowtail, Sriracha, Brush Script MT, cursive"
    fontSize: "clamp(84px, 25vw, 168px)"
    fontWeight: 400
    lineHeight: 0.95
  headline:
    fontFamily: "Yellowtail, Sriracha, Brush Script MT, cursive"
    fontSize: "56px"
    fontWeight: 400
    lineHeight: 1.05
  title:
    fontFamily: "Yellowtail, Sriracha, Brush Script MT, cursive"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.25
  button:
    fontFamily: "Bree Serif, Sarabun, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
  label:
    fontFamily: "Bree Serif, Sarabun, Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
  body:
    fontFamily: "Figtree, Sarabun, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  body-small:
    fontFamily: "Figtree, Sarabun, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.375
  caption:
    fontFamily: "Figtree, Sarabun, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
rounded:
  note: "6px"
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
    rounded: "{rounded.note}"
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

**Creative North Star: "The Christmas Fair Poster"**

A gift exchange should feel like the poster for a Christmas fair, not a tidy app. Gold script sits on a night of blurred red, green and gold lights, and everything you read or touch is a physical scrap laid on top: torn paper notes, punched tickets, gift tags, die-cut stickers and calendar pages.

The style is inspired by the Cultural Fest 2027 Instagram posters. That is a named inspiration only. All artwork here is original, and that page's logo, photos and wording are never reused.

There is one dark theme and no switch. Paper surfaces use dark ink because they are objects on the night, not a light mode. The interface is English only, while names and wishes people type can be Thai.

**Key Characteristics:**
- A night of blurred lights behind every screen, scrolling with the page so it runs under the phone browser's bars.
- Content on torn, slightly tilted paper notes.
- Actions on tickets with punched edges and a stitched inner line.
- Phone first, one 640px column, with a wider poster hero on large screens.

## Colors

Warm night, cream paper and three festive inks: gold, Santa red and evergreen.

### Primary
- **Santa Red** (`santa`, hover `santa-deep`): main-action tickets, the promise ticket, step numbers, calendar page headers and the drawn name on the gift tag.

### Secondary
- **Evergreen** (`accent`, hover `accent-strong`, text `accent-ink`): positive actions, confirm buttons, the sender's chat bubbles and success stickers.

### Tertiary
- **Fair Gold** (`gold`): script headings, sparkles, focus rings on the night and ghost actions.
- **Ribbon Gold** (`ribbon`): washi tape and the gift's ribbon.

### Neutral
- **Night** (`night`): the page behind the lights.
- **Cream** (`cream`, `ink-2-night`, `ink-3-night`, `line-night`): text and lines on the night.
- **Paper** (`paper`, `paper-light`): notes and sheets, then the brighter tickets, tags, inputs and stickers on them.
- **Paper Ink** (`ink-paper`, `ink-2-paper`, `ink-3-paper`, `line-paper`): text and lines on paper.
- **Alerts** (`danger`, `warn`, `warn-soft`): destructive text, warning icons and warning pills.

### Named Rules
**The Surface Ink Rule.** Text colour follows the surface: cream on the night, dark ink on paper. Gold text belongs on the night or on red, never on paper.

**The Ticket Colour Rule.** Red is the view's main action, green a positive action that is not the main one, and cream every neutral action.

## Typography

**Display Font:** Yellowtail (Thai falls back to Sriracha)
**Label Font:** Bree Serif (Thai falls back to Sarabun)
**Body Font:** Figtree (Thai falls back to Sarabun)

**Character:** A loose signwriter's script over a sturdy, friendly slab, with a clean sans doing the reading.

### Hierarchy
- **Display:** the home page's Secret Santa, in gold.
- **Headline:** page titles and group names, in gold.
- **Title:** section headings above notes, in gold. The script also carries the top-bar signature (26px), the drawn name (68px) and short gift moments (40-42px).
- **Button and Label:** every button, chip, tab, ticket and sticker label.
- **Body, Body Small and Caption:** reading text, notes and fine print. Counters use tabular figures.

### Named Rules
**The Script Heading Rule.** Headings use Yellowtail. Sheet and alert titles (Bree Serif, 19-20px) and the not-found heading (Figtree bold, 22px) do not follow it yet, and are drift rather than a pattern to copy.

**The Thai Partner Rule.** Every face keeps its Thai partner in the stack, because any name or wish can be Thai. Headings use Sriracha. Labels and body use Sarabun.

## Layout

One centred column, 640px at most, with 16px gutters and 24px between sections. Notes stack 14px apart, with section titles 8px above them. The home hero alone breaks out, up to 1080px inside a thin gold frame, and becomes two columns from 768px. Tap targets are at least 44px, and most controls are 48px. Nothing is fixed to the screen except the backdrop and falling snow or confetti.

## Elevation & Depth

Depth is a paper pile under one soft light from above. Shadows are soft and black, and they lift scraps off the night. Tickets stay flat, as if printed.

### Shadow Vocabulary
- **Note** (`drop-shadow(0 10px 18px rgb(0 0 0 / 0.42))`): every paper note.
- **Sticker** (`0 0 0 2.5px #fff, 0 6px 14px rgb(0 0 0 / 0.4)`): round sticker buttons. Hero stickers use 12px of blur.
- **Lifted tag** (`0 8px 16px rgb(0 0 0 / 0.45)`): the chosen tab, and calendar pages at 0.4.
- **Sheet** (`0 24px 60px rgb(0 0 0 / 0.6)`): sheets and alerts, over a `rgb(12 6 5 / 0.65)` backdrop.

### Named Rules
**The Die-Cut Rule.** A sticker has a solid white edge with its soft shadow beneath. That edge marks it as cut out, so paper notes and tickets do not get one.

## Shapes

Corners are small and handmade: 6px on notes, 8px on tickets and tags, 10px on controls. Sheets and alerts use 18px, the poster frame 22px, and only stickers and number badges are round. Each ticket has a 9px half-circle punched from both short edges and a dashed line inset 6px. Each note has a rough torn edge on its paper layer only, so text is never distorted, and it falls back to a clean rectangle without SVG filter support.

## Components

### Buttons
- **Shape:** tickets with punched edges (8px); the ghost button is a plain 10px shape.
- **States:** press scales to 0.96 on a spring. Hover deepens the fill, or turns cream to white. Focus is a 2.5px solid line replacing the stitch, gold on red and green, red on cream. Disabled drops to 45% opacity.
- **Compact confirm:** a flat evergreen square (12px radius) or circle holding an icon, used for add, send and sheet confirm.

### Stickers and Tags
- **Sticker button:** a 44px round cream die-cut holding a 2px-stroke line icon.
- **Name tag:** bright paper with a thin ink border (8px).
- **Tabs:** dashed gold tags on the night; the chosen one becomes solid paper, lifts 2px and tilts -1.2deg.
- **Chip:** bright paper, a thin ink border, 10px corners.

### Cards / Containers
- **Paper note:** torn grained paper with 16-20px of padding, and inset hairlines between rows. Some carry washi tape or a small pinned gift sticker.
- **Callout:** a paper note with a round die-cut tone sticker. Text stays in paper ink, and the sticker carries the tone.

### Inputs / Fields
- **Style:** bright paper, 1.5px ink border at 30%, 10px corners, a red caret.
- **Focus:** a red border and a 2px red outline.

### Navigation
A centred script signature with two sparkles at the top of every page but home. There is no other global navigation, and no fixed bars.

### Sheets and Alerts
Native dialogs on plain paper. Sheets rise from the bottom in 0.45s with a drag handle, a close sticker on the left and an optional confirm on the right. Alerts scale in over 0.35s at 330px wide at most.

### Gift and Reveal
An original die-cut present that bobs, shakes when tapped, then loses its lid while a torn paper tag swings out on a gold string with the drawn name in red script. Calendar-page tiles count down to the party, with a red header over a bright paper face. Reduced motion turns all of this off.

## Do's and Don'ts

### Do:
- **Do** put lists, forms and long text on a paper note or sheet, with short script headings and labels on the night.
- **Do** keep tilts small on things people read: notes at 0.7deg or less, tickets at 1deg. Decorative stickers can go up to 9deg.
- **Do** draw new artwork as original SVG, and keep the lights backdrop on every page. Keep it scrolling, and set no browser theme colour, so no solid bar appears at the screen's edges.
- **Do** keep shop and app badges in their own brand colours, as those are the only colours from outside this palette.

### Don't:
- **Don't** reuse the logo, photos or wording of Cultural Fest 2027.
- **Don't** add a light theme or a theme switch.
- **Don't** translate the interface into Thai, or remove a Thai font from a stack.
- **Don't** set reading text in Yellowtail, or set body copy in Bree Serif.
- **Don't** add fixed top bars, tab bars or floating buttons.
- **Don't** add new motion without a reduced-motion path.
