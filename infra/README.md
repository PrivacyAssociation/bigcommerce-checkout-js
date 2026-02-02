# Infrastructure project for BigCommerce Checkout JS assets

IaC is run locally.

**AWS Accounts and Runtime Environments:**

- test: `iapp-org-nonprod`
- prod: `iapp-org-prod`

## Whats included

- IAM role and policies for GitHub Actions to build and deploy assets to S3, and invalidate CloudFront cache
- S3 Bucket for hosting Assets
- CloudFront Distribution which caches for the S3 Origin
- WAF?
- 

The [package.json](./package.json) contains minimal dependencies for deploying CDK app.

The [cdk.json](../infra/cdk.json) file tells the CDK Toolkit how to execute your app.
The first line indicates the entrypoint into the CDK code is [bin/infra.ts](../infra/bin/infra.ts)

> "app": "npx ts-node --prefer-ts-exts bin/infra.ts",

Which defines which `Stacks` to deploy. CDK is a wrapper of CloudFormation enabling infrastrcture to be defined in the same language as the application code, linted, and unit tested. This `stack` is what will be shown in AWS CloudFormation and represents the components of this application.

The [BigCommerceCheckoutJsInfraStack](../infra/lib/infra-stack.ts) describes the IAM, S3, CloudFront resources in AWS.


## WAF Management
Since this is a public website, the WAF is set to ALLOW traffic by default if no rule matches the traffic. Since there are very few inputs beyond forms and search(which are both client side), and no authenticated login, there is little that needs protection. Our goal should be to minimize the cost of protections in terms of real dollars on spent on WAF and of blocking legitimate traffic while implementing general purpose protections against server exploits, DoS attacks (infra expense), and invalid form submissions.

Reasoning for rules should be transferred from [the wiki](https://iappadmin.atlassian.net/wiki/spaces/CMSIAPPorg/pages/4163010590/WAF+rule+proposal) as they are implemented.


## Run IaC locally

1. install aws-cli if not already done

- Install from company portal
- [Add to path](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-troubleshooting.html#tshoot-install-not-found)

2. get AWS credentials locally using `aws configure sso`
   1. If you've never done this, open up a web browser and launch the [AWS account selector page](https://d-906764ca68.awsapps.com/start/#/?tab=accounts)
   2. Click `Access keys` next to the `AdministratorAccess` credentials under the AWS account you are trying to connect to.
   3. Copy the `SSO start URL`
   4. In `Git Bash` run `aws configure sso`
   5. It will prompt `SSO session name` (just used for auditing), name it anything e.g. `shane-sso`
   6. Your default browser will be opened automatically, attempting to log in to AWS with your IAPP account via SSO
   7. Assuming you log in via browser successfully, the terminal will provide list of accounts you are authorized to, arrow down and hit enter to select the highlighted account
   8. You will be prompted again `There are 3 roles available to you.` select `AdministratorAccess` so IaC can run fully.
   9. Default client Region: `us-east-1`
   10. CLI default output format (json if not specified) [None]: choose the default `None`
   11. Profile name: enter the string `default` otherwise your IaC won't run. This is because the IaC is not keyed to a specific profile, thus it relies on `default`
   12. verify by checking the `~/.aws/config` file to ensure there is a `default` profile configured
       > **NOTE** If you have `~/.aws/credentials` file which contains a `default` profile, it will override anything in the `~/.aws/credentials` file. Ensure you backup and delete the `~/.aws/credentials` file to avoid this problem.

3. synthesize CloudFormation templates and contexts; diff against AWS account contents; actually deploy to AWS

> this CDK project relies on STS caller identity based off the AWS credentials on the terminal to auto-detect environment

```
cd infra
npm install
npm run cdk synth BigCommerceCheckoutJsInfraStack
npm run cdk diff BigCommerceCheckoutJsInfraStack
npm run cdk deploy BigCommerceCheckoutJsInfraStack
```
