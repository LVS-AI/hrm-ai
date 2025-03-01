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

// eslint-disable-next-line import/no-extraneous-dependencies
import supertest from 'supertest';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  configureDefaultPostMiddlewares,
  configureDefaultPreMiddlewares,
} from '@tech-matters/http';
import express from 'express';
import type { AuthSecretsLookup } from '@tech-matters/twilio-worker-auth';

import { configureInternalService, configureService } from '../../src/service';

export const defaultConfig: {
  authSecretsLookup: AuthSecretsLookup;
} = {
  authSecretsLookup: {
    authTokenLookup: () => Promise.resolve('picernic basket'),
    staticKeyLookup: keySuffix =>
      Promise.resolve(process.env[`STATIC_KEY_${keySuffix}`] || ''),
  },
};

export const getServer = (config?: Partial<typeof defaultConfig>) => {
  process.env.AWS_ACCESS_KEY_ID = 'mock-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'mock-secret-key';
  process.env.ELASTICSEARCH_CONFIG_node = 'http://localhost:9200';

  const withoutService = configureDefaultPreMiddlewares(express());
  const withService = configureService({
    ...defaultConfig,
    ...config,
    webServer: withoutService,
  });
  return configureDefaultPostMiddlewares(withService, true).listen();
};

const defaultInternalServiceConfig = {
  reindexDbBatchSize: 4,
};

export const getInternalServer = () => {
  process.env.AWS_ACCESS_KEY_ID = 'mock-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'mock-secret-key';
  const withoutService = configureDefaultPreMiddlewares(express());
  const withService = configureInternalService({
    ...defaultConfig,
    ...defaultInternalServiceConfig,
    webServer: withoutService,
  });
  return configureDefaultPostMiddlewares(withService, true).listen();
};

export const getRequest = (server: ReturnType<typeof getServer>) =>
  supertest.agent(server);

export const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer bearing a bear (rawr)`,
};

export const internalHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Basic BBC`,
};

export const adminHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Basic Fast`,
};
