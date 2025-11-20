import { Tags, App } from "aws-cdk-lib";
import { InfraStack } from "../lib/infra-stack";
import { WAFV2Client, ListWebACLsCommand } from "@aws-sdk/client-wafv2";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

const repoName = "bigcommerce-checkout-js";
const wafClient = new WAFV2Client();
const stsClient = new STSClient({ region: "us-east-1" });

const app = new App({});

const wafCommand = new ListWebACLsCommand({
  Scope: "CLOUDFRONT",
  Limit: Number(50),
});

let runtimeEnvironment: string = "";
const accountIdToEnvironmentMap: { [key: string]: string } = {
  "759021155229": "sandbox",
  "237529788575": "production",
};

/*
Look up global, scaffolding resources:
ACM certificate ARN, WAF WebACL ARN, cloudfront Media Policy Id
Pass those values into the InfraStack which manages the resources necessary for Camp UI
*/
async function main() {
  runtimeEnvironment =
    accountIdToEnvironmentMap[
      await stsClient
        .send(new GetCallerIdentityCommand({}))
        .then((data) => data.Account!)
    ] || "unknown";
  if (runtimeEnvironment === "unknown") {
    throw new Error(
      "failed to detect runtimeEnvironment based on STS identity, double check your AWS credentials and region"
    );
  }

  console.log(`Detected runtime environment: ${runtimeEnvironment}`);

  /*
    Defaulting WAF to external WebACL for all environments
  */
  let externalWebAclArn: string = "";
  try {
    const wafResponse = await wafClient.send(wafCommand);
    const webAcls = wafResponse.WebACLs;
    if (webAcls === undefined) {
      throw new Error(
        "no webacls found in this account, make sure scaffolding has been run"
      );
    } else {
      const externalWebAcl = webAcls.find(
        (webAcl) =>
          webAcl.Name === "WebACLWithAMRCloudFrontExternal" && !!webAcl.ARN
      );

      if (!externalWebAcl) {
        throw new Error(
          "Failed to look up AWS CloudFront WebACL WebACLWithAMRCloudFrontExternal"
        );
      }

      externalWebAclArn = externalWebAcl.ARN!;
    }
  } catch (err) {
    console.error(
      "Failed to load AWS Cloudfront WEBACLs, cancelling CDK build",
      err
    );
    throw err;
  }

  const stackName = "BcCheckoutUIStack";

  const bcCheckoutUIStack = new InfraStack(
    app,
    stackName,
    repoName,
    runtimeEnvironment,
    externalWebAclArn,
  );

  Tags.of(bcCheckoutUIStack).add("iapp-github-repository", repoName);
  Tags.of(bcCheckoutUIStack).add("iapp-product", "BigCommerceCheckout");
  Tags.of(bcCheckoutUIStack).add("stack-name", bcCheckoutUIStack.stackName);
}

main();
