import os from 'node:os';
import path from 'node:path';

// Path relative to the target, "dist" directory
export const TERRAFORM_BINDING = path.resolve(path.join(__dirname, '..', 'bin', 'terraform.so'));
export const CURRENT_DIRECTORY = process.cwd();
export const STACKMATE_DIRECTORY = '.stackmate';

export const DEFAULT_PROJECT_FILE = path.join(CURRENT_DIRECTORY, STACKMATE_DIRECTORY, 'config.yml');
export const DEFAULT_OUTPUT_DIRECTORY = path.join(CURRENT_DIRECTORY, STACKMATE_DIRECTORY);

export const APP_USER_DIRECTORY = path.join(os.homedir(), STACKMATE_DIRECTORY);
export const PREFERENCES_FILE = path.join(APP_USER_DIRECTORY, 'settings.json');

export const STACK_FILE_NAME = 'stackmate.tf.json';

// Configuration files versions
export const PREFERENCES_VERSION = '0.1.0';
