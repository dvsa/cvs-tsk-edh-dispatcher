
export interface IStreamRecord {
  body: string;
  eventSourceARN: string;
}

export interface IBody {
  eventType: string;
  body: any;
}

export interface ITarget {
  queue: string;
  dlQueue: string;
  swaggerSpecFile: string;
  schemaItem: string;
  endpoints: {
    INSERT: string;
    MODIFY: string;
    REMOVE: string;
  }
}

export interface ITargetConfig {
  [target: string]: ITarget
}

export interface ISecretConfig {
  baseUrl: string;
  apiKey: string;
  stubBaseUrl: string;
  stubApiKey: string;
  debugMode?: string | boolean;
  validation?: string | boolean;
}
