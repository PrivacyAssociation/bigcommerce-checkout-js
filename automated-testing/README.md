# Automated Testing

- [Automated Testing Goals](#goals-of-automated-testing)
- [Test Execution](#test-execution)
  - [Headed mode](#headed-mode)
- [Development guide](#development)
  - [Test Scenario Files](#test-scenarios)
  - [Test Results](#test-results)

# Goals of Automated Testing

Validate in a given environment either TEST or PRODUCTION, that the IAPP BigCommerce Store corretly displays the "Sign In" button which this repository maintains.

This project runs Playwright automation to invoke the following UI flow in a chrome headless browser.

1. Navigate to the store page for AIGP certification
2. Ensure all required fields are selected
3. Add to cart
4. Go to the `/checkout` page
5. Verify the `SignIn` button renders, and that it was requested from `checkout.iapp.org`
6. Click the `SignIn` button, and log in to MyIapp as `shanyetest` user.
7. Waits for the redirect back to BigCommerce store, then goes back to `/checkout`
8. Confirms user is still logged in, and correct screen is rendered at checkout

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

## Test Users Config

Test user data can be loaded locally or in GitHub Actions into the file [tests/regression/user-config.json](tests/regression/user-config.json).

The content must be in the following format:

```json
{
  "users": [{ "username": "shanyetest", "password": "1234abcd" }]
}
```

## Test Scenarios

The tests should be fairly self documented as much as possible.

- [automated-testing/tests/regression](tests/regression/bigcommerce-checkout-test.spec.ts) is currently the only test suite. The goal is lightweight page navigation and validation.

## Test Results

When running locally, Playwright will open a browser tab with the results on failure, otherwise it prints a link to a localhost address at the end of the test run which can be opened.

Otherwise you can usually find previous test runs in the [test-results](test-results) folder.
