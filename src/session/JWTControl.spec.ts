import { JWTControl } from "./JWTControl";
import jwt from 'jsonwebtoken';
import { expect } from "chai";

describe('JWTControl', () => {

  it('Configure JWK', async () => {
    const jwtControl = new JWTControl({ signOptions: { keyid: 'aaa' } });

    const jwk = await jwtControl.toJWK();

    expect(jwk.alg).to.be.a('string');
    expect(jwk.n).to.be.a('string');
    expect(jwk.kid).to.be.a('string').and.equal('aaa');
  })

  it('Sign', () => {
    const jwtControl = new JWTControl({ signOptions: { keyid: 'aaa', issuer: 'http://local' } })

    const signDecode = jwt.decode(jwtControl.sign({ a: 3 }), { json: true, complete: true });

    expect(signDecode?.header?.kid).to.be.equal('aaa');
    expect(signDecode?.payload?.iss).to.be.equal('http://local');
  });

});
