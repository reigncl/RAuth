import { expect } from "chai";
import { ConnectionStore } from "../store/ConnectionStore";
import { Session } from "./Session";
import { SessionControl } from "./SessionControl";

describe('Session', () => {
  it('Create', () => {
    const session = Session.from({
      userId: 'userid',
      scope: 'profile',
      clientId: 'asd',
    });

    expect(session.accessToken).to.be.a('string')
    expect(session.refreshToken).to.be.a('string')
  });

  it('Create session only access token', () => {
    const session = Session.from({
      userId: 'userid',
      scope: 'profile',
      clientId: 'asd',
      mode: 'OnlyAccessToken',
    });

    expect(session.accessToken).to.be.a('string');
    expect(session.refreshToken).to.be.undefined;
  });
});
