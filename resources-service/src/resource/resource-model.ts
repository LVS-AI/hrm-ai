/**
 * Copyright (C) 2021-2023 Technology Matters
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import { AccountSID } from '@tech-matters/twilio-worker-auth';
import {
  getById,
  getByIdList,
  getWhereNameContains,
  ReferrableResource,
} from './resource-data-access';

export type SearchParameters = {
  ids: string[];
  nameSubstring?: string;
  pagination: {
    limit: number;
    start: number;
  };
};

const EMPTY_RESULT = { totalCount: 0, results: [] };
const MAX_SEARCH_RESULTS = 200;

export const getResource = (
  accountSid: AccountSID,
  resourceId: string,
): Promise<ReferrableResource | null> => getById(accountSid, resourceId);

export const searchResources = async (
  accountSid: AccountSID,
  { nameSubstring, ids = [], pagination: { limit: unboundedLimit, start } }: SearchParameters,
): Promise<{ totalCount: number; results: ReferrableResource[] }> => {
  const limit = Math.min(MAX_SEARCH_RESULTS, unboundedLimit);
  const { results: idsOfNameMatches, totalCount: nameSearchTotalCount } = nameSubstring
    ? await getWhereNameContains(accountSid, nameSubstring, start, limit)
    : EMPTY_RESULT;

  // If I'd known this logic would be such a hairball when I started writing the tests I wouldn't have bothered
  // Still, it is only temporary, once the real search is implemented we won't need to splice 2 sets of results together so it will be much simpler
  const idsToLoad = [...idsOfNameMatches, ...ids.filter(id => !idsOfNameMatches.includes(id))];
  if (!idsToLoad.length) return { results: [], totalCount: nameSearchTotalCount };
  // This might well be more than needed to meet the 'limit' criteria but best to query them all in case any of them 'miss'
  const unsortedResourceList = await getByIdList(accountSid, idsToLoad);
  const resourceMap = Object.fromEntries(
    unsortedResourceList.map(resource => [resource.id, resource]),
  );

  // Add ALL the resources found looking up specific IDs to the paginated block of name search results
  const untrimmedResults = idsToLoad
    .map(id => {
      const mappedValue = resourceMap[id];
      // So each value is only used once
      delete resourceMap[id];
      return mappedValue;
    })
    .filter(r => r);

  // Figure out the proper results for the specified pagination window from the above combined set
  const resultsStartIndex = Math.max(0, start - nameSearchTotalCount); // If the start point is past the end of those returned in the name search, we need to drop some from the start of the result set to return the correct paginated window
  const totalCount = nameSearchTotalCount + (untrimmedResults.length - idsOfNameMatches.length);
  const results = untrimmedResults.slice(resultsStartIndex, resultsStartIndex + limit);
  return { results, totalCount };
};