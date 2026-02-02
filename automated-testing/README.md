# Automated Testing

- [Automated Testing Goals](#goals-of-automated-testing)
- [Test Execution](#test-execution)
  - [Local Dev Server Testing](#run-playwright-against-local-dev-server)
  - [Headed mode](#headed-mode)
- [Test Scenarios](#test-scenarios)
  - [Test Results](#test-results)
- [Development guide](#development)
  - [TODOs](#todos)

# Goals of Automated Testing

# Test Execution

> **projects e.g. test modes**
>
> - test-regression
> - production-regression

> normally playwright will parallelize tests as much as possible which is challenging when attempting to visually inspect the headed browsers
> `export CI=1`

```
npm install
npx playwright test --project=test-regression
```

## run playwright against local dev server

1. start local dev server `nohup npm run dev &`
2. invoke playwright test suite against local project
   `npx playwright test --project=local-regression`

## Headed mode

```
npx playwright test --headed --project=test-regression
npx playwright test --headed --project=local-regression
npx playwright test --headed --project=production-regression
```

> it may also prove helpful to limit the number of workers to 1 when running in headed mode such that only 1 automated browser will be run at a time.

## UI mode brings up a Playwright GUI

```
npx playwright test --ui --project=test-regression
```

# Development

## Playwright config

[playwright.config.ts](./playwright.config.ts)

Indicates which test scenarios run which test folder.

```
{
    name: 'test-regression',
    testDir: './tests/regression/',
    use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://test.iapp.org'
    },
},
```

# Test Scenarios

The tests should be fairly self documented as much as possible.

- [automated-testing/tests/regression](tests/regression) is currently the only test suite. The goal is lightweight page navigation and validation.

## TODO

Currently there are NO visual regression tests due to the large volume of dynamic content. We should pick a page with the least dynamic content and code playwright to validate this page visually to ensure no layout issues were introduced.

Currently there are NO content validation tests. At least one page should be validated that the most recent content from contentStack is showing up in searches or on the news page, and can be navigated to.

## Test Results

when running locally, playwright will open a browser tab with the results on failure, otherwise it prints a link to a localhost address at the end of the test run which can be opened.
