///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/index.d.ts" />

import {WebRTCConnection, decodeRSD, encodeRSD} from '../net/webrtc';
import {RTC_CONFIG} from './webrtc-config';

@component('bridgesim-join-screen')
class JoinScreen extends polymer.Base {
  @property({type: Boolean, value: false}) active: boolean;
  @property({type: String, value: null}) token: string;
  @property({type: Boolean, value: true}) invalid: boolean;

  @observe('active')
  activeChanged(active: boolean) {
    if (active) {
      // TODO Is there a better way to get focus to work than with async?
      this.async(() => { this.$.tokenInput.$.input.focus(); }, 1);
    }
  }

  cancel() {
    this.token = null;
    this.fire('cancel');
  }

  join() {
    this.fire('loading', 'finding game');

    const con = new WebRTCConnection(RTC_CONFIG);

    con.onOpen = () => {
      document.location.hash = this.token;
      this.fire('connection', con);
    };

    con.makeOffer()
        .then(
            offer => this.$.lobbyList.connect(this.token, encodeRSD(offer), ''))
        .then((resp: {Answer: string}) => {
          this.fire('loading', 'joining game');
          return con.takeAnswer(decodeRSD(resp.Answer));
        })
        .catch(error => {
          this.fire('error-screen', error);
          con.onOpen = null;
        });
  }
}
JoinScreen.register();
