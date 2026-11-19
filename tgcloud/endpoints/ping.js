import { EndpointError } from 'sdk';

// tgcloud/endpoints/ping.js — verified test endpoint for Phase 0
export default async function (input, ctx) {
  const user = ctx?.initData?.user || null;
  return {
    ok: true,
    pong: true,
    serverTime: Date.now(),
    authenticatedUser: user ? {
      id: user.id,
      firstName: user.first_name,
      username: user.username,
    } : null,
    echoInput: input,
  };
}
