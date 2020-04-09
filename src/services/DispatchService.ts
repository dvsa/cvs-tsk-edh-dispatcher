import {Configuration} from "../utils/Configuration";
import {ERROR, EVENT_TYPE} from "../models/enums";
import {IBody, ITarget} from "../models";
import {DispatchDAO} from "./DispatchDAO";
// tslint:disable-next-line
const AWSXRay = require("aws-xray-sdk");


/**
 * Service class for interfacing with the Simple Queue Service
 */
class DispatchService {
    private readonly config: any;
    private dao: DispatchDAO;

    /**
     * Constructor for the ActivityService class
     * @param sqsClient - The Simple Queue Service client
     */
    constructor(dao: DispatchDAO) {
        this.config = Configuration.getInstance().getConfig();
        this.dao = dao;
    }

    public processEvent(eventPayload: IBody,  target: ITarget) {
        const eventType = eventPayload.eventType; //INSERT, MODIFY or REMOVE
        const eventBody = eventPayload.body;

        console.log("eventPayload: ", eventPayload);
        let path: string;

        let updateContent;

        console.log("Event type: ", eventType);
        switch (eventType) {
            case EVENT_TYPE.INSERT:
                console.log("in INSERT");
                updateContent = eventBody.NewImage;
                path = this.processPath(target.endpoints.INSERT, eventBody);
                return this.dao.postMessage(updateContent, path);
            case EVENT_TYPE.MODIFY:
                console.log("in MODIFY");
                updateContent = eventBody.NewImage;
                path = this.processPath(target.endpoints.MODIFY, eventBody);
                console.log("Sending body: ", updateContent);
                console.log("Sending path: ", path);

                return this.dao.putMessage(updateContent, path);
            case EVENT_TYPE.REMOVE:
                console.log("in REMOVE");
                path = this.processPath(target.endpoints.REMOVE, eventBody);
                return this.dao.deleteMessage(path);
            default:
                console.error(ERROR.NO_HANDLER_METHOD);
                break;
        }
    }

    public processPath(path: string, body: any) {
        const replaceRegex: RegExp = /{(\w+\b):?(\w+\b)?}/g;
        const matches: RegExpMatchArray | null = path.match(replaceRegex);
        console.log("Keys", body.Keys);
        if (matches) {
            matches.forEach((match: string) => {
                const matchString = match.substring(1, match.length - 1);
                // Keys come in as {name: {"S": "100"}} - grab actual value
                const replVal = Object.values(body.Keys[matchString])[0] as string;
                path = path.replace(match, replVal);
            });
        }
        console.log("Processed path: ", path);
        return path;
    };

}

export {DispatchService};
