import { contributionRequest } from '../../server/codexContributions';
export const prerender = false;
export const POST = ({ request }: { request: Request }) => contributionRequest(request);
export const PATCH = POST;
export const DELETE = POST;
