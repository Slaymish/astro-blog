import { contributorListing } from '../../../server/codexContributions';
export const prerender = false;
export const GET = () => contributorListing();
