import { faker } from '@faker-js/faker';

export const projectName = faker.lorem.word();
export const stageName = faker.lorem.word();
export const appName = `test-app-${faker.random.alphaNumeric(6)}`;
export const stackName = `test-stack-${faker.random.alphaNumeric(12)}`;
