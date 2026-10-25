import { startOAuth } from '../../../../server/codexOAuth';
export const prerender = false;
export const GET = ({ request }: { request: Request }) => startOAuth(request);
