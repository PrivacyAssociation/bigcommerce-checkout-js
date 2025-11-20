# Welcome to your CDK TypeScript project

This is a project for CDK development with TypeScript.

The [cdk.json](cdk.json#L2) file tells the CDK Toolkit how to execute your app. The `app` field indicates
[/infra/bin/infra.ts](bin/infra.ts) is the entrypoint to the CDK code.

`infra.ts` uses AWS SDK to look up AWS resource ARNs of shared-services and shared-stack infrastructure not owned by the individual application IaC such as S3 artifact buckets, SSL certs, WEBacls, etc.

`infra.ts` then creates entrypoints into any stacks owned by this project in the `/infra/lib` directory, in this case there are 2 stacks:

- [CampUIStack](lib/infra-stack.ts)
  - GitHub Actions Iam role and permissions to interact with the specific infra resources for this stack
  - CloudFront Distribution and S3 Bucket for hosting the UI
  - WAF webACLs for CloudFront to protect against bots

## Run CDK locally

| environment   | aws account            |
| ------------  | ---------------------- |
| `sandbox`     | `iapp-sandbox-nonprod` |
| `prod`        | `iapp-org-prod`        |

0. if you haven't setup CDK on your laptop yet: `npm install -g aws-cdk`
1. `aws sso login` with AdministratorAccess for the appropriate AWS account
2. Get AWS credentials locally using `aws configure sso`
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
3. `cd infra` to start invoking AWS CDK
4. Synthesize CloudFormation templates and contexts; diff against AWS account contents; actually deploy to AWS
  a. `cdk synth BcCheckoutUIStack`
3. See the changes expected in AWS (examples): 
  ```
  cdk diff <StackName>
  cdk diff BcCheckoutUIStack
  ```
4. Deploy changes to AWS (examples):
  ```
  cdk deploy <StackName>
  cdk deploy BcCheckoutUIStack
  ```

5. Monitor the status, you may be prompted to accept certain changes for Iam roles and policies

## Run CDK in CICD Pipelines

This is a WIP from the DevOps team, need to [Run CDK locally](#run-cdk-locally) for now.

# Troubleshooting

If you see the following, you probably just need to navigate to the `infra` folder and re-run your command

```
--app is required either in command-line, in cdk.json or in ~/.cdk.json
