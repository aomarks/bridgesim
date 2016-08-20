# bridgesim

It's a starship bridge simulator.

## Install/Update Dependencies
Node.JS and NPM are required.

```sh
rpm run deps
```

## Developing
### Build TypeScript
This command compiles all `.ts` files in the project and will recompile if
there are any changes made to them.
```sh
npm run watch
```

### Run
```sh
http-server -c-1
google-chrome http://localhost:8080/
```
Use WASD to pilot.

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

### Test
Run all tests (includes compilation).
```sh
npm run test
```

Run all tests (includes compilation) and watch for changes.
```sh
npm run watch-test
```

## Deploy
To build the production version of the app run the build script. This
automatically compiles the typescript, vulcanizes and minifies the source code.
Output goes into `build/`.
```sh
node ./build.js
```

## Lobby Service

See [webrtc-lobby](https://github.com/d4l3k/webrtc-lobby) for details about running a lobby service for bridgesim to connect to. There's a hosted version at `wss://fn.lc/lobby`.
