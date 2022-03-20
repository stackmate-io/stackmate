import path from 'node:path';

// Path relative to the target, "dist" directory
export const TERRAFORM_BINDING = path.resolve(path.join(__dirname, '..', 'bin', 'terraform.so'));
export const CURRENT_DIRECTORY = process.cwd();
export const DEFAULT_PROJECT_DIRECTORY = '.stackmate';
export const DEFAULT_PROJECT_FILE = path.join(DEFAULT_PROJECT_DIRECTORY, 'stackmate.yml');
