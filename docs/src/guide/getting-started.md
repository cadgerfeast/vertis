# Getting Started

Using `Vertis` is fast and easy, here's a few common ways:

First, either install the `dependency`, or use via [npx](https://docs.npmjs.com/cli/commands/npx), then:

``` bash
# Generate a changelog
vertis generate
```

This command will look for a `vertis.config.js` file and generate a changelog based on configuration.

Default strategy is [Lerna Conventional](./strategies/lerna-conventional.md).
