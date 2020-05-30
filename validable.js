/** Validable - Library to make a class validable by extending or mixing
 * @requires validate.js
 * @author jcondor
 * @license
 * Copyright 2020 Paolo Lucchesi
 * All rights reserved
 * This software is licensed under the MIT license found in the file LICENSE
 * in the root directory of this repository
 */
'use strict'
const validate = require('validate.js')

/** Mixin to make any class validable
 * @param {Class} Base - Base class to extend
 * @returns {Class} A validable class created on top of Base
 */
function ValidableMixin(Base) {
  Base = Base || class {}

  /** Validable.Class, to be used as a base class
   * @class */
  class ValidableClass extends Base {
    /** Validate this instance, or just one of its fields
     * @param {string} field - Name of the single field to validate
     * @example entity.validate()  // Validate every field
     * @example entity.validate('fieldname')  // Validate just a specific field
     * @returns {object|undefined} undefined on valid field(s), or an object
     *   containing all the validation errors
     */
    validate(field) {
      return field
        ? this.constructor.validate(
            field,
            this[field],
            this.constructor.constraints
          )
        : validate(this, this.constructor.constraints)
    }

    /** Validate an arbitrary field of a validable class
     * @param {string} field - Field to validate
     * @param {*} value - Value for the field to be validated
     * @example
     * // Validate the email for an hypothetic user entity
     * User.validate('email', 'pikachu@poke.mon');
     * @returns {object|undefined} undefined on valid field, or an object
     *   containing all the validation errors
     */
    static validate(field, value) {
      return validate.one(field, value, this.constraints)
    }

    /** Validate an object as it were a validable instance
     * @param {object} obj - The object to validate
     * @param {boolean} weak - If true, performs a 'weak' validation, i.e.
     *   missing required fields will not be considered
     * @returns {object|undefined} undefined on valid argument, or an object
     *   containing all the validation errors
     */
    static validateObject(obj, weak = false) {
      if (!obj) return { _: 'Cannot validate falsy object' }
      return weak
        ? validate.some(obj, this.constraints)
        : validate(obj, this.constraints)
    }
  }

  return ValidableClass
}

class ValidationError extends Error {
  /** Error thrown by the validator on invalid value
   * @param {object} valErrors - Validation errors
   * @param {string} msg - Error message
   * @param {...*} args - Other arguments, passed as for Error()
   */
  constructor(valErrors, msg, ...args) {
    super(msg || 'Validation failed', ...args)
    this.errors = valErrors
  }
}

// Validate just one field
validate.one = function (field, value, constraints) {
  if (!field || !(validate.isString(field) || typeof field === 'symbol')) {
    return { _: 'Invalid field' }
  }
  if (constraints[field]) {
    return validate({ [field]: value }, { [field]: constraints[field] })
  }
}

// Validate some fields given in a collection iterable in the form
// [ [field, value], ...]
validate.kvArray = function (arr, constraints) {
  const errors = arr
    .map(([k, v]) => validate.one(k, v, constraints))
    .filter(e => e)
  return errors.length
    ? errors.reduce((prev, curr) => Object.assign(prev, curr), {})
    : null
}

// Validate just a part of the fields
validate.some = function (args, constraints) {
  return validate.kvArray(Object.entries(args), constraints)
}

module.exports = {
  Mixin: ValidableMixin,
  Class: ValidableMixin(),
  Error: ValidationError,
  validate: validate,
}
