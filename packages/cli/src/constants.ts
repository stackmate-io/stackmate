import path from 'node:path';

export const TERRAFORM_BINDING = path.resolve(path.join(__dirname, 'terraform.so'));
export const CURRENT_DIRECTORY = process.cwd();
export const DEFAULT_PROJECT_DIRECTORY = '.stackmate';
export const DEFAULT_PROJECT_FILE = path.join(DEFAULT_PROJECT_DIRECTORY, 'stackmate.yml');
