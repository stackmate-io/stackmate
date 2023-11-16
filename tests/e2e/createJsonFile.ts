import fs from 'node:fs'
import path from 'node:path'

export const createJsonFile = (contents: object, directory: string, filename: string) => {
  if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) {
    fs.mkdirSync(directory, { recursive: true })
  }

  fs.writeFileSync(path.join(directory, filename), JSON.stringify(contents, null, 2))
}
