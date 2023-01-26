import supertest from 'supertest';
import timers from 'timers';

import { ContactJobPollerError } from '../../src/contact-job/contact-job-error';

require('./mocks');

let server;
let configureService: typeof import('../../src/app').configureService;
let contactJobComplete: typeof import('../../src/contact-job/contact-job-complete');
let contactJobPublish: typeof import('../../src/contact-job/contact-job-publish');
let contactJobProcessor: typeof import('../../src/contact-job/contact-job-processor');

const startServer = () => {
  const service = configureService({
    authTokenLookup: () => 'picernic basket',
  });

  service.listen();

  server = service;
};

const stopServer = async () => {
  if (server && server.close) await server.close();
  server = null;
};

beforeEach(async () => {
  jest.isolateModules(() => {
    configureService = require('../../src/app').configureService;
    contactJobComplete = require('../../src/contact-job/contact-job-complete');
    contactJobPublish = require('../../src/contact-job/contact-job-publish');
    contactJobProcessor = require('../../src/contact-job/contact-job-processor');
  });
});

afterEach(async () => {
  await stopServer();
  jest.clearAllMocks();
});

describe('processContactJobs', () => {
  test('calling processContactJobs twice does not spans another processor', async () => {
    // Mock setInterval to return the internal cb instead than it's interval id, so we can call it when we want
    const setIntervalSpy = jest.spyOn(timers, 'setInterval').mockImplementation(callback => {
      return callback as any;
    });

    const processorSpy = jest.spyOn(contactJobProcessor, 'processContactJobs');

    contactJobProcessor.processContactJobs();
    contactJobProcessor.processContactJobs();

    expect(processorSpy).toHaveBeenCalledTimes(2);
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
  });

  test('job processor loop is as expected: poll & process completed, then publish due', async () => {
    // Mock setInterval to return the internal cb instead than it's interval id, so we can call it when we want
    // const setIntervalSpy =
    jest.spyOn(timers, 'setInterval').mockImplementation(callback => {
      return callback as any;
    });
    const completeSpy = jest
      .spyOn(contactJobComplete, 'pollAndProcessCompletedContactJobs')
      .mockImplementation(() => Promise.resolve(undefined) as any);
    const publishSpy = jest.spyOn(contactJobPublish, 'publishDueContactJobs');

    const processorIntervalCallback = (contactJobProcessor.processContactJobs() as unknown) as () => Promise<
      void
    >;

    await processorIntervalCallback();

    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(publishSpy).toHaveBeenCalledTimes(1);
    expect(completeSpy.mock.invocationCallOrder[0]).toBeLessThan(
      publishSpy.mock.invocationCallOrder[0],
    );

    await processorIntervalCallback();

    expect(completeSpy).toHaveBeenCalledTimes(2);
    expect(publishSpy).toHaveBeenCalledTimes(2);
    expect(completeSpy.mock.invocationCallOrder[1]).toBeLessThan(
      publishSpy.mock.invocationCallOrder[1],
    );
  });

  test('error on sweep does not shuts down the server', async () => {
    // Mock setInterval to return the internal cb instead than it's interval id, so we can call it when we want
    // const setIntervalSpy =
    jest.spyOn(timers, 'setInterval').mockImplementation(callback => {
      return callback as any;
    });

    const errorSpy = jest.spyOn(console, 'error');
    const completeSpy = jest
      .spyOn(contactJobComplete, 'pollAndProcessCompletedContactJobs')
      .mockImplementationOnce(() => {
        throw new Error('Aaaw, snap!');
      });

    const processorIntervalCallback = (contactJobProcessor.processContactJobs() as unknown) as () => Promise<
      void
    >;

    await processorIntervalCallback();

    startServer();

    const request = supertest.agent(server);

    expect(completeSpy).toHaveBeenCalledTimes(1);

    expect(errorSpy).toHaveBeenCalledWith(
      new ContactJobPollerError('JOB PROCESSING SWEEP ABORTED DUE TO UNHANDLED ERROR'),
      Error('Aaaw, snap!'),
    );

    completeSpy.mockClear();

    const response = await request.get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ Message: 'HRM is up and running!' });
  });
});
