/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { DynamoDBRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { readFileSync } from 'fs';
import { Logger } from 'tslog';
import { Target } from '../../src/models/interfaces';
import { DispatchService } from '../../src/services/DispatchService';

describe('isValidMessageBody', () => {
  let origProcEnv: NodeJS.ProcessEnv;
  beforeAll(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    origProcEnv = process.env;
  });
  const target: Target = {
    queue: '',
    dlQueue: '',
    swaggerSpecFile: 'API_Vehicle_Test_Results_CVS_EDH_v1.yaml',
    schemaItem: 'completeTestResults',
  };
  const invalidRecord = {
    eventName: 'invalid',
    dynamodb: { NewImage: { hello: 'world' } },
  } as unknown as DynamoDBRecord;
  describe('When validation = true', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    beforeAll(() => {
      process.env.VALIDATION = 'TRUE';
    });
    afterAll(() => {
      process.env = origProcEnv;
    });

    it('returns false when evaluating a completely invalid record against a valid spec', async () => {
      const svc = new DispatchService(
        new (jest.fn())(),
        new Logger({ name: 'DispatchServiceValidation' }),
      );
      const output = await svc.isValidMessageBody(invalidRecord, target);
      expect(output).toBe(false);
    });
    it("returns true when evaluating a 'good' record against a valid spec", async () => {
      const svc = new DispatchService(new (jest.fn())(), new (jest.fn())());
      const validRecord = DynamoDB.Converter.unmarshall(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        JSON.parse(readFileSync('./tests/resources/stream-event.json', 'utf-8'))
          .Records[0].NewImage,
      );
      const body: DynamoDBRecord = {
        eventName: 'INSERT',
        dynamodb: { NewImage: validRecord },
      };
      const output = await svc.isValidMessageBody(body, target);
      expect(output).toBe(true);
    });
  });
  describe('when validation = false', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    beforeAll(() => {
      process.env.VALIDATION = 'false';
    });
    afterAll(() => {
      process.env = origProcEnv;
    });

    it('always returns true', async () => {
      const svc = new DispatchService(new (jest.fn())(), new (jest.fn())());
      const output = await svc.isValidMessageBody(invalidRecord, target);
      expect(output).toBe(true);
    });
  });
  describe('when validation is not set in secrets', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('always returns true', async () => {
      const svc = new DispatchService(new (jest.fn())(), new (jest.fn())());
      const output = await svc.isValidMessageBody(invalidRecord, target);
      expect(output).toBe(true);
    });
  });
});
