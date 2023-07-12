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

import parseISO from 'date-fns/parseISO';
import formatISO from 'date-fns/formatISO';
import format from 'date-fns/format';
import addDays from 'date-fns/addDays';
import { S3 } from 'aws-sdk';

import * as caseApi from '../../../src/case/case';
import * as context from '../../../src/data-pull-task/khp-data-pull-task/context';
import { defaultLimitAndOffset } from '../../../src/data-pull-task/khp-data-pull-task/auto-paginate';
import { pullCases } from '../../../src/data-pull-task/khp-data-pull-task/pull-cases';

const { maxPermissions } = context;

const accountSid = 'ACxxx';
const bucketName = 'docs-bucket';

jest.mock('../../../src/contact/contact');
jest.mock('../../../src/data-pull-task/khp-data-pull-task/context');

const getExpectedS3Params = (cas: caseApi.Case) => {
  const date = format(cas.updatedAt as unknown as Date, 'yyyy/MM/dd');
  return {
    Bucket: bucketName,
    Key: `hrm-data/${date}/cases/${cas.id}.json`,
    Body: JSON.stringify(cas),
  };
};

let uploadSpy;
const promiseSpy = jest.fn();

beforeEach(() => {
  uploadSpy = jest.fn().mockReturnValue({ promise: promiseSpy });

  const s3Client = {
    upload: uploadSpy,
  } as unknown as S3;

  const getContextResponse = Promise.resolve({
    accountSid,
    bucketName,
    s3Client,
  });

  jest.spyOn(context, 'getContext').mockReturnValue(getContextResponse);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('KHP Data Pull - Pull Cases', () => {
  const startDate = parseISO('2023-05-01T00:00:00.000Z');
  const endDate = parseISO('2023-05-30T00:00:00.000Z');

  const searchParams = {
    filters: {
      updatedAt: {
        from: formatISO(startDate),
        to: formatISO(endDate),
      },
    },
  };

  test('should call searchCases with the correct params', async () => {
    const searchCasesResponse = Promise.resolve({
      count: 0,
      cases: [],
    });

    const searchCasesSpy = jest
      .spyOn(caseApi, 'searchCases')
      .mockReturnValue(searchCasesResponse);

    await pullCases(startDate, endDate);

    expect(searchCasesSpy).toHaveBeenCalledWith(
      accountSid,
      defaultLimitAndOffset,
      searchParams,
      maxPermissions,
    );
  });

  test('should call upload to S3 with the correct params', async () => {
    const case1 = {
      id: 1234,
      categories: {},
      connectedContacts: [],
      info: {},
      helpline: 'helpline',
      status: 'open',
      twilioWorkerId: 'Wkxxx',
      createdBy: 'Wkxxx',
      updatedBy: 'Wkxxx',
      accountSid,
      createdAt: addDays(startDate, 1) as unknown as string, // The type defines this as string, but it's actually as Date
      updatedAt: addDays(startDate, 1) as unknown as string,
    };

    const case2 = {
      id: 2345,
      categories: {},
      connectedContacts: [],
      info: {},
      helpline: 'helpline',
      status: 'open',
      twilioWorkerId: 'Wkxxx',
      createdBy: 'Wkxxx',
      updatedBy: 'Wkxxx',
      accountSid,
      createdAt: addDays(startDate, 2) as unknown as string,
      updatedAt: addDays(startDate, 2) as unknown as string,
    };

    const searchCasesResponse = Promise.resolve({
      count: 2,
      cases: [case1, case2],
    });

    jest.spyOn(caseApi, 'searchCases').mockReturnValue(searchCasesResponse);

    await pullCases(startDate, endDate);

    expect(uploadSpy).toHaveBeenCalledWith(getExpectedS3Params(case1));
    expect(uploadSpy).toHaveBeenCalledWith(getExpectedS3Params(case2));

    expect(promiseSpy).toBeCalledTimes(2);
  });
});