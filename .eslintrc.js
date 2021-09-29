// module.exports = {
//   root: true,
//   extends: '@react-native-community',
// };


module.exports = {
  parser: 'babel-eslint',
  extends: 'airbnb',
  rules: {
    'react/jsx-filename-extension': [1, { extensions: ['.js'] }],
    'linebreak-style': 'off',
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    'eol-last': 'off',
    'import/no-extraneous-dependencies': 'off',
    'react/prefer-stateless-function': 'off',
    'react/forbid-prop-types': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react/sort-comp': 'off',
    'react/no-multi-comp': 'off',
    'space-before-function-paren': 'off',
  },
  globals: {
    fetch: false,
    FormData: false,
    setInterval: false,
    clearInterval: false,
  },
};
