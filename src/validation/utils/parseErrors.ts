import { get, isEmpty, uniqBy } from 'lodash'
import type { ValidationErrorDescriptor } from '@src/lib/errors'
import type { ErrorObject as AjvErrorObject } from 'ajv'

export const parseErrors = (errors: AjvErrorObject[], data: any): ValidationErrorDescriptor[] => {
  const errs = errors
    .filter(({ keyword }) => !['if', 'then'].includes(keyword))
    .map(({ instancePath, message }) => {
      const pathParts = instancePath.split('/').filter((val) => !isEmpty(val))
      const path = pathParts.join('.')
      const [key] = pathParts.slice(-1)
      const value = get(data, path)

      const parentPath = pathParts
        .slice(0, pathParts.length - 2 > 0 ? pathParts.length : 1)
        .join('.')

      return {
        key,
        path,
        value,
        parent: get(data, parentPath),
        message: message || `Property ${instancePath} contains invalid value ${value}`,
      }
    })

  return uniqBy(errs, ({ path, message }) => `${path}-${message}`)
}
