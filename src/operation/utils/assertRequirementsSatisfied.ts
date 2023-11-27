import type { BaseProvisionable } from '@services/types'

/**
 * @param {BaseProvisionable} provisionable the provisionable to check
 * @throws {Error} if a requirement is not satisfied
 */
export const assertRequirementsSatisfied = (provisionable: BaseProvisionable) => {
  const {
    service: { associations, type },
    requirements,
  } = provisionable

  if (!associations) {
    return
  }

  Object.entries(associations).forEach(([name, assoc]) => {
    if (!assoc.requirement) {
      return
    }

    if (!requirements[name]) {
      throw new Error(`Requirement ${name} for service ${type} is not satisfied`)
    }
  })
}
