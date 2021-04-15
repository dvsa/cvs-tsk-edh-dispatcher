import SecretsManager, { GetSecretValueRequest, GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager';
import { captureAWSClient } from 'aws-xray-sdk';
import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { env } from 'process';
import { render } from 'template-file';
import { ERROR } from '../models/enums';
import { Config, SecretConfig, TargetConfig } from '../models/interfaces';
import path from "path";

/**
 * Helper class for retrieving project configuration
 */
class Configuration {
  private static instance: Configuration;

  private readonly config: Config;

  private readonly env: 'local' | 'remote';

  private secretConfig: SecretConfig | undefined;

  private secretsClient: SecretsManager;

  private constructor(configPath: string) {
    this.secretsClient = captureAWSClient(new SecretsManager({ region: 'eu-west-1' }));
    if (!env.BRANCH) throw new Error(ERROR.NO_BRANCH_ENV);
    this.env = env.BRANCH === 'local' ? 'local' : 'remote';
    const data = {
      BRANCH: this.env === 'local' ? this.env : env.BRANCH,
    };
    console.log("configuration loaded. BRANCH = ", env.BRANCH);

    const template = readFileSync(configPath, 'utf-8');
    console.log('YML template before replacements', template);

    const ymlRendered = render(template, data);
    console.log('YML template after replacements', ymlRendered);

    this.config = load(
      ymlRendered,
    ) as Config;

    console.log("config after js-yaml", this.config);
  }

  /**
   * Retrieves the singleton instance of Configuration
   * @returns Configuration
   */
  public static getInstance(): Configuration {
    if (!this.instance) {
      this.instance = new Configuration(path.resolve(__dirname, '../config/config.yml'));
    }

    console.log('Configuration::getInstance called, retrieving config', Configuration.instance)
    return Configuration.instance;
  }

  /**
   * Retrieves the entire config as an object
   * @returns any
   */
  public getConfig(): Config {
    return this.config;
  }

  /**
   * Retrieves the Targets config
   * @returns ITargetConfig[]
   */
  public getTargets(): TargetConfig {
    return this.config.targets;
  }

  /**
   * Retrieves the Secrets config
   * @returns ISecretConfig
   */
  public async getSecretConfig(): Promise<SecretConfig> {
    if (!this.secretConfig) {
      this.secretConfig = await this.setSecrets();
    }
    return this.secretConfig;
  }

  public getSQSParams(): { [p: string]: string } {
    return this.config.sqs[this.env].params;
  }

  public getEnv(): 'local' | 'remote' {
    return this.env;
  }

  /**
   * Reads the secret yaml file from SecretManager or local file.
   */
  private async setSecrets(): Promise<SecretConfig> {
    if (process.env.SECRET_NAME) {
      const req: GetSecretValueRequest = {
        SecretId: process.env.SECRET_NAME,
      };
      const resp: GetSecretValueResponse = await this.secretsClient.getSecretValue(req).promise();
      try {
        return await JSON.parse(resp.SecretString as string) as SecretConfig;
      } catch (e) {
        throw new Error(ERROR.SECRET_STRING_EMPTY);
      }
    } else {
      console.warn(ERROR.SECRET_ENV_VAR_NOT_SET);
      throw new Error(ERROR.SECRET_ENV_VAR_NOT_SET);
    }
  }
}

export { Configuration };
