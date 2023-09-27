/* eslint-env node */
module.exports = {
    root: true,
    extends: ['vertis/typescript'],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.eslint.json'
    }
};
