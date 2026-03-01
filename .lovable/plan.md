

# Replace Letter Placeholders with Real Brand Logos in LogoCloud

## What Changes
Replace the single-letter placeholders (G, Z, T, O, S) in the integrations bar with actual brand SVG logos for Google Calendar, Zoom, Microsoft Teams, Outlook, and Slack.

## Approach
Use inline SVGs directly in the component for each brand. This avoids external dependencies, ensures crisp rendering at any size, and keeps the logos lightweight. Each integration entry will include a React component (JSX SVG) instead of a letter.

## Visual Result
Each integration item will show the recognizable brand icon (in brand colors) next to the tool name, replacing the current bordered letter squares. The container styling will be adjusted slightly to accommodate the SVG icons cleanly.

## Technical Details

### File: `src/components/LogoCloud.tsx`
- Replace the `integrations` array (which currently has `letter` strings) with an array that includes an `icon` field containing inline SVG JSX for each brand:
  - **Google Calendar**: Multi-color calendar icon (blue/green/yellow/red)
  - **Zoom**: Blue video camera icon
  - **Microsoft Teams**: Purple Teams icon
  - **Outlook**: Blue envelope icon
  - **Slack**: Multi-color hashtag-style icon
- Remove the bordered square `div` wrapper and render the SVG icon directly at 24-28px size
- Keep the hover transition and text label as-is

No new files or dependencies needed -- everything stays self-contained in the single component file.

