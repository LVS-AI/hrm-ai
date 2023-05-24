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

import { convertIndexDocument } from './convert-index-document';
import { FlatResource } from '@tech-matters/types';

const BASELINE_DATE = new Date('2021-01-01T00:00:00.000Z');

describe('convertIndexDocument', () => {
  it('should convert a simple document', () => {
    // TODO: need a real example of a document to test against because I still have no idea what these are supposed to look like
    const resource: FlatResource = {
      name: 'Resource',
      id: '1234',
      lastUpdated: BASELINE_DATE.toISOString(),
      stringAttributes: [
        {
          key: 'title',
          value: 'This is the english title',
          language: 'en',
          info: 'info about the title',
        },
        { key: 'title', value: 'This is the french title', language: 'fr' },
        { key: 'description', value: 'This is the description', language: '' },
        { key: 'keywords', value: 'keyword1', language: '' },
        { key: 'keywords', value: 'keyword2', language: '' },
      ],
      numberAttributes: [
        { key: 'eligibilityMinAge', value: 10 },
        { key: 'eligibilityMaxAge', value: 20 },
      ],
      booleanAttributes: [],
      dateTimeAttributes: [],
      referenceStringAttributes: [
        { key: 'feeStructure', list: 'feeStructures', value: 'free', language: '' },
        { key: 'province', list: 'provinces', value: 'ON', language: '' },
        { key: 'city', list: 'cities', value: 'Toronto', language: '' },
      ],
    };

    const document = convertIndexDocument(resource);

    expect(document).toEqual({
      name: 'Resource',
      high_boost_global: 'This is the english title This is the french title',
      low_boost_global: 'This is the description',
      eligibilityMinAge: 10,
      eligibilityMaxAge: 20,
      city: 'Toronto',
      feeStructure: 'free',
      keywords: ['keyword1', 'keyword2'],
      province: 'ON',
    });
  });
});
