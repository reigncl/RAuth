# RAuth 🔏 - Reign Authorization and Authentication library

- Travis Master: [![Build Status](https://travis-ci.com/reigndesign/RAuth.svg?branch=master)](https://travis-ci.com/reigndesign/RAuth)
- Travis Develop: [![Build Status](https://travis-ci.com/reigndesign/RAuth.svg?branch=develop)](https://travis-ci.com/reigndesign/RAuth)

RAuth library provides a simple way for using Authorization and Authentication via JWT 
encapsulating their main methods. Allows to handle multiple sessions ensuring trust between 
an application and its users.

# How to use

```shell
$ npm install rauth
```

## Create a session control

```ts
import 'rauth/engines/SQLiteEngine';
import { SessionControl } from 'rauth/session/SessionControl';

const sessionControl = new SessionControl({ engineConnectionStore: 'SQLite' });
```

## Create an authorization handler

This handler allows create the session

```ts
// Handler to GET /authorize?grant_type=basic

// Here is your method to validate the credentials

const session = await sessionControl.createSession(username);

res.setHeader('Content-Type', 'application/json');
return res.end(JSON.stringify(session), 'utf8');
```

## Validate token

```ts
const token = query.token;
const session = await sessionControl.verify(token);
```

## Create a refresh token handler

This handler allows refresh the session.

```ts
// Handler to GET /authorize?grant_type=refresh_token&refresh_token=...
const refreshToken = query.refresh_token;

const session = await sessionControl.refreshSession(refreshToken);

res.setHeader('Content-Type', 'application/json');
return res.end(JSON.stringify(session), 'utf8');
```

## Create a revoke token handler

This handler allows revoke a refresh token.

```ts
// Handler to GET /logout
await sessionControl.revokeSession(session);

res.setHeader('Content-Type', 'application/json');
return res.end(JSON.stringify(session), 'utf8');
```

## Revoke all tokens

```ts
await sessionControl.revokeAllSessions(session)
```

## List all session

```ts
const sessions = await sessionControl.getAllSessions(session);
```

## Events

```ts
sessionControl.on('create-session', callback(){});
```

**Events list and arguments:**
- `create-session`: Event emitted after of created the object o row in your Storage.
  - Args: `{ register: Register }`
    - `regiter` (`Register`): Register inserted in your Storage.

# Engines

The engines help control the session storage. Currently, RAuth provides following engines:

- Mongoose `rauth/engines/MongooseEngine` ([Sample](/src/sample/sample-with-mongoose.ts))
- SQLite `rauth/engines/SQLiteEngine` (***Requires [`sqlite`](https://www.npmjs.com/package/sqlite) installed***)
- Memory `rauth/engines/MemoryEngine`
- TypeORM `rauth/engines/TypeormEngine` ([Sample](/src/sample/sample-with-typeorm.ts) ***Requires [`typeorm`](https://www.npmjs.com/package/typeorm) installed***)

#### Samples

**Mongoose:**
```ts
import 'rauth/engines/MongooseEngine';
export const sessionControl = new SessionControl({
  connectionStore: new ConnectionStore('Mongoose', { model: SessionModel }),
});
```

**Memory:**
```ts
import 'rauth/engines/MemoryEngine';
export const sessionControl = new SessionControl({
  engineConnectionStore: 'Memory',
});
```

**SQLite:**
```ts
import 'rauth/engines/SQLiteEngine';
export const sessionControl = new SessionControl({
  engineConnectionStore: 'SQLite',
});
// Or
import 'rauth/engines/SQLiteEngine';
export const sessionControl = new SessionControl({
  connectionStore: new ConnectionStore('SQLite', {
    filename: `${__dirname}/db.sqlite`,
    table: 'sessions',
  }),
});
```

**Typeorm:**
```ts
import '../engines/TypeormEngine';
export const sessionControl = new SessionControl({
  connectionStore: new ConnectionStore('Typeorm', { entity: Session }),
});
```
