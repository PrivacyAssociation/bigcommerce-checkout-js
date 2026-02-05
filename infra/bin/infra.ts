import { ACMClient, ListCertificatesCommand } from '@aws-sdk/client-acm';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { App, Tags } from 'aws-cdk-lib';

import { InfraStack } from '../lib/infra-stack';

const app = new App({});
const repoName = 'bigcommerce-checkout-js';
const acmClient = new ACMClient();
const stsClient = new STSClient({ region: 'us-east-1' }); // Replace with your desired region
const acmCommand = new ListCertificatesCommand();

let iappCertificateArn = '';
let runtimeEnvironment = 'unknown';

const accountIdToEnvironmentMap: { [key: string]: string } = {
  '620738768371': 'test',
  '237529788575': 'production',
};
// TODO these dont exist yet
const awsCertificateNames: { [key: string]: string } = {
  test: '*.iapp.org', // TODO "test-checkout.iapp.org",
  production: '*.iapp.org', // TODO
};

/*
Look up global, scaffolding resources:
  ACM certificate ARN, WAF WebACL ARN, cloudfront Media Policy Id
Pass those values into the InfraStack which manages the resources necessary for MyIapp UI
*/
async function main() {
  runtimeEnvironment =
    accountIdToEnvironmentMap[
      await stsClient.send(new GetCallerIdentityCommand({})).then((data) => data.Account!)
    ] || 'unknown';

  if (runtimeEnvironment === 'unknown') {
    throw new Error(
      'failed to detect runtimeEnvironment based on STS identity, double check your AWS credentials and region',
    );
  }

  console.log(`Detected runtime environment: ${runtimeEnvironment} based on STS identity`);

  try {
    const acmResponse = await acmClient.send(acmCommand);
    const certificates = acmResponse.CertificateSummaryList;

    if (certificates === undefined) {
      throw new Error(
        'no ACM certificates found in this account, make sure scaffolding has been run',
      );
    } else {
      certificates.forEach(function (certSummary) {
        if (certSummary.DomainName === awsCertificateNames[runtimeEnvironment]) {
          if (certSummary.CertificateArn !== undefined) {
            iappCertificateArn = certSummary.CertificateArn;
          }
        }
      });

      if (iappCertificateArn === undefined || iappCertificateArn === '') {
        throw new Error('iapp certificate not found as expected, cancelling CDK build');
      }
    }
  } catch (err) {
    console.error('failed to load AWS ACM Certificates, cancelling CDK build', err);
    throw err;
  }

  const bigCommerceCheckoutJsInfraStack = new InfraStack(
    app,
    'BigCommerceCheckoutJsInfraStack',
    repoName,
    runtimeEnvironment,
    iappCertificateArn,
  );

  Tags.of(bigCommerceCheckoutJsInfraStack).add('iapp-github-repository', repoName);
  Tags.of(bigCommerceCheckoutJsInfraStack).add('iapp-product', 'BigCommerceCheckoutJS');
  Tags.of(bigCommerceCheckoutJsInfraStack).add(
    'stack-name',
    bigCommerceCheckoutJsInfraStack.stackName,
  );
}

main();