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

import express from 'express';
import 'express-async-errors';
import {
  addAccountSidMiddleware,
  getAuthorizationMiddleware,
  staticKeyAuthorizationMiddleware,
  adminAuthorizationMiddleware,
  type AuthSecretsLookup,
} from '@tech-matters/twilio-worker-auth';
import { adminApiV0, apiV0, internalApiV0 } from './routes';

type ResourceServiceCreationOptions = Required<{
  webServer: ReturnType<typeof express>;
  authSecretsLookup: AuthSecretsLookup;
}>;

export const configureService = ({
  webServer,
  authSecretsLookup,
}: ResourceServiceCreationOptions) => {
  const authorizationMiddleware = getAuthorizationMiddleware(authSecretsLookup);
  webServer.use(
    '/v0/accounts/:accountSid/resources',
    addAccountSidMiddleware,
    authorizationMiddleware,
    apiV0(),
  );
  return webServer;
};

type InternalResourceServiceCreationOptions = {
  webServer: ReturnType<typeof express>;
  reindexDbBatchSize?: number;
  authSecretsLookup: AuthSecretsLookup;
};

export const configureInternalService = ({
  webServer,
  reindexDbBatchSize = 1000,
  authSecretsLookup,
}: InternalResourceServiceCreationOptions) => {
  webServer.get('/resources', (req, res) => {
    res.json({
      Message: 'Resources internal service is up and running!',
    });
  });
  webServer.use(
    '/v0/accounts/:accountSid/resources',
    addAccountSidMiddleware,
    staticKeyAuthorizationMiddleware(authSecretsLookup.staticKeyLookup),
    internalApiV0(),
  );
  webServer.use(
    '/v0/resources/admin',
    adminAuthorizationMiddleware(authSecretsLookup.staticKeyLookup)('SEARCH_REINDEXER'),
    adminApiV0({ reindexDbBatchSize }),
  );
  return webServer;
};
