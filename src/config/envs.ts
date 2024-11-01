import 'dotenv/config';

import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  STRIPE_SECRET: string;
}

const envsSchema = joi
  .object<EnvVars>({
    PORT: joi.number().required().default(3000),
    STRIPE_SECRET: joi.string().required(),
  })
  .unknown();

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  PORT: envVars.PORT,
  STRIPE_SECRET: envVars.STRIPE_SECRET,
};
