# Electern

Electern is an Atom/RSS feed reader built using Electron and dgrid.

# Features

- Organize feeds in nested folders
- Import feeds from OPML (export not supported at this time)
- Pin articles to store them indefinitely
- Download individual articles as complete web pages to read offline (using icon in top right)
- RegExp search within article titles and content
- Configure how many articles to keep, how often to update, and whether to display images
  - Defaults can be configured globally (via Preferences), then overridden per-feed
- Zip distributions support portable mode via `--portable` command-line flag
  - On Mac OS X, you can run `open Electern.app --args --portable`; user data will be saved under the
    `Contents/MacOS` folder within the app.

# Build Instructions

## Requirements

You will need `bower` installed globally (i.e. `npm i -g bower`).

## Development

1. Clone this repository
1. `npm i` (which will in turn run `bower install`)
1. `npm start`
1. If you will be editing SCSS, also run `npm run scss:watch`

## Release

It is possible to build for all platforms from OS X.

`brew install fakeroot dpkg wine-stable` to install prequisites

`npm run make-all` to build for all platforms under `out` subfolder

On other platforms, `npm run make` will build for the current platform only.

## License

[MIT](LICENSE)
