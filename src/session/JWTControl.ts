// tslint:disable-next-line:max-line-length
import { decode, DecodeOptions, Secret, sign, SignOptions, verify, VerifyOptions } from 'jsonwebtoken';
import { Data, Scope, SessionId, UserID } from './Session';

// tslint:disable-next-line:max-line-length
const defaultPrivateKeyRS512 = Buffer.from('LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBbnp5aXMxWmpmTkIwYkJnS0ZNU3Z2a1R0d2x2QnNhSnE3UzV3QStremVWT1ZwVld3CmtXZFZoYTRzMzhYTS9wYS95cjQ3YXY3K3ozVlRtdkRSeUFIY2FUOTJ3aFJFRnBMdjljajVsVGVKU2lieXIvTXIKbS9ZdGpDWlZXZ2FPWUlod3JYd0tMcVByLzExaW5Xc0FrZkl5dHZIV1R4WllFY1hMZ0FYRnVVdWFTM3VGOWdFaQpOUXd6R1RVMXYwRnFrcVRCcjRCOG5XM0hDTjQ3WFV1MHQ4WTBlK2xmNHM0T3hRYXdXRDc5SjkvNWQzUnkwdmJWCjNBbTFGdEdKaUp2T3dSc0lmVkNoRHBZU3RUY0hUQ01xdHZXYlY2TDExQldrcHpHWFNXNEh2NDNxYStHU1lPRDIKUVU2OE1iNTlvU2syT0IrQnRPTHBKb2ZtYkdFR2d2bXd5Q0k5TXdJREFRQUJBb0lCQUNpQVJxMndrbHRqdGNqcwprRnZaN3cxSkFPUkhiRXVmRU8xRXUyN3pPSWxxYmd5QWNBbDdxKy8xYmlwNFoveDFJVkVTODQveVRhTThwMGdvCmFtTWh2Z3J5L21TOHZOaTFCTjJTQVpFbmIvN3hTeGJmbGI3MGJYOVJITEpxS25wNUdaZTJqZXh3K3d5WGx3YU0KK2JjbFVDcmg5ZTFsdEg3SXZVclJyUW5GSmZoK2lzMWZSb245Q285TGkwR3dvTjB4MGJ5cnJuZ1U4QWszWTZEOQpEOEdqUUE0RWxtOTRTVDNpekp2OGlDT0xTREJtenNQc1hmY0NVWmZtVGZaNURiVURNYk14Um5TbzNuUWVvS0dDCjBMajlGa1djZm1MY3BHbFNYVE8rV3cxTDdFR3ErUFQzTnRSYWUxRlpQd2pkZFExLzRWOTA1a3lRRkxhbUFBNVkKbFNwRTJ3a0NnWUVBeTFPUExRY1p0NE5RblF6UHoyU0JKcVFOMlA1dTN2WGwrek5WS1A4dzRlQnYwdld1SkpGKwpoa0dOblN4WFFyVGt2RE9JVWRkU0tPekhIZ1NnNG5ZNkswMmVjeVQwUFBtL1VadnRScFdybkJqY0VWdEhFSk5wCmJVOXBMRDVpWjBKOXNielBVL0x4UG11QVAyQnM4Sm1UbjZhRlJzcEZyUDdXMHMxTm1rMmpzbTBDZ1lFQXlIMFgKK2pwb3F4ajRlZlpma1VyZzVHYlNFaGYrZFpnbGYwdFRPQTViVmc4SVl3dG1Oay9wbmlMRy96STdjK0dsVGM5QgpCd2ZNcjU5RXpCcS9lRk1JNytMZ1hhVlVzTS9zUzRSeSt5ZUs2U0p4L290SU1XdERmcXhzTEQ4Q1BNQ1J2ZWNDCjJQaXA0dVNncmwwTU9lYmw5WEtwNTdHb2FVV1JXUkhxd1Y0WTZoOENnWUFaaEk0bWg0cVp0bmhLalk0VEtEangKUVl1ZlhTZExBaTl2M0Z4bXZjaER3T2duNEwrUFJWZE13RE5tczJic0wwbTV1UG4xMDRFek02dzF2enoxendLego1cFRwUEkwT2pnV04xM1RxOCtQS3ZtLzRHYTJNamdPZ1BXUWtzbHVsTy9vTWNYYlB3V0MzaGNSZHI5dGNRdG45CkltZjluMnNwTC82RURGSWQrSHAvN1FLQmdBcWxXZGlYc1dja2RFMUZuOTEvTkdIc2M4c3lLdmpqazFvbkRjdzAKTnZWaTV2Y2JhOW9HZEVsSlgzZTlteHFVS01ydzdtc0pKdjFNWDhMV3lNUUM1TDZZTllIRGZiUEYxcTVMNGk4ago4bVJleDk3VVZva0pRUlJBNDUyVjJ2Q082UzVFVGdwbmFkMzZkZTNNVXhIZ0NPWDNxTDM4MlF4OS9USFZtYm1hCjNZZlJBb0dBVXhML0V1NXl2TUs4U0F0L2RKSzZGZWRuZ2NNM0pFRk5wbG10TFlWTFdoa0lsTlJHRHdrZzNJNUsKeTE4QWU5bjdkSFZ1ZXlzbHJiNndlcTdkVGtZRGkzaU9ZUlc4SFJrSVFoMDZ3RWRieHQwc2hUekFKdnZDUWZyQgpqZy8zNzQ3V1NzZi96QlRjSGloVFJCZEF2Nk9tZGhWNC9kRDVZQmZMQWtMcmQrbVg3aUU9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0t', 'base64');

// tslint:disable-next-line:max-line-length
const defaultPublicKeyRS512 = Buffer.from('LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFuenlpczFaamZOQjBiQmdLRk1Tdgp2a1R0d2x2QnNhSnE3UzV3QStremVWT1ZwVld3a1dkVmhhNHMzOFhNL3BhL3lyNDdhdjcrejNWVG12RFJ5QUhjCmFUOTJ3aFJFRnBMdjljajVsVGVKU2lieXIvTXJtL1l0akNaVldnYU9ZSWh3clh3S0xxUHIvMTFpbldzQWtmSXkKdHZIV1R4WllFY1hMZ0FYRnVVdWFTM3VGOWdFaU5Rd3pHVFUxdjBGcWtxVEJyNEI4blczSENONDdYVXUwdDhZMAplK2xmNHM0T3hRYXdXRDc5SjkvNWQzUnkwdmJWM0FtMUZ0R0ppSnZPd1JzSWZWQ2hEcFlTdFRjSFRDTXF0dldiClY2TDExQldrcHpHWFNXNEh2NDNxYStHU1lPRDJRVTY4TWI1OW9TazJPQitCdE9McEpvZm1iR0VHZ3Ztd3lDSTkKTXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t', 'base64');

checkWarningPublicKeyVulnerable.warned = false;
function checkWarningPublicKeyVulnerable<T>(secretOrPublicKey: T | Buffer) {
  if (!checkWarningPublicKeyVulnerable.warned && defaultPublicKeyRS512 === secretOrPublicKey) {
    checkWarningPublicKeyVulnerable.warned = true;
    process.emitWarning(
      'You are using a vulnerable public key.',
      'JsonWebTokenControl#secretOrPublicKey',
    );
  }
  return secretOrPublicKey;
}

checkWarningPrivateKeyVulnerable.warned = false;
function checkWarningPrivateKeyVulnerable<T>(secretOrPrivateKey: T | Buffer) {
  if (!checkWarningPrivateKeyVulnerable.warned && defaultPrivateKeyRS512 === secretOrPrivateKey) {
    checkWarningPrivateKeyVulnerable.warned = true;
    process.emitWarning(
      'You are using a vulnerable private key.',
      'JsonWebTokenControl#secretOrPrivateKey',
    );
  }
  return secretOrPrivateKey;
}

export interface TokenDecoded {
  refreshAt: number;
  exp: number;
  iat: number;
  sessionId: SessionId;
  data: Data;
  scope: Scope;
  userId: UserID;
}

export interface JWTControlOption {
  algorithm?: 'HS256'
  | 'HS384'
  | 'HS512'
  | 'RS256'
  | 'RS384'
  | 'RS512'
  | 'ES256'
  | 'ES384'
  | 'ES512'
  | 'PS256'
  | 'PS384';
  signOptions?: SignOptions;
  verifyOptions?: VerifyOptions;
  secret?: string | Buffer;
  privateKey?: Secret;
  publicKey?: string | Buffer;
}

export class JWTControl {
  readonly signOptions: SignOptions;
  readonly verifyOptions: VerifyOptions;
  readonly secretOrPrivateKey: Secret;
  readonly secretOrPublicKey: string | Buffer;

  constructor({
    signOptions = {},
    verifyOptions = {},
    secret,
    algorithm = secret ? 'HS512' : 'RS512',
    privateKey = secret || defaultPrivateKeyRS512,
    publicKey = secret || defaultPublicKeyRS512,
  }: JWTControlOption = {}) {
    this.signOptions = {
      algorithm,
      ...signOptions,
    };

    this.verifyOptions = {
      algorithms: [algorithm],
      ...verifyOptions,
    };

    this.secretOrPublicKey = checkWarningPublicKeyVulnerable(publicKey);
    this.secretOrPrivateKey = checkWarningPrivateKeyVulnerable(privateKey);
  }

  sign(payload: string | Buffer | object, options?: SignOptions) {
    return sign(payload, this.secretOrPrivateKey, {
      ...this.signOptions,
      ...options,
    });
  }

  decode(token: string, options?: DecodeOptions) {
    return <TokenDecoded>decode(token, options);
  }

  verify(token: string, options?: VerifyOptions) {
    return <TokenDecoded>verify(token, this.secretOrPublicKey, {
      ...this.verifyOptions,
      ...options,
    });
  }
}
