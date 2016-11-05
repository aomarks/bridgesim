

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    // STUN servers
    {urls: 'stun:stun.l.google.com:19302'},
    {urls: 'stun:stun1.l.google.com:19302'},

    // TURN servers
    // RTCIceServer typings is missing username.
    {
      urls: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    } as any,
  ]
};
