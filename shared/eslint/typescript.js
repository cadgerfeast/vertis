/** @type {import('eslint").Linter.Config} */
module.exports = {
    root: true,
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    ignorePatterns: ['dist'],
    rules: {
        'no-unused-vars': 0,
        '@typescript-eslint/no-explicit-any': 1,
        '@typescript-eslint/no-unused-vars': 1
    }
};
