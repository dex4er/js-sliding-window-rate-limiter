import Mocha from "mocha"

export function Feature(what: string, how: () => void): Mocha.Suite {
  return describe("Feature: " + what, how)
}
export function Scenario(what: string, how: () => void): Mocha.Suite {
  return describe("Scenario: " + what, how)
}
export function Given(what: string, how: (this: Mocha.ISuiteCallbackContext) => void): Mocha.ISuite {
  return step("Given " + what, how)
}
export function When(what: string, how: (this: Mocha.ISuiteCallbackContext) => void): Mocha.ISuite {
  return step("When " + what, how)
}
export function Then(what: string, how: (this: Mocha.ISuiteCallbackContext) => void): Mocha.ISuite {
  return step("Then " + what, how)
}
export function And(what: string, how: (this: Mocha.ISuiteCallbackContext) => void): Mocha.ISuite {
  return step("And " + what, how)
}
export function After(callback: (this: Mocha.Context, done: Mocha.Done) => any): void {
  after(callback)
}
