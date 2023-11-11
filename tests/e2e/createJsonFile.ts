import fs from 'node:fs'
import path from 'node:path'

const STACK_FILE = 'main.tf.json'

export const createJsonFile = (contents: object, directory: string, filename = STACK_FILE) => {
  if (!fs.lstatSync(directory).isDirectory()) {
    fs.mkdirSync(directory, { recursive: true })
  }

  fs.writeFileSync(path.join(directory, filename), JSON.stringify(contents, null, 2))
}
