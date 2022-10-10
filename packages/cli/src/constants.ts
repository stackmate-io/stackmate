import path from 'node:path';
import { USER_HOME_DIRECTORY, STACKMATE_DIRECTORY } from '@stackmate/engine';

// Path relative to the target, "dist" directory
export const TERRAFORM_BINDING = path.resolve(path.join(__dirname, '..', 'bin', 'terraform.so'));
export const CURRENT_DIRECTORY = process.cwd();
export const CURRENT_DIR_BASENAME = path.basename(CURRENT_DIRECTORY);

export const DEFAULT_PROJECT_BASE = path.join(CURRENT_DIRECTORY, STACKMATE_DIRECTORY, 'config')
export const DEFAULT_PROJECT_FILE = `${DEFAULT_PROJECT_BASE}.yml`;
export const DEFAULT_OUTPUT_DIRECTORY = path.join(CURRENT_DIRECTORY, STACKMATE_DIRECTORY);

export const PREFERENCES_FILE = path.join(USER_HOME_DIRECTORY, 'settings.json');

// Configuration files versions
export const PREFERENCES_VERSION = '0.1.0';
