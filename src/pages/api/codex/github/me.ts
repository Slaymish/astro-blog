import { accountStatus } from '../../../../server/codexContributions';
export const prerender = false;
export const GET = ({ request }: { request: Request }) => accountStatus(request);
