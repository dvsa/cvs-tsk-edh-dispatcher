import {getTargetFromSourceARN} from "../../src/utils/Utils";
import {Configuration} from "../../src/utils/Configuration";
import {ERROR} from "../../src/models/enums";

describe("Utils", () => {
  describe("getTargetFromSourceARN", () => {
    // @ts-ignore
    Configuration.instance = new Configuration("../../src/config/config.yml");
    describe("when ARN has a matching config", () => {
      it("gets target from config properly", () => {
        // @ts-ignore
        const expected = Configuration.getInstance().getTargets()["test-results"];
        const target = getTargetFromSourceARN("arn:aws:dynamodb:horse-east-8:00626016:table/vehicle-tests/stream/2024-03-30T15:55:39.197");
        expect(target).toEqual(expected)
      });
    });

    describe("when ARN has no matching config", () => {
      it("throws error", () => {
        try {
          getTargetFromSourceARN("arn:aws:dynamodb:horse-east-8:00626016:table/cvs-cvsb-xxx-NO-MATCHING/stream/2024-03-30T15:55:39.197");
        } catch (e) {
          expect(e.message).toEqual(ERROR.NO_UNIQUE_TARGET);
        }
      });
    });
  })
});