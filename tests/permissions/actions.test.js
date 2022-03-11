/* eslint-disable jest/no-standalone-expect */
const each = require('jest-each').default;

const actions = require('../../permissions/actions');

const emptyCase = {
  id: 123,
  status: 'open',
  helpline: 'helpline',
  info: {
    definitionVersion: 'v1',
  },
  twilioWorkerId: 'WK76971332a884bf79ec378f98879d23c2',
  createdBy: 'WKda44b83f664f511c927c0f0f35579dd2',
  accountSid: 'ACd8a2e89748318adf6ddff7df6948deaf',
  createdAt: '2022-03-02T18:10:52.860Z',
  updatedAt: '2022-03-02T22:17:51.603Z',
  connectedContacts: [
    {
      id: 1770,
      rawJson: {},
    },
  ],
};

// Tests for additions when the property does not exist (e.g. no notes under info field)
each([
  {
    caseFromDB: emptyCase,
    update: { info: { summary: 'case summary' } },
    expectedCondition: [actions.EDIT_CASE_SUMMARY],
    conditionDescription: 'adding a case summary',
  },
  {
    caseFromDB: emptyCase,
    update: { info: { notes: ['note 1'] } },
    expectedCondition: [actions.ADD_NOTE],
    conditionDescription: 'adding a note',
  },
  {
    caseFromDB: emptyCase,
    update: { info: { incidents: [{ incident: { property: 'property' } }] } },
    expectedCondition: [actions.ADD_INCIDENT],
    conditionDescription: 'adding an incident',
  },
  {
    caseFromDB: emptyCase,
    update: { info: { referrals: [{ property: 'property' }] } },
    expectedCondition: [actions.ADD_REFERRAL],
    conditionDescription: 'adding a referral',
  },
  {
    caseFromDB: emptyCase,
    update: { info: { households: [{ household: { property: 'property' } }] } },
    expectedCondition: [actions.ADD_HOUSEHOLD],
    conditionDescription: 'adding a household',
  },
  {
    caseFromDB: emptyCase,
    update: { info: { perpetrators: [{ perpetrator: { property: 'property' } }] } },
    expectedCondition: [actions.ADD_PERPETRATOR],
    conditionDescription: 'adding a perpetrator',
  },
  {
    caseFromDB: emptyCase,
    update: {
      info: {
        notes: ['note 1'],
        incidents: [{ incident: { property: 'property' } }],
        referrals: [{ property: 'property' }],
        households: [{ household: { property: 'property' } }],
        perpetrators: [{ perpetrator: { property: 'property' } }],
      },
    },
    expectedCondition: [
      actions.ADD_NOTE,
      actions.ADD_INCIDENT,
      actions.ADD_REFERRAL,
      actions.ADD_HOUSEHOLD,
      actions.ADD_PERPETRATOR,
    ],
    conditionDescription: 'adding more than one property (test multiple additions not exhaustive)',
  },
]).test(
  "Should return '$expectedCondition' actions list when '$conditionDescription'",
  async ({ expectedCondition, caseFromDB, update }) => {
    const result = actions.getActions(caseFromDB, update);

    expect(result).toMatchObject(expectedCondition);
  },
);

const caseWithProperties = {
  id: 123,
  status: 'open',
  helpline: 'helpline',
  info: {
    definitionVersion: 'v1',
    notes: ['note 1'],
    incidents: [{ incident: { property: 'property' } }],
    referrals: [{ property: 'property' }],
    households: [{ household: { property: 'property' } }],
    perpetrators: [{ perpetrator: { property: 'property' } }],
  },
  twilioWorkerId: 'WK76971332a884bf79ec378f98879d23c2',
  createdBy: 'WKda44b83f664f511c927c0f0f35579dd2',
  accountSid: 'ACd8a2e89748318adf6ddff7df6948deaf',
  createdAt: '2022-03-02T18:10:52.860Z',
  updatedAt: '2022-03-02T22:17:51.603Z',
  connectedContacts: [
    {
      id: 1770,
      rawJson: {},
    },
  ],
};

// Tests for additions when the property does exist (e.g. adding a second note)
each([
  {
    caseFromDB: caseWithProperties,
    update: { info: { notes: ['note 1', 'note 2'] } },
    expectedCondition: [actions.ADD_NOTE],
    conditionDescription: 'adding a second note',
  },
  {
    caseFromDB: caseWithProperties,
    update: {
      info: {
        incidents: [{ incident: { property: 'property' } }, { incident: { property: 'second' } }],
      },
    },
    expectedCondition: [actions.ADD_INCIDENT],
    conditionDescription: 'adding a second incident',
  },
  {
    caseFromDB: caseWithProperties,
    update: { info: { referrals: [{ property: 'property' }, { property: 'second' }] } },
    expectedCondition: [actions.ADD_REFERRAL],
    conditionDescription: 'adding a second referral',
  },
  {
    caseFromDB: caseWithProperties,
    update: {
      info: {
        households: [
          { household: { property: 'property' } },
          { household: { property: 'second' } },
        ],
      },
    },
    expectedCondition: [actions.ADD_HOUSEHOLD],
    conditionDescription: 'adding a second household',
  },
  {
    caseFromDB: caseWithProperties,
    update: {
      info: {
        perpetrators: [
          { perpetrator: { property: 'property' } },
          { perpetrator: { property: 'second' } },
        ],
      },
    },
    expectedCondition: [actions.ADD_PERPETRATOR],
    conditionDescription: 'adding a second perpetrator',
  },
  {
    caseFromDB: caseWithProperties,
    update: {
      info: {
        notes: ['note 1', 'note 2'],
        incidents: [{ incident: { property: 'property' } }, { incident: { property: 'second' } }],
        referrals: [{ property: 'property' }, { property: 'second' }],
        households: [
          { household: { property: 'property' } },
          { household: { property: 'second' } },
        ],
        perpetrators: [
          { perpetrator: { property: 'property' } },
          { perpetrator: { property: 'second' } },
        ],
      },
    },
    expectedCondition: [
      actions.ADD_NOTE,
      actions.ADD_INCIDENT,
      actions.ADD_REFERRAL,
      actions.ADD_HOUSEHOLD,
      actions.ADD_PERPETRATOR,
    ],
    conditionDescription: 'adding more than one property (test multiple additions not exhaustive)',
  },
]).test(
  "Should return '$expectedCondition' actions list when '$conditionDescription'",
  async ({ expectedCondition, caseFromDB, update }) => {
    const result = actions.getActions(caseFromDB, update);

    expect(result).toMatchObject(expectedCondition);
  },
);

// Tests for editing existing properties (e.g. editing a perpetrator)
each([
  {
    caseFromDB: caseWithProperties,
    update: { info: { notes: ['note 1 modified'] } },
    expectedCondition: [actions.EDIT_NOTE],
    conditionDescription: 'editing a note',
  },
  {
    caseFromDB: caseWithProperties,
    update: {
      info: {
        incidents: [{ incident: { property: 'property modified' } }],
      },
    },
    expectedCondition: [actions.EDIT_INCIDENT],
    conditionDescription: 'editing an incident',
  },
  {
    caseFromDB: caseWithProperties,
    update: { info: { referrals: [{ property: 'property modified' }] } },
    expectedCondition: [actions.EDIT_REFERRAL],
    conditionDescription: 'editing a referral',
  },
  {
    caseFromDB: caseWithProperties,
    update: {
      info: {
        households: [{ household: { property: 'property modified' } }],
      },
    },
    expectedCondition: [actions.EDIT_HOUSEHOLD],
    conditionDescription: 'editing a household',
  },
  {
    caseFromDB: caseWithProperties,
    update: {
      info: {
        perpetrators: [{ perpetrator: { property: 'property modified' } }],
      },
    },
    expectedCondition: [actions.EDIT_PERPETRATOR],
    conditionDescription: 'editing a perpetrator',
  },
  {
    caseFromDB: caseWithProperties,
    update: {
      info: {
        notes: ['note 1 modified'],
        incidents: [{ incident: { property: 'property modified' } }],
        referrals: [{ property: 'property modified' }],
        households: [{ household: { property: 'property modified' } }],
        perpetrators: [{ perpetrator: { property: 'property modified' } }],
      },
    },
    expectedCondition: [
      actions.EDIT_NOTE,
      actions.EDIT_INCIDENT,
      actions.EDIT_REFERRAL,
      actions.EDIT_HOUSEHOLD,
      actions.EDIT_PERPETRATOR,
    ],
    conditionDescription: 'editing more than one property (test multiple editions not exhaustive)',
  },
  {
    caseFromDB: caseWithProperties,
    update: { status: 'another' },
    expectedCondition: [actions.CASE_STATUS_TRANSITION],
    conditionDescription: 'transitioning from a not-closed status to aother not-closed status',
  },
  {
    caseFromDB: caseWithProperties,
    update: { status: 'closed' },
    expectedCondition: [actions.CLOSE_CASE],
    conditionDescription: 'transitioning from a not-closed status closed',
  },
  {
    caseFromDB: { ...caseWithProperties, status: 'closed' },
    update: { status: 'another' },
    expectedCondition: [actions.REOPEN_CASE],
    conditionDescription: 'transitioning from a not-closed status closed',
  },
]).test(
  "Should return '$expectedCondition' actions list when '$conditionDescription'",
  async ({ expectedCondition, caseFromDB, update }) => {
    const result = actions.getActions(caseFromDB, update);

    expect(result).toMatchObject(expectedCondition);
  },
);
