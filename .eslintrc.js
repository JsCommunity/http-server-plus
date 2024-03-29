module.exports = {
  extends: [
    // standard configuration
    "standard",

    // https://github.com/mysticatea/eslint-plugin-node#-rules
    "plugin:n/recommended",

    // disable rules handled by prettier
    "prettier",
  ],

  parserOptions: {
    sourceType: "script", // or "module" if using ES modules
  },

  rules: {
    // uncomment if you are using a builder like Babel
    // "node/no-unsupported-features/es-syntax": "off",
  },
};
