module.exports = {
  extends: [
    'standard',
    'plugin:node/recommended',
    'prettier',
    'prettier/standard',
  ],
  rules: {
    'no-var': 'error',
    'node/no-extraneous-import': 'error',
    'node/no-extraneous-require': 'error',
    'prefer-const': 'error',
  },
}
