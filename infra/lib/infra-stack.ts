import { Construct } from "constructs";
import {
  Stack,
  StackProps,
  RemovalPolicy,
  aws_iam,
  aws_s3,
  Duration,
} from "aws-cdk-lib";
import { Effect, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";

/*
 Manages the infrastructure for BC Checkout UI necessary for hosting in cloudfront
*/
export class InfraStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    repoName: string,
    runtimeEnvironment: string,
    webAclArnExternal: string,
    props?: StackProps
  ) {
    super(scope, id, props);

    // BUCKET NAMING CONVENTION = <iapp>-<repo|project>-<aws-account-environment>
    const s3BucketName = repoName;
    const gitHubActionsIamRoleName =
      "GitHubActions-AssumeRoleWithAction-" +
      repoName +
      "-" +
      runtimeEnvironment;
    const gitHubActionsIamRoleDescription =
      "The IAM role responsible for CICD pipeline operations for " + repoName;
    const gitHubActionsIdentityProviderName =
      "token.actions.githubusercontent.com"; // this should not change, it is generated from iapp_scaffolding IaC
    const gitHubActionsFederatedPrincipal =
      "arn:aws:iam::" +
      this.account +
      ":oidc-provider/" +
      gitHubActionsIdentityProviderName;
    const cloudfrontDescription = "BC Checkout UI distribution";
    const cloudfrontPriceClass = cloudfront.PriceClass.PRICE_CLASS_100; // keeping at lowest cost option for now since it covers USA, Canada, Europe, & Israel which is the vast majority of traffic

    // GitHub actions IAM role for AWS IdP for this repo
    // actions pipeline will use this role for all operations in AWS
    const gitHubActionsIamRole = new aws_iam.Role(
      this,
      gitHubActionsIamRoleName,
      {
        roleName: gitHubActionsIamRoleName, // actual name
        description: gitHubActionsIamRoleDescription,
        assumedBy: new aws_iam.WebIdentityPrincipal(
          gitHubActionsFederatedPrincipal,
          {
            StringEquals: {
              "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            },
            StringLike: {
              "token.actions.githubusercontent.com:sub":
                "repo:PrivacyAssociation/" + repoName + ":*",
            },
          }
        ),
      }
    );

    // S3 bucket for hosting the BC Checkout UI index and assets
    const siteBucket = new aws_s3.Bucket(this, s3BucketName, {
      bucketName: s3BucketName,
      publicReadAccess: false,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: aws_s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      versioned: true,
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      // TODO only enable metrics and logs in prod, but testing this out in sandbox and test for now to determine if it works
      metrics: [
        {
          id: "bcCheckoutSiteBucketMetrics",
          // prefix: '', // optional, will apply to all objects in the bucket
        },
      ],
      // serverAccessLogsBucket: '', //
      //serverAccessLogsPrefix: "bcCheckout-cloudfront-access-logs/", // prefix for access logs, if serverAccessLogsBucket is not set, uses the current bucket
      // TODO lifecycle rules, clean it up once moving to blue/green. There is no easy lifecycle mechanism for path based routes
    });

    // explicitly define origin access control so we can set the description field, and better control
    const cloudfrontOAC = new cloudfront.S3OriginAccessControl(
      this,
      "BcCheckoutCloudFrontOaC",
      {
        description: repoName + "-oac",
        originAccessControlName: siteBucket.bucketDomainName,
        signing: cloudfront.Signing.SIGV4_ALWAYS, // TODO learn more about this before going live
      }
    );

    // CloudFront distribution for the BC Checkout UI
    const distribution = new cloudfront.Distribution(
      this,
      "BcCheckoutUIDistribution",
      {
        comment: cloudfrontDescription,
        httpVersion: cloudfront.HttpVersion.HTTP2,
        defaultRootObject: "index.html",
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        // error responses based on current Camp cloudfront behavior
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: Duration.seconds(300),
          },
          {
            // for unknown pages, redirect to the home page
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: Duration.seconds(300),
          },
        ],

        defaultBehavior: {
          origin: cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
            siteBucket,
            { originAccessControl: cloudfrontOAC }
          ),
          compress: true,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED, // 'CachingOptimized' is the default setting, AWS recommends for S3 origins
          // this is the default when we applied it, also the only methods currently allowed
        },
        webAclId: webAclArnExternal,
        priceClass: cloudfrontPriceClass,
        publishAdditionalMetrics: false,
      }
    );

    // bucket policy granting CloudFront access
    const bucketPolicy = new aws_s3.BucketPolicy(
      this,
      "BcCheckoutCloudFrontBucketPolicy",
      {
        bucket: siteBucket,
      }
    );

    bucketPolicy.document.addStatements(
      new PolicyStatement({
        sid: "AllowCloudFrontServicePrincipalReadOnly",
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal("cloudfront.amazonaws.com")],
        actions: ["s3:GetObject"],
        resources: [`${siteBucket.bucketArn}/*`],
        conditions: {
          StringEquals: { "AWS:SourceArn": distribution.distributionArn },
        },
      })
    );
    // more comments for validating the github actions filtering

    // ---  Changes to GitHub Actions IAM role must be done manually before the pipeline can use those permissions --- //

    // pipeline can write build artifacts to the S3 bucket which the CloudFront distribution uses to host the content of BcCheckoutUI
    gitHubActionsIamRole.addToPolicy(
      new aws_iam.PolicyStatement({
        sid: "GitHubActionsDeployCode",
        actions: [
          "s3:*",
          "cloudfront:*",
          "cloudfront-keyvaluestore:*",
          "iam:ListServerCertificates",
        ],
        resources: [
          siteBucket.bucketArn,
          `${siteBucket.bucketArn}/*`,
          distribution.distributionArn,
        ],
      })
    );

    // pipeline should only have permissions to create and modify resources necessary for this application and repository
    gitHubActionsIamRole.addToPolicy(
      new aws_iam.PolicyStatement({
        sid: "GitHubActionsIacPermissionsCDK",
        actions: ["wafv2:*", "cloudfront:*"],
        resources: [
          `arn:aws:cloudfront:${this.region}:${this.account}:${repoName}*`,
          `arn:aws:wafv2:${this.region}:${this.account}:global/webacl/${repoName}*`,
        ],
      })
    );

    gitHubActionsIamRole.addToPolicy(
      new aws_iam.PolicyStatement({
        sid: "GitHubActionsIacPermissionsListCerts",
        actions: [
          "acm:ListCertificates",
          "wafv2:ListIPSets",
          "wafv2:ListWebACLs",
        ],
        resources: [`*`],
      })
    );

    gitHubActionsIamRole.addToPolicy(
      new aws_iam.PolicyStatement({
        sid: "GitHubActionsIacPermissionsReadCDK",
        actions: [
          "ssm:GetParameter",
          "s3:*",
          "cloudformation:*",
          "cloudfront:*"
        ],
        resources: [
          `arn:aws:ssm:us-east-1:${this.account}:parameter/cdk-bootstrap/*`,
          `arn:aws:s3:::cdk-*-assets-${this.account}-us-east-1`,
          `arn:aws:s3:::cdk-*-assets-${this.account}-us-east-1/*`,
          `arn:aws:cloudformation:us-east-1:${this.account}:stack/BcCheckoutUIStack/*`,
          `arn:aws:cloudfront::${this.account}:cache-policy/*`
        ],
      })
    );

    gitHubActionsIamRole.addToPolicy(
      new aws_iam.PolicyStatement({
        sid: "GitHubActionsIacPermissionCDKRoles",
        actions: ["iam:Passrole", "sts:AssumeRole"],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      })
    );
  }
}
