/**
 * Utils functions
 */
import { Configuration } from './Configuration';
import { ERROR } from '../models/enums';
import { Target, TargetConfig } from '../models/interfaces';

export const getTargetFromSourceARN = (arn: string): Target => {
  console.log("Source ARN", arn);
  const targets: TargetConfig = Configuration.getInstance().getTargets();
  console.log("Possible targets", targets);
  const validTargets = Object.keys(targets).filter((k) => arn.includes(k));
  console.log("Valid targets", validTargets);
  if (validTargets.length !== 1) {
    throw new Error(ERROR.NO_UNIQUE_TARGET);
  }
  console.log("Found valid target", targets[validTargets[0]]);
  return targets[validTargets[0]];
};
