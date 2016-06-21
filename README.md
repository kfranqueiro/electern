# Electern

Electern is an Atom/RSS feed reader built using Electron and dgrid.

# Features

* Organize feeds in nested folders
* Import feeds from OPML (export not supported at this time)
* Pin articles to store them indefinitely
* Download individual articles as complete web pages to read offline (using icon in top right)
* RegExp search within article titles and content
* Configure how many articles to keep, how often to update, and whether to display images
  * Defaults can be configured globally (via Preferences), then overridden per-feed
* Supports portable mode via `--portable` command-line flag
  * On Mac OS X, you can run `open Electern.app --args --portable`; user data will be saved under the
    `Contents/MacOS` folder within the app.

# Build Instructions

## Requirements

You will need `bower` and `grunt-cli` installed globally (i.e. `npm i -g bower grunt-cli`).

## Development

1. Clone this repository
1. `npm install` (which will in turn run `bower install`, then `npm install` inside of `src`)
1. `grunt dev`

## Release

Run `grunt release`

# Usage

## Running the Application

### Development

Run `bin/run` (or `bin\run.cmd` on Windows).

### Release

Run the application for the respective platform under `dist`.

## License

[MIT](LICENSE)
