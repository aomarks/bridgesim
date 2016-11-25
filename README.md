# bridgesim

[![Build Status](https://travis-ci.org/aomarks/bridgesim.svg?branch=master)](https://travis-ci.org/aomarks/bridgesim)

A starship bridge simulator for the web. A work in progress.

Try it out at [aomarks.github.io/bridgesim](https://aomarks.github.io/bridgesim/) (currently Chrome only).

Built with [Polymer](https://www.polymer-project.org/),
[TypeScript](https://www.typescriptlang.org/),
and [WebRTC](https://webrtc.org/).

![Screenshot](/screenshot.png)

## Developing

### Setup
Assumes [Node.js](https://nodejs.org/en/) is installed.

```sh
npm install -g yarn && yarn install
```

### Build
Continuously watch for changes, compile all `.ts` files, and bundle for development serving.
```sh
npm run watch
```

## Serve

```sh
npm run serve
google-chrome http://localhost:8080/
```

### Test
Run tests once:
```sh
npm run test
```

Run tests continuously on every change:
```sh
npm run watch-test
```

### URLs
URL hash determines the game to connect to:
```
#host   # Launch host.
#local  # Connect to a host running in another tab.
#abc123 # Connect to a game with the given token through the lobby server.
```

URL query parameters set debugging options:
```
?station=weapons # Default to the given station.
?autostart       # If hosting, start the game immediately.
?metrics         # Show FPS, data usage, etc.
```

Example:
```
http://localhost:8080/?station=weapons&metrics&autostart#host
```

## Deploy
Build a vulcanized and minified version for deployment. Outputs to `dist/`.
```sh
npm run build
```

## Lobby Service
See [webrtc-lobby](https://github.com/d4l3k/webrtc-lobby) for details about running a lobby service for bridgesim to connect to. There's a hosted version at `wss://fn.lc/lobby`.

## Authors
[Al Marks](https://github.com/aomarks), [Tristan Rice](https://github.com/d4l3k), and [others](https://github.com/aomarks/bridgesim/graphs/contributors).

Licensed under the [MIT License](https://opensource.org/licenses/MIT).
