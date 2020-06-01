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

describe('A class extending Validable.Class', () => {
  describe('validating an instance', () => {
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

  describe('when validating a field', () => {
    it('should be successful with good field and value', () =>
      expect(Mock.validate('str', 'abc')).to.not.be.ok())

    it('should fail with inconsistent value', () =>
      expect(Mock.validate('str', 'abc123')).to.have.property('str'))

    it('should fail internally with invalid field', () =>
      shouldBeInternalError(Mock.validate(() => 'boh', 'mah')))
  })

  describe('when validating an object', () => {
    let obj
    beforeEach(() => (obj = { str: 'abc', num: 123, req1: 'def', req2: 'ghi' }))

    describe('weakly', () => {
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

    describe('strictly', () => {
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

describe('whitelist', () => {
  const wlist = new Set(['a', 'b', 'c'])

  it('should be successful with no extra fields', () =>
    expect(Validable.whitelist({ a: 1, c: 2 }, wlist)).to.be(null))

  describe('it should return a validation error with', () => {
    specify('extra fields', () =>
      expect(Validable.whitelist({ a: 1, d: 2 }, wlist)).to.have.property('d'))

    specify('empty whitelist and non-empty object', () =>
      expect(Validable.whitelist({ a: 1 }, [])).to.have.property('a'))
  })

  describe('should return an instance of Error with', () => {
    specify('falsy object to validate', () =>
      expect(Validable.whitelist(null, wlist)).to.be.an(Error))

    specify('falsy whitelist', () =>
      expect(Validable.whitelist({ a: 1 }, null)).to.be.an(Error))

    specify('non-iterable whitelist', () =>
      expect(Validable.whitelist({ a: 1 }, { a: true })).to.be.an(Error))
  })
})

describe('blacklist', () => {
  const blist = new Set(['d', 'e', 'f'])

  describe('should be successful with', () => {
    specify('no blacklisted fields', () =>
      expect(Validable.blacklist({ 'a': 1, 'b': 2 }, blist)).to.be(null))

    specify('empty blacklist', () =>
      expect(Validable.blacklist({ 'd': 1, 'f': 2 }, [])).to.be(null))
  })

  it('should return a validation error with blacklisted fields', () =>
    expect(Validable.blacklist({ a: 1, e: null }, blist)).to.have.property('e'))

  describe('should return an instance of Error with', () => {
    specify('falsy object to validate', () =>
      expect(Validable.blacklist(null, blist)).to.be.an(Error))

    specify('falsy blacklist', () =>
      expect(Validable.blacklist({ a: 1 }, null)).to.be.an(Error))

    specify('non-iterable blacklist', () =>
      expect(Validable.blacklist({ a: 1 }, { b: true })).to.be.an(Error))
  })
})

describe('requirelist', () => {
  const rlist = ['a', 'b']

  describe('should be successful with', () => {
    specify('all required fields', () =>
      expect(Validable.requirelist({ a: 1, b: 2 }, rlist)).to.be(null))

    specify('all required fields plus others', () =>
      expect(Validable.requirelist({ a: 1, b: 2, c: 3}, rlist)).to.be(null))

    specify('empty requirelist', () =>
      expect(Validable.requirelist({ a: 1, b: 2 }, [])).to.be(null))
  })

  describe('should return an instance of Error with', () => {
    specify('falsy object to validate', () =>
      expect(Validable.requirelist(null, rlist)).to.be.an(Error))

    specify('falsy requirelist', () =>
      expect(Validable.requirelist({ a: 1 }, null)).to.be.an(Error))

    specify('non-iterable requirelist', () =>
      expect(Validable.requirelist({ a: 1 }, { b: true })).to.be.an(Error))
  })
})

describe('merge', () => {
  const err = { a: ['1'] }
  it('should return null with no arguments', () =>
    expect(Validable.merge()).to.be(null))

  describe('should be successful with', () => {
    specify('"overlapping" objects', () =>
      expect(Validable.merge(err, { a: ['2'] }).a).to.have.length(2))

    specify('"non-overlapping" objects', () => {
      const res = Validable.merge({ a: ['a'] }, { b: ['b'] }, { c: ['c'] })
      for (const x of ['a', 'b', 'c'])
        expect(res[x]).to.eql([x])
    })

    specify('a single object', () =>
      expect(Validable.merge(err)).to.eql(err))

    specify('empty objects', () =>
      expect(Validable.merge({}, {}, {}, {})).to.eql({}))
  })

  it('should throw an error with malformed objects', () =>
    expect(() => Validable.merge(err, { a: 123 })).to.throwError())
})

function shouldBeInternalError(o) {
  expect(o).to.be.an('object')
  expect(o).to.have.property('_')
}
