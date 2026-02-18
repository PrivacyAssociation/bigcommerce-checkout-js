# Build and deploy workflows

[Confluence Runbook](https://iappadmin.atlassian.net/wiki/spaces/DevOps/pages/4230381994/BigCommerce+Store+Checkout+Page+Pipeline+-+Runbook)

**Release concern:**
 1. sync BigCommerce Checkout main to keep our repo `master` up to date
 2. sync BigCommerce Checkout main with our repo `master` manually via UI or command line
 3. manually invoke GitHub Actions deployment pipeline to trigger a rebuild of current `master`
 4. PR opened against `master` with custom IAPP code changes 

**GitHub Actions workflows:**
- [sync-bc-main.yaml](sync-bc-main.yaml): weekly cron which syncs with BC main, then invokes deploy pipeline workflows
- [test.yaml](test.yaml): build & deploy to iapp-org-nonprod & run Playwright automated tests
- [production.yaml](production.yaml) deploy previously built package to iapp-org-prod & run Playwrigh tautomated tests
- [update-playwright-snapshots.yaml](update-playwright-snapshots.yaml): regenerate screenshots for Playwright automated visual regression tests - they need to be generated in a Linux environment

> branch protection rules exist to prevent merges to `master` until Playwright tests succeed from `test.yaml`

## Updating automated test snapshots

The Playwright automated tests [automated-testing](../../automated-testing/README.md) have a step which validates a screenshot matches expected, saved, screenshot. this requires saving the snapshot by running `--update-snapshots` on a Linux OS. To do this, there is a button in the GitHub Actions UI which says `run workflow` enabled by the workflow_dispatch block on the [update-playwright-snapshots.yaml](update-playwright-snapshots.yaml). 

Run it from `master` branch against the desired `test` or `production` environment, and new snapshots will be updated in a PR which the GitHub Actions workflow will trigger aginst `master` branch. You can also run this from a feature branch, if you need to get snapshots updated to set up a new branch which you expect changes for when merging to master, this way the Playwright tests will not fail, and you will be able to merge.


### What happens when my PR or a BC Main sync causes functional or locator changes that break the Playwright automation?

You may be seeing the chicken and egg situation here...if we make changes to the store, the Playwright automation will fail. But to get changes deployed to the store, we have required Playwright automation to pass with GitHub branch protection rules.

So how do we get the automation changes in place BEFORE the pipeline runs?

Actually this is not going to be how this works right now. We need to deploy code to the environment and have a Linux snapshot in Playwright. This means that if there are differences between sandbox and live BC, or with changes to our IAPP specific code in this repository, we will need to DISABLE the validation in Playwright, run the snapshot update script, ENABLE the Playwright validation in the pipeline, then redeploy.

**DISABLE Playwright validation in the pipeline**
Do NOT comment out or remove GitHub Actions workflow file steps or jobs, this has more side effects than is worth changes to.

Instead modify the Playwright test file(s) to return true, so the tests all run, but no-op essentially. This enables the pipeline to progress, and code to deploy. And comment out the 

> **We're assuming that there is high visibility into the BC Store at this time, given that tests are being manually disabled**

Make sure to re-enable the Playwright code once everything is good.

## TODO 

- Build Failure Alerts should be more in your face, GitHub emails maybe aren't enough and need more visibility to Lonnie and Dave
