/** Validable - Test unit
 * @requires validate.js
 * @author jcondor */
'use strict'
const expect = require('expect.js')
const Validable = require('./validable')

class Mock extends Validable.Class {
  constructor(opt) {
    super()
    Object.assign(this, opt)
  }

  static constraints = {
    str: { type: 'string', format: /[a-z]+/i },
    num: { type: 'integer' },
    req1: { type: 'string', presence: { allowEmpty: false } },
    req2: { type: 'string', presence: { allowEmpty: false } },
  }
}

describe('A class extending Validable.Class', function () {
  describe('validating an instance', function () {
    let mocky
    beforeEach(
      () =>
        (mocky = new Mock({ str: 'abc', num: 123, req1: 'def', req2: 'ghi' }))
    )

    it('should be successful with good fields', () =>
      expect(mocky.validate()).to.not.be.ok())

    it('should fail with inconsistent fields', () => {
      mocky.str = 'a123bcd'
      expect(mocky.validate()).to.have.property('str')
    })

    it('should fail when missing required fields', () => {
      mocky.req1 = null
      expect(mocky.validate()).to.have.property('req1')
    })
  })

  describe('when validating a field', function () {
    it('should be successful with good field and value', () =>
      expect(Mock.validate('str', 'abc')).to.not.be.ok())

    it('should fail with inconsistent value', () =>
      expect(Mock.validate('str', 'abc123')).to.have.property('str'))

    it('should fail internally with invalid field', () =>
      shouldBeInternalError(Mock.validate(() => 'boh', 'mah')))
  })

  describe('when validating an object', function () {
    let obj
    beforeEach(() => (obj = { str: 'abc', num: 123, req1: 'def', req2: 'ghi' }))

    describe('weakly', function () {
      it('should be successful with good properties', () =>
        expect(Mock.validateObject(obj, true)).to.not.be.ok())

      it('should be successful with missing but required properties', () => {
        delete obj.req1
        expect(Mock.validateObject(obj, true)).to.not.be.ok()
      })

      it('should be successful when empty', () =>
        expect(Mock.validateObject({}, true)).to.not.be.ok())

      it('should fail with inconsistent values', () => {
        obj.str = 'abc123def'
        expect(Mock.validateObject(obj, true)).to.have.property('str')
      })
    })

    describe('strictly', function () {
      it('should be successful with good properties', () =>
        expect(Mock.validateObject(obj)).to.not.be.ok())

      it('should fail with inconsistent values', () => {
        obj.str = 'abc123def'
        expect(Mock.validateObject(obj)).to.have.property('str')
      })

      it('should fail when empty', () => {
        const e = Mock.validateObject({})
        expect(e).to.have.property('req1')
        expect(e).to.have.property('req2')
      })

      it('should fail with missing but required properties', () => {
        delete obj.req1
        expect(Mock.validateObject(obj)).to.have.property('req1')
      })
    })
  })
})

function shouldBeInternalError(o) {
  expect(o).to.be.an('object')
  expect(o).to.have.property('_')
}
