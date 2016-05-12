# bridgesim

It's a starship bridge simulator.

## Install Dependencies
```
npm -g install bower typescript typings
npm install
bower install
typings install
```

## Developing
### Build TypeScript
This command compiles all `.ts` files in the project and will recompile if
there are any changes made to them.
```
npm run watch
```

### Run
```
python -m SimpleHTTPServer                 # Launch webserver on port 8000
google-chrome http://localhost:8000?host   # Open host tab
google-chrome http://localhost:8000?client # Open client tab
```
Use WASD to pilot.


### Test
Run all tests (includes compilation).
```
npm run test
```

Run all tests (includes compilation) and watch for changes.
```
npm run watch-test
```

## Deploy
To build the production version of the app run the build script. This
automatically compiles the typescript, vulcanizes and minifies the source code.
Output goes into `build/`.
```
node ./build.js
```


## Lobby Service

See [webrtc-lobby](https://github.com/d4l3k/webrtc-lobby) for details about running a lobby service for bridgesim to connect to. There's a hosted version at `wss://fn.lc/lobby`.
