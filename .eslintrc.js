// npm i -g eslint eslint-config-standard eslint-plugin-import eslint-plugin-node eslint-plugin-promise eslint-plugin-standard eslint-plugin-tap-given

module.exports = {
  'extends': 'standard',
  'plugins': [ 'tap-given' ],
  'env': {
    'tap-given/tap-given': true
  }
}
