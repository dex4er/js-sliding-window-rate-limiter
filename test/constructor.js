'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
chai.use(require('dirty-chai'))
chai.should()

Feature('Test sliding-window-rate-limiter module constructor', () => {
  const Limiter = require('../lib/sliding-window-rate-limiter')

  Scenario('Limiter object without options', () => {
    let error

    When('I create limiter object with no options', () => {
      try {
        return new Limiter()
      } catch (e) {
        error = e
      }
    })

    Then('assertion error is thrown', () => {
      error.should.has.property('message', 'false == true')
    })
  })

  Scenario('Limiter object without mandatory option', () => {
    let error
    let options

    for (const option of ['interval', 'limit']) {
      Given('options', () => {
        options = {
          interval: 1,
          limit: 1
        }
      })

      When(`I create limiter object without ${option} option`, () => {
        const someOptions = Object.assign({}, options)
        delete someOptions[option]

        try {
          return new Limiter(someOptions)
        } catch (e) {
          error = e
        }
      })

      Then('assertion error is thrown', () => {
        error.should.has.property('message', 'false == true')
      })
    }
  })

  Scenario('Limiter object with not a number option', () => {
    let error
    let options

    for (const option of ['interval', 'limit']) {
      Given('options', () => {
        options = {
          interval: 1,
          limit: 1
        }
      })

      When(`I create limiter object with ${option} option as a string`, () => {
        const someOptions = Object.assign({}, options)
        someOptions[option] = 'string'

        try {
          return new Limiter(someOptions)
        } catch (e) {
          error = e
        }
      })

      Then('assertion error is thrown', () => {
        error.should.has.property('message', 'false == true')
      })
    }
  })
})
