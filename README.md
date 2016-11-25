# bridgesim

[![Build Status](https://travis-ci.org/aomarks/bridgesim.svg?branch=master)](https://travis-ci.org/aomarks/bridgesim)

A starship bridge simulator for the web. A work in progress.

Try it out at [aomarks.github.io/bridgesim](https://aomarks.github.io/bridgesim/) (currently Chrome only).

Built with [Polymer](https://www.polymer-project.org/),
[TypeScript](https://www.typescriptlang.org/),
and [WebRTC](https://webrtc.org/).

![Screenshot](/screenshot.png)

## Developing
Assumes [Node.js](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/) are installed.

```sh
yarn install       # Initial setup.
npm run watch      # Build continuously on change.
npm run serve      # Serve on port 8080.
npm test           # Run tests once.
npm run watch-test # Run tests continuously on change.
npm run build      # Build vulcanized/minified deployment to dist/.
```

URL hash and query params can be useful for development:

```
#host            # Launch host.
#local           # Connect to a host running in another tab.
#abc123          # Connect to a game with the given token through the lobby server.
?station=weapons # Default to the given station.
?autostart       # If hosting, start the game immediately.
?metrics         # Show FPS, data usage, etc.
```

## Lobby Service
See [webrtc-lobby](https://github.com/d4l3k/webrtc-lobby) for details about running a lobby service for bridgesim to connect to. There's a hosted version at `wss://fn.lc/lobby`.

## Authors
[Al Marks](https://github.com/aomarks), [Tristan Rice](https://github.com/d4l3k), and [others](https://github.com/aomarks/bridgesim/graphs/contributors).

Licensed under the [MIT License](https://opensource.org/licenses/MIT).
