import createError from 'http-errors';
import * as casesDb from './case-data-access';
import * as caseApi from './case';
import { getCaseActivities } from './activities';
import { SafeRouter, publicEndpoint } from '../permissions';
import { getActions } from '../permissions';
import { asyncHandler } from '../utils';
import { getById } from '../case/case-data-access';

const casesRouter = SafeRouter();

casesRouter.get('/', publicEndpoint, async (req, res) => {
  const { accountSid } = req;
  const { sortDirection, sortBy, limit, offset, ...search } = req.query;
  const cases = await caseApi.searchCases(
    accountSid,
    { sortDirection, sortBy, limit, offset },
    { filters: { includeOrphans: false }, ...search },
  );
  res.json(cases);
});

casesRouter.post('/', publicEndpoint, async (req, res) => {
  const { accountSid, user } = req;
  const createdCase = await caseApi.createCase(req.body, accountSid, user.workerSid);

  res.json(createdCase);
});

/**
 * It checks if the user can edit the case based on the fields it's trying to edit
 * according to the defined permission rules.
 */
const canEditCase = asyncHandler(async (req, res, next) => {
  if (!req.isAuthorized()) {
    const { accountSid, body, user, can } = req;
    const { id } = req.params;
    const caseObj = await getById(id, accountSid);

    if (!caseObj) throw createError(404);

    const actions = getActions(caseObj, body);
    const canEdit = actions.every(action => can(user, action, caseObj));

    if (canEdit) {
      req.authorize();
    } else {
      req.unauthorize();
    }
  }

  next();
});

casesRouter.put('/:id', canEditCase, async (req, res) => {
  const { accountSid, user } = req;
  const { id } = req.params;
  const updatedCase = await caseApi.updateCase(id, req.body, accountSid, user.workerSid);
  if (!updatedCase) {
    throw createError(404);
  }
  res.json(updatedCase);
});

casesRouter.delete('/:id', publicEndpoint, async (req, res) => {
  const { accountSid } = req;
  const { id } = req.params;
  const deleted = await casesDb.deleteById(id, accountSid);
  if (!deleted) {
    throw createError(404);
  }
  res.sendStatus(200);
});

casesRouter.get('/:caseId/activities/', publicEndpoint, async (req, res) => {
  const { accountSid } = req;
  const { caseId } = req.params;

  try {
    res.json(await getCaseActivities(caseId, accountSid));
  } catch (err) {
    if (err.message.match(/Case .* not found\./)) {
      throw createError(404);
    } else throw err;
  }
});

casesRouter.post('/search', publicEndpoint, async (req, res) => {
  const { accountSid } = req;
  const searchResults = await caseApi.searchCases(accountSid, req.query, req.body);
  res.json(searchResults);
});

export default casesRouter.expressRouter;
