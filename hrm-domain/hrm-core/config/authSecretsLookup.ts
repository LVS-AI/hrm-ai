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

import type { AuthSecretsLookup } from '@tech-matters/twilio-worker-auth';
import { getFromSSMCache } from './ssmConfigurationCache';

const authTokenLookup = async (accountSid: string) => {
  if (process.env[`TWILIO_AUTH_TOKEN_${accountSid}`]) {
    return process.env[`TWILIO_AUTH_TOKEN_${accountSid}`] || '';
  }

  const { authToken } = await getFromSSMCache(accountSid);
  return authToken;
};

const staticKeyLookup = async (keySuffix: string) => {
  const staticSecretKey = `STATIC_KEY_${keySuffix}`;
  if (process.env[staticSecretKey]) {
    return process.env[staticSecretKey] || '';
  }

  const { staticKey } = await getFromSSMCache(keySuffix);
  return staticKey;
};

export const defaultAuthSecretsLookup: AuthSecretsLookup = {
  authTokenLookup,
  staticKeyLookup,
};
