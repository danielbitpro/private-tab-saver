# Private Tabs Auto-Saver

Automatically saves your private/incognito tabs to Markdown files so you never lose them after a restart or crash.

## Features

- Saves automatically on a schedule you choose (5 min to 1 hour)
- Also saves immediately when you close a private window
- Writes two Markdown files in your Downloads folder:
  - `private-tabs-Firefox-latest.md`
  - `private-tabs-Firefox-previous.md`
  (browser name is detected automatically)
- Links are proper Markdown so you can open the file in Obsidian or any Markdown viewer
- Toolbar button with a quick “Save now” action and options
- Badge shows how many private tabs are currently open
- Does not collect any data — everything stays on your machine

## Installation

### From Firefox Add-ons (recommended)
Once published, install it directly from [addons.mozilla.org](https://addons.mozilla.org).

### Temporary (for testing)
1. Download or clone this repo
2. Go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on...**
4. Select the `manifest.json` file

## Permissions

- `tabs` — to read open tabs
- `downloads` — to save the Markdown files
- `alarms` — for the scheduled saves
- `notifications` — to confirm manual saves
- `storage` — to remember your settings

## License

MIT
