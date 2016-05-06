It's a starship bridge simulator.

### Install
```
npm -g install bower typescript typings
bower install
typings install
```

### Build
```
tsc -w
```

### Run
```
python -m SimpleHTTPServer
google-chrome http://localhost:8000?host
google-chrome http://localhost:8000?client
WASD to pilot
```


### Lobby Service

See [webrtc-lobby](https://github.com/d4l3k/webrtc-lobby) for details about running a lobby service for bridgesim to connect to. There's a hosted version at `wss://fn.lc/lobby`.
