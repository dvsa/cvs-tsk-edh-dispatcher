/**
 * Utils functions
 */
import {Configuration} from "./Configuration";
import {ERROR} from "../models/enums";
import {ITarget, ITargetConfig} from "../models";

export const getTargetFromSourceARN = (arn: string) => {
    // @ts-ignore
    const targets: ITargetConfig = Configuration.getInstance().getTargets();
    debugOnlyLog("targets: ", targets);
    const validTargets = Object.values(targets).filter((target: ITarget) => arn.includes(target.queue));
    if (validTargets.length !== 1) {
        debugOnlyLog("valid targets: ", validTargets);
        throw new Error(ERROR.NO_UNIQUE_TARGET);
    }
    debugOnlyLog("Valid targets: ", validTargets);
    return validTargets[0];
};

export const debugOnlyLog = async (...args: any) => {
    if(process.env.DEBUG === "TRUE") {
        console.log(...args);
    }
}
