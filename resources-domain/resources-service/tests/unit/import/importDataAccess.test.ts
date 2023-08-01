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

import * as pgPromise from 'pg-promise';
import { subHours } from 'date-fns';
import { mockConnection, mockTransaction } from '../mock-db';
import {
  updateImportProgress,
  upsertImportedResource,
} from '../../../src/import/importDataAccess';
import { getSqlStatement } from '@tech-matters/testing';
import { BLANK_ATTRIBUTES } from '../../mockResources';
import { TimeSequence } from '@tech-matters/types/dist/Resources';

let conn: pgPromise.ITask<unknown>;

const BASELINE_DATE = new Date(2012, 11, 4);

const timeSequenceFromDate = (date: Date, sequence = 0): TimeSequence =>
  `${date.valueOf()}-${sequence}`;

beforeEach(() => {
  conn = mockConnection();
});

describe('upsertImportedResource', () => {
  test('No attributes - should run an insert', async () => {
    mockTransaction(conn);
    const noneSpy = jest.spyOn(conn, 'none').mockResolvedValue(null);
    const result = await upsertImportedResource()('AC_FAKE', {
      name: 'Test Resource',
      id: 'TEST_RESOURCE',
      accountSid: 'AC_FAKE',
      lastUpdated: BASELINE_DATE.toISOString(),
      ...BLANK_ATTRIBUTES,
    });
    const insertSql = getSqlStatement(noneSpy);
    expect(insertSql).toContain('Resources');
    expect(insertSql).toContain('TEST_RESOURCE');
    expect(insertSql).toContain('Test Resource');
    expect(insertSql).toContain(BASELINE_DATE.toISOString());
    expect(insertSql).toContain('AC_FAKE');
    expect(result).toStrictEqual({ id: 'TEST_RESOURCE', success: true });
  });
  test('Inline attributes - should run an insert per attribute', async () => {
    mockTransaction(conn);
    const noneSpy = jest.spyOn(conn, 'none').mockResolvedValue(null);
    const result = await upsertImportedResource()('AC_FAKE', {
      name: 'Test Resource',
      id: 'TEST_RESOURCE',
      accountSid: 'AC_FAKE',
      ...BLANK_ATTRIBUTES,
      stringAttributes: [
        {
          key: 'Test String Attribute',
          value: 'Test String Value',
          info: {},
          language: 'en-IE',
        },
      ],
      numberAttributes: [
        {
          key: 'Test Number Attribute',
          value: 1337,
          info: {},
        },
      ],
      booleanAttributes: [
        {
          key: 'Test Boolean Attribute',
          value: true,
          info: {},
        },
      ],
      dateTimeAttributes: [
        {
          key: 'Test DateTime Attribute',
          value: subHours(BASELINE_DATE, 1).toISOString(),
          info: {},
        },
      ],
      lastUpdated: BASELINE_DATE.toISOString(),
    });
    const insertSql = getSqlStatement(noneSpy);
    expect(insertSql).toContain('Resources');
    expect(insertSql).toContain('TEST_RESOURCE');
    expect(insertSql).toContain('Test Resource');
    expect(insertSql).toContain(BASELINE_DATE.toISOString());
    expect(insertSql).toContain('AC_FAKE');
    expect(insertSql).toContain('Test String Attribute');
    expect(insertSql).toContain('Test String Value');
    expect(insertSql).toContain("'en-IE'");
    expect(insertSql).toContain('Test Boolean Attribute');
    expect(insertSql).toContain('true');
    expect(insertSql).toContain('{}');
    expect(insertSql).toContain('Test Number Attribute');
    expect(insertSql).toContain('1337');
    expect(insertSql).toContain('Test DateTime Attribute');
    expect(insertSql).toContain(subHours(BASELINE_DATE, 1).toISOString());
    expect(result).toStrictEqual({ id: 'TEST_RESOURCE', success: true });
  });
  test('Reference attributes - should run an insert per attribute', async () => {
    mockTransaction(conn);
    const noneSpy = jest.spyOn(conn, 'none').mockResolvedValue(null);
    const result = await upsertImportedResource()('AC_FAKE', {
      accountSid: 'AC_FAKE',
      name: 'Test Resource',
      id: 'TEST_RESOURCE',
      ...BLANK_ATTRIBUTES,
      referenceStringAttributes: [
        {
          key: 'Test Reference Attribute',
          value: 'Test Reference Value',
          language: 'en-IE',
          list: "List o' strings",
        },
      ],
      lastUpdated: BASELINE_DATE.toISOString(),
    });
    const insertSql = getSqlStatement(noneSpy);
    expect(insertSql).toContain('Resources');
    expect(insertSql).toContain('TEST_RESOURCE');
    expect(insertSql).toContain('Test Resource');
    expect(insertSql).toContain(BASELINE_DATE.toISOString());
    expect(insertSql).toContain('AC_FAKE');
    expect(result).toStrictEqual({ id: 'TEST_RESOURCE', success: true });
  });
});

describe('updateImportProgress', () => {
  test('Should upsert progress against account key', async () => {
    mockTransaction(conn);
    const noneSpy = jest.spyOn(conn, 'none').mockResolvedValue(null);
    await updateImportProgress()(
      'AC_FAKE',
      {
        fromSequence: timeSequenceFromDate(subHours(BASELINE_DATE, 12)),
        toSequence: timeSequenceFromDate(BASELINE_DATE),
        remaining: 1234,
        lastProcessedDate: subHours(BASELINE_DATE, 6).toISOString(),
        lastProcessedId: 'TEST_RESOURCE',
      },
      4242,
    );
    const insertProgressSql = getSqlStatement(noneSpy, 0);
    expect(insertProgressSql).toContain('Accounts');
    expect(insertProgressSql).toContain('1234');
    expect(insertProgressSql).toContain('AC_FAKE');
    expect(insertProgressSql).toContain(timeSequenceFromDate(BASELINE_DATE));
    expect(insertProgressSql).toContain(
      timeSequenceFromDate(subHours(BASELINE_DATE, 12)),
    );
    expect(insertProgressSql).toContain(subHours(BASELINE_DATE, 6).toISOString());

    const insertBatchSql = getSqlStatement(noneSpy, 1);
    expect(insertBatchSql).toContain('ImportBatches');
    expect(insertBatchSql).toContain('4242');
    expect(insertProgressSql).toContain('AC_FAKE');
    expect(insertBatchSql).toContain(timeSequenceFromDate(BASELINE_DATE));
    expect(insertBatchSql).toContain(timeSequenceFromDate(subHours(BASELINE_DATE, 12)));
  });
});
