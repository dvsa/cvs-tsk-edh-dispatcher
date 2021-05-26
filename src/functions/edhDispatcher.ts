import { SQSEvent, SQSHandler } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import { Logger } from 'tslog';
import { DispatchService } from '../services/DispatchService';
import { SQService } from '../services/SQService';
import { Configuration } from '../utils/Configuration';
import { SqsService } from '../utils/sqs-huge-msg';

const testing = process.env.NODE_ENV === 'test';
/**
 * λ function to process an SQS stream of records into a queue.
 * @param event - DynamoDB Stream event
 */
const edhDispatcher: SQSHandler = async (event: SQSEvent): Promise<void> => {
  const logger: Logger = new Logger({
    name: 'HandlerLogger',
    type: testing ? 'pretty' : 'json',
    minLevel: testing ? 'debug' : 'warn',
  });
  logger.debug('Event: ', event);

  const records = event.Records;
  if (!records || !records.length) {
    logger.error('ERROR: No Records in event: ', event);
    return;
  }

  // Instantiate the Simple Queue Service
  const region = process.env.AWS_REGION;
  const config = Configuration.getInstance().getConfig();

  if (!region) {
    console.error('AWS_REGION envvar not available');
    return;
  }
  const sqsHugeMessage = new SqsService({
    region,
    queueName: config.sqs.remote.queueName[0],
    s3EndpointUrl: config.s3.remote.params.endpoint,
    s3Bucket: config.s3.remote.params.bucket,
  });

  const dispatchService: DispatchService = new DispatchService(
    new SQService(
      sqsHugeMessage,
      logger.getChildLogger({ name: 'SQService' }),
    ),
    logger.getChildLogger({ name: 'DispatchService' }),
  );
  const sentMessagePromises: Array<Promise<void>> = [];
  logger.debug('Records: ', records);

  // Handle records here
  records.forEach((record) => {
    logger.debug('Record: ', record);
    const call = dispatchService.processSQSRecord(record);
    sentMessagePromises.push(call);
  });

  const promises = await Promise.all(sentMessagePromises);
  logger.debug('Response: ', promises);
};

export { edhDispatcher };
