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

import { ContactRawJson } from '../contactJson';
import { selectSingleContactByTaskId } from './contact-get-sql';
import { TwilioUserIdentifier, WorkerSID } from '@tech-matters/types';

export type NewContactRecord = {
  rawJson: ContactRawJson;
  queueName: string;
  twilioWorkerId?: WorkerSID;
  createdBy?: TwilioUserIdentifier;
  helpline?: string;
  number?: string;
  channel?: string;
  conversationDuration: number;
  timeOfContact?: string;
  taskId: string;
  channelSid?: string;
  serviceSid?: string;
  caseId?: string;
  profileId?: number;
  identifierId?: number;
};

export const INSERT_CONTACT_SQL = `
  WITH existing AS (
      ${selectSingleContactByTaskId('Contacts')}
  ), inserted AS (
    INSERT INTO "Contacts" (
      "accountSid",
      "rawJson",
      "queueName",
      "twilioWorkerId",
      "createdBy",
      "createdAt",
      "updatedAt",
      "helpline",
      "channel",
      "number",
      "conversationDuration",
      "timeOfContact",
      "taskId",
      "channelSid",
      "serviceSid",
      "profileId",
      "identifierId"
    ) (SELECT 
        $<accountSid>, 
        $<rawJson>, 
        $<queueName>, 
        $<twilioWorkerId>, 
        $<createdBy>, 
        $<createdAt>, 
        $<updatedAt>, 
        $<helpline>, 
        $<channel>, 
        $<number>, 
        $<conversationDuration>, 
        $<timeOfContact>, 
        $<taskId>, 
        $<channelSid>, 
        $<serviceSid>,
        $<profileId>,
        $<identifierId>
      WHERE NOT EXISTS (
        ${selectSingleContactByTaskId('Contacts')}
      )
    )
    RETURNING *
  )
  SELECT "existing".*, false AS "isNewRecord" FROM "existing"
  UNION
  SELECT "inserted".*, NULL AS "csamReports", NULL AS "referrals", NULL AS "conversationMedia", true AS "isNewRecord" FROM "inserted"
`;
