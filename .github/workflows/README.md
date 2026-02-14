# Build and deploy workflow

[Confluence Runbook](https://iappadmin.atlassian.net/wiki/spaces/DevOps/pages/4230381994/BigCommerce+Store+Checkout+Page+Pipeline+-+Runbook)

- [test.yaml](test.yaml): build & deploy to iapp-org-nonprod & run Playwright automated tests
- [production.yaml](production.yaml) deploy previously built package to iapp-org-prod & run Playwrigh tautomated tests
- [update-playwright-snapshots.yaml](update-playwright-snapshots.yaml): regenerate screenshots for Playwright automated visual regression tests - they need to be generated in a Linux environment

1. Open PR against `master` - triggers [test.yaml](test.yaml)
2. test.yaml runs build, uploads assets to S3, Playwright automated tests
3. branch protection rules exist to prevent merges to `master` until those Playwrigh tests pass
4. once merged, previously built artifacts are uploaded to production S3

## Updating automated test snapshots

The Playwright automated tests [automated-testing](../../automated-testing/README.md) have a step which validates a screenshot matches expected, saved, screenshot. this requires saving the snapshot by running `--update-snapshots` on a Linux OS. To do this, there is a button in the GitHub Actions UI which says `run workflow` enabled by the workflow_dispatch block on the [update-playwright-snapshots.yaml](update-playwright-snapshots.yaml). 

Run it from `master` branch against the desired `test` or `production` environment, and new snapshots will be updated in a PR which the GitHub Actions workflow will trigger aginst `master` branch. You can also run this from a feature branch, if you need to get snapshots updated to set up a new branch which you expect changes for when merging to master, this way the Playwright tests will not fail, and you will be able to merge.

## TODO 

- Build Failure Alerts should be more in your face, GitHub emails maybe aren't enough and need more visibility to Lonnie and Dave