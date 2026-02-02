import { aws_certificatemanager, aws_iam, aws_s3, RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import {
  ArnPrincipal,
  Effect,
  PolicyStatement,
  ServicePrincipal,
  StarPrincipal,
} from 'aws-cdk-lib/aws-iam';
import { type Construct } from 'constructs';

// Specify allowed origins, avoiding trailing slashes
const NONPROD_ORIGINS =  [
        'https://iapp-akeneo-sandbox.mybigcommerce.com',
        'https://store.iapp.org',
        'https://sandbox-iapp.mybigcommerce.com/'
      ]
      
// Specify allowed origins, avoiding trailing slashes
const PROD_ORIGINS =  [
        'https://store.iapp.org',
      ]

/*
 Manages the infrastructure for BigCommerce Checkout JS necessary for hosting in cloudfront such that the IAPP Store can use the MyIapp Login
*/
export class InfraStack extends Stack {
  public readonly siteBucket: aws_s3.Bucket;
  constructor(
    scope: Construct,
    id: string,
    repoName: string,
    runtimeEnvironment: string,
    iappCertificateArn: string,
    webAclArn: string,
  ) {
    super(scope, id);

    if (runtimeEnvironment !== 'test' && runtimeEnvironment !== 'production') {
      throw new Error(
        `failed to detect runtimeEnvironment, found \`${
          runtimeEnvironment
        }\` expected one of test | production, please check your AWS credentials and region.`,
      );
    }

    const gitHubActionsIamRoleName = `GitHubActions-AssumeRoleWithAction-${repoName}`;
    const gitHubActionsIamRoleDescription = `The IAM role responsible for CICD pipeline operations for ${repoName}`;
    const gitHubActionsIdentityProviderName = 'token.actions.githubusercontent.com'; // this should not change, it is generated from iapp_scaffolding IaC
    const gitHubActionsFederatedPrincipal = `arn:aws:iam::${this.account}:oidc-provider/${gitHubActionsIdentityProviderName}`;
    const cloudfrontDescription = 'BigCommerce Checkout javascript assets distribution';
    const cloudfrontPriceClass = cloudfront.PriceClass.PRICE_CLASS_100;
    const cloudfrontAdditionalMetrics = runtimeEnvironment === 'production';

    // GitHub actions IAM role for AWS IdP for this repo
    // actions pipeline will use this role for all operations in AWS
    const gitHubActionsIamRole = new aws_iam.Role(this, gitHubActionsIamRoleName, {
      roleName: gitHubActionsIamRoleName, // actual name
      description: gitHubActionsIamRoleDescription,
      assumedBy: new aws_iam.WebIdentityPrincipal(gitHubActionsFederatedPrincipal, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:PrivacyAssociation/${repoName}:*`,
        },
      }),
    });

    const s3BucketName = `${repoName}-assets-${runtimeEnvironment}`;

    const corsRule: aws_s3.CorsRule = {
      allowedMethods: [
        aws_s3.HttpMethods.GET,
        aws_s3.HttpMethods.HEAD,
      ],
      allowedOrigins: runtimeEnvironment === 'production' ? PROD_ORIGINS: NONPROD_ORIGINS,
      // Allow all headers
      allowedHeaders: ['*'], 
      // Expose specific headers to the client
      exposedHeaders: [
        'ETag', 
      ],
      // Optional: Set max age for preflight OPTIONS requests (in seconds)
      maxAge: 3000, 
    };

    this.siteBucket = new aws_s3.Bucket(this, s3BucketName, {
      bucketName: s3BucketName,
      publicReadAccess: false,
      cors: [corsRule],
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: aws_s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      versioned: true,
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      // TODO lifecycle rules, clean it up once moving to blue/green. There is no easy lifecycle mechanism for path based routes
    });

    // TODO create ACM cert in UI manually. This will avoid any IaC drift issues breaking certs in future
    const iappCertificate = aws_certificatemanager.Certificate.fromCertificateArn(
      this,
      'IappACMCertificate',
      iappCertificateArn,
    );

    // explicitly define origin access control so we can set the description field, and better control
    const cloudfrontOAC = new cloudfront.S3OriginAccessControl(this, 'CloudFrontOaC', {
      description: `${repoName}-oac`,
      originAccessControlName: this.siteBucket.bucketDomainName,
      signing: cloudfront.Signing.SIGV4_ALWAYS, // TODO learn more about this before going live
    });

    // TODO decide on domain names
    // const domainNamesByEnvironment = {
    //   production: ["checkout.iapp.org"],
    //   test: ["test-checkout.iapp.org"],
    // }; // no custom domain names for now, will add in the future

    // CloudFront distribution for the Store UI Assets
    const distribution = new cloudfront.Distribution(
      this,
      'IappBigCommerceStoreCheckoutAssetsSiteDistribution',
      {
        comment: cloudfrontDescription,
        certificate: iappCertificate,
        httpVersion: cloudfront.HttpVersion.HTTP2, // TODO do we need HTTP3 for this?
        defaultRootObject: 'loader.js',
        // domainNames: domainNamesByEnvironment[runtimeEnvironment],
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        defaultBehavior: {
          origin: cloudfront_origins.S3BucketOrigin.withOriginAccessControl(this.siteBucket, {
            originAccessControl: cloudfrontOAC,
          }),
          compress: true,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED, // 'CachingOptimized' is the default setting, AWS recommends for S3 origins
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD, // this is the default when we applied it, also the only methods currently allowed
        },
        webAclId: webAclArn, // Associate the WAF Web ACL here for internal only traffic; TODO update for go live
        priceClass: cloudfrontPriceClass, // only prod needs to reach the whole world AFAIK
        publishAdditionalMetrics: cloudfrontAdditionalMetrics, // only publish additional metrics in prod for now
      },
    );

    const bucketPolicy = new aws_s3.BucketPolicy(this, 'BucketPolicy', {
      bucket: this.siteBucket,
    });

    bucketPolicy.document.addStatements(
      new PolicyStatement({
        sid: 'AllowCloudFrontServicePrincipalReadOnly',
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [`${this.siteBucket.bucketArn}/*`],
        conditions: {
          StringEquals: { 'AWS:SourceArn': distribution.distributionArn },
        },
      }),
      // new PolicyStatement({
      //   sid: 'DENYOtherReadAccess',
      //   effect: Effect.DENY,
      //   principals: [new StarPrincipal()],
      //   actions: ['s3:GetObject'],
      //   resources: [`${this.siteBucket.bucketArn}/*`, this.siteBucket.bucketArn],
      //   conditions: {
      //     StringNotEquals: { 'AWS:SourceArn': distribution.distributionArn },
      //   },
      // }),
      // I Do not think this should be needed since the DENY policy includes a putoBject policy
      //   new PolicyStatement({
      //     sid: 'AllowPipelineWriteAccess',
      //     effect: Effect.ALLOW,
      //     principals: [
      //       new ServicePrincipal(`arn:aws:iam::${this.account}:role/${gitHubActionsIamRoleName}`),
      //     ],
      //     actions: ['s3:PutObject'],
      //     resources: [`${this.siteBucket.bucketArn}/*`],
      //   }),
      // TODO deny write access to anyone else who is not the root account or the pipeline
      new PolicyStatement({
        sid: 'DENYOtherWriteAccess',
        effect: Effect.DENY,
        principals: [new StarPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.siteBucket.bucketArn}/*`, this.siteBucket.bucketArn],
        conditions: {
          StringNotEquals: { 'AWS:PrincipalArn': [`arn:aws:iam::${this.account}:root`,`arn:aws:iam::${this.account}:role/${gitHubActionsIamRoleName}`] },
        },
      }),
    );

    // pipeline can write build artifacts to the S3 bucket which the CloudFront distribution uses to host the content
    gitHubActionsIamRole.addToPolicy(
      new aws_iam.PolicyStatement({
        sid: 'GitHubActionsDeployCode',
        actions: [
            's3:PutObject',
            's3:ListBucket',
            's3:GetObject',
        ],
        resources: [this.siteBucket.bucketArn, `${this.siteBucket.bucketArn}/*`],
      }),
    );

    // pipeline should only have permissions to create and modify reources necessary for this application and repository
    gitHubActionsIamRole.addToPolicy(
      new aws_iam.PolicyStatement({
        sid: 'GitHubActionsIacPermissionsCDK',
        actions: [
            'wafv2:ListWebACLs',
            'cloudfront:CreateInvalidation',
            'cloudfront:GetInvalidation',
            'cloudfront:GetDistribution',
            'cloudfront:GetDistributionConfig'
        ],
        resources: [
          `${distribution.distributionArn}`,
          `arn:aws:wafv2:${this.region}:${this.account}:global/webacl/${repoName}*`,
        ],
      }),
    );

  }
}