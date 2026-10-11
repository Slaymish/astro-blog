import { identity } from '../../../../server/codexAuth';
export const prerender = false;
export async function GET({ request }: { request: Request }): Promise<Response> {
  const user = await identity(request);
  return new Response(JSON.stringify(user ? { authenticated: true, login: user.login } : { authenticated: false }), {
    status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
