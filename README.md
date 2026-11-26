# Glitterific Hate Mail Translator

Turns hate mail into fan mail with one click. It swaps hostile words for sparkly ones as you read, in Gmail and Outlook on the web, and on any other page when you click **Glitter this page**.

- Click any glittered word to see what they wrote. Turn on **Show what they said** to see every original, struck through.
- If a message looks like a threat, Glitterific leaves the whole message exactly as it was sent, adds a note, and links to Right To Be's guide to responding to online harassment.
- Anything you type (replies, compose windows, comment boxes) is never touched.
- Everything runs in the browser. Nothing is collected, stored, or sent anywhere.

**Current version: 2.0.2**, for Chrome and Firefox.

## What's in this repo

| Path | What it is |
| --- | --- |
| `chrome/` | The Chrome build, ready to load or to zip for the Chrome Web Store |
| `firefox/` | The Firefox build, ready to load or to zip for Firefox Add-ons |
| `PRIVACY.md` | The privacy policy, shared by both stores |
| `STORE-LISTING.md` | Listing text for both stores |
| `LICENSE` | The Mozilla Public License 2.0 |

The two builds have the same code inside. They differ only in `manifest.json`, because each browser wants a few settings written its own way. If you change any other file, change it in both folders.

## Install in Chrome

**First time:**

1. Get the code: click the green **Code** button above, then **Download ZIP** (or clone the repo). Keep it somewhere it can stay, like Documents, because Chrome loads the extension from that folder.
2. Go to `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the `chrome` folder (the one with `manifest.json` in it).
4. Pin it from the puzzle piece menu, then reload Gmail.

**Updating to a new version:** replace the `chrome` folder with the new one (or `git pull`), then click the reload arrow on Glitterific's card at `chrome://extensions` and reload Gmail.

## Install in Firefox

**To try it:**

1. Get the code with **Code > Download ZIP**, or clone the repo.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and choose `firefox/manifest.json`.
4. Reload Gmail.

Firefox removes temporary add-ons when it restarts, so you'll repeat these steps after each restart until it's published. Firefox needs version 140 or newer.

## What to check

- [ ] A nasty email gets glittered, and the icon shows a count.
- [ ] Clicking a glittered word shows the original.
- [ ] **Show what they said** shows every original, struck through.
- [ ] Turning off **Glitter my mail** puts every word back.
- [ ] Typing an insult in a reply box stays exactly as typed.
- [ ] A message with a threat (try "I know where you live") is left alone, with the note on top.
- [ ] Outlook on the web works too.
- [ ] **Glitter this page** works on a comments section.

## Changing the words

Everything lives in `wordlist.js`, in both folders.

- **WORDS**: the hostile word or phrase on the left, the glitter on the right. Phrases work.
- **THREATS**: patterns that stop the glitter and show the safety note.

The list leaves out racial and other slurs for now. Decide whether those should be glittered or treated like threats before adding them.

## Publishing

Each store wants a zip with `manifest.json` at the top level, so zip the contents of a build folder rather than the folder itself:

```sh
cd chrome && zip -r ../glitterific-chrome-2.0.2.zip . -x '.*' && cd ..
cd firefox && zip -r ../glitterific-firefox-2.0.2.zip . -x '.*' && cd ..
```

**Chrome Web Store**

1. Sign up at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) (there's a one-time registration fee).
2. Click **New item** and upload the `glitterific-chrome` zip.
3. **Store listing:** paste the text from `STORE-LISTING.md`, then upload the icon and screenshot.
4. **Privacy:** paste the permission reasons below, check that no user data is collected, and give a privacy policy URL (put the text of `PRIVACY.md` on a page on your site).
5. Submit for review.

**Firefox Add-ons (addons.mozilla.org)**

1. Sign in at the [Add-on Developer Hub](https://addons.mozilla.org/developers/) with a Firefox account (free).
2. Click **Submit a New Add-on**, choose **On this site**, and upload the `glitterific-firefox` zip.
3. If it asks whether you used a code generator or minifier, answer no. Every file is plain, readable code.
4. Paste the listing text from `STORE-LISTING.md`, add the screenshot, and link the same privacy policy page.
5. Submit for review.

Why each permission is needed (both stores):

- **storage:** saves two settings, glitter on or off and Show what they said.
- **activeTab** and **scripting:** let the Glitter this page button run on the current tab, only when you click it.
- **Access to mail.google.com and Outlook on the web:** swaps words in your email as you read it.

The Firefox build already declares that it collects no data, which Firefox requires of new add-ons.

## Versions

- **2.0.2** (November 2026): rebuilt from scratch for today's Chrome, with a new Firefox build.
- **1.0** (2013): the original Chrome extension.

## License

Glitterific's code is licensed under the Mozilla Public License 2.0. The full text is in `LICENSE`, and each build folder carries its own copy so a zip made from either one ships with it.

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.

The fonts in `fonts/` keep their own SIL Open Font License.

## Credits

First released in 2013 and revived in 2026 by Melissa Pierce, built with Claude. Inspired by Danielle Sucher's Jailbreak the Patriarchy. Fonts: Pacifico and Fredoka, both under the SIL Open Font License (see `fonts/`).
