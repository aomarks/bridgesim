///<reference path="../bower_components/polymer-ts/polymer-ts.d.ts" />
///<reference path="../typings/index.d.ts" />

import {WebRTCConnection, decodeRSD, encodeRSD} from '../net/webrtc';
import {RTC_CONFIG} from './webrtc-config';

@component('bridgesim-join')
class Join extends polymer.Base {
  @property({type: Boolean, value: false}) active: boolean;
  @property({type: String, value: null}) token: string;
  @property({type: Boolean, value: true}) invalid: boolean;
  @property({type: Boolean, value: false}) connecting: boolean;
  @property({type: String, value: null}) error: string;
  @property({type: Boolean, computed: 'computeCanJoin(invalid, connecting)'})
  canJoin: boolean;

  @observe('active')
  activeChanged(active: boolean) {
    if (active) {
      // TODO Is there a better way to get focus to work than with async?
      this.async(() => { this.$.tokenInput.$.input.focus(); }, 1);
    }
  }

  computeCanJoin(invalid: boolean, connecting: boolean): boolean {
    return !invalid && !connecting;
  }

  @observe('token')
  tokenChanged() {
    this.error = null;
  }

  cancel() {
    this.token = null;
    this.fire('cancel');
  }

  join() {
    this.connecting = true;
    const con = new WebRTCConnection(RTC_CONFIG);

    con.onOpen = () => {
      this.connecting = false;
      document.location.hash = this.token;
      this.fire('connection', con);
    };

    con.makeOffer().then(offer => {
      this.$.lobbyList.connect(this.token, encodeRSD(offer), '')
          .then((resp: {Answer: string}) => {
            con.takeAnswer(decodeRSD(resp.Answer));
          })
          .catch(error => {
            this.error = error;
            this.connecting = false;
            con.onOpen = null;
          });
    });
  }
}
Join.register();
