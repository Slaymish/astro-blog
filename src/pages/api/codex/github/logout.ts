import { endSession } from '../../../../server/codexOAuth';
export const prerender = false;
export const POST = ({ request }: { request: Request }) => endSession(request);
