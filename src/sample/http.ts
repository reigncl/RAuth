import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';

import '../engines/SQLiteEngine';
import { SessionControl } from '../session/SessionControl';

const sessionControl = new SessionControl({ engineConnectionStore: 'SQLite' });

const getAauth = (authorization?: string) => {
  if (authorization) {
    const [type, sign] = authorization.split(' ');
    if (type === 'Basic') {
      return Buffer.from(sign, 'base64').toString().split(':');
    }
    if (type === 'Bearer') {
      const [headerBase64, bodyBase64] = sign.split('.');
      return [
        sign,
        JSON.parse(Buffer.from(bodyBase64, 'base64').toString()),
        JSON.parse(Buffer.from(headerBase64, 'base64').toString()),
      ];
    }
  }
  return [];
};

async function requestListener(req: IncomingMessage, res: ServerResponse) {
  const url = parse(req.url || '/', true, true);

  switch (url.pathname) {
    case '/me': {
      const [token, body, header] = getAauth(req.headers.authorization);

      await sessionControl.verify(token);

      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(body), 'utf8');
    }

    case '/logout': {
      const [token, body, header] = getAauth(req.headers.authorization);

      const session = await sessionControl.verify(token);

      await sessionControl.revokeSession(session);

      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({}), 'utf8');
    }

    case '/authorize': {
      const [username, password] = getAauth(req.headers.authorization);
      if (
        url.query.grant_type === 'basic'
        && username === 'user'
        && password === '1234'
      ) {
        const session = await sessionControl.createSession(username);

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(session), 'utf8');
      }

      if (url.query.grant_type === 'refresh_token') {
        const refreshToken = <string>url.query.refresh_token;

        const session = await sessionControl.refreshSession(refreshToken);

        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(session), 'utf8');
      }
    }
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ statusCode: '404' }), 'utf8');
}

const server = createServer(async (req, res) => {
  try {
    await requestListener(req, res);
  } catch (ex) {
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        name: ex.name,
        message: ex.message,
        stack: ex.stack,
      }),
      'utf8',
    );
  }
});

server.listen(3000, () => {
  console.log('server already on 3000');
});
