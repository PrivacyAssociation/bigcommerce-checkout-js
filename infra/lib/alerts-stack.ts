import { Construct } from 'constructs';
import {
    Stack,
    StackProps,
    Duration,
    aws_sns,
    aws_sns_subscriptions,
    aws_cloudwatch,
    aws_cloudwatch_actions,
} from 'aws-cdk-lib';

/*
 CloudWatch Alerts configured with SNS topics for notifications. Notifications have subscribers to slack channel email addresses.
    Alerts configured:
    - CloudFront 5xx error rate > 1% for 15 minutes
*/
export class AlertsStack extends Stack {
    constructor(
        scope: Construct,
        id: string,
        repoName: string,
        runtimeEnvironment: string,
        cloudFrontDistributionId: string,
        props?: StackProps,
    ) {
        super(scope, id, props);

        if (
            runtimeEnvironment != 'test' &&
            runtimeEnvironment != 'production'
        ) {
            throw new Error(
                `failed to detect runtimeEnvironment, found ${runtimeEnvironment} expected one of test | production. Check your AWS credentials and region. This stack should only run on org-nonprod and org-prod`,
            );
        }

        const alarmTopic = new aws_sns.Topic(this, 'AlarmTopic', {
            topicName: `${repoName}-alarm-topic-${runtimeEnvironment}`,
            displayName: `${repoName} Alarm Notifications`,
        });

        const alarmChannelsByEnvironment: {
            [key: string]: string;
        } = {
            test: 'store-alerts-aaaatd3jtchle6gdyds75wo2iq@privacypros.slack.com', // #store-alerts
            production:
                'store-alerts-aaaatd3jtchle6gdyds75wo2iq@privacypros.slack.com', // #store-alerts
        };

        alarmTopic.addSubscription(
            new aws_sns_subscriptions.EmailSubscription(
                alarmChannelsByEnvironment[runtimeEnvironment],
            ),
        );

        const cloudfrontDistribution5xxAlert = new aws_cloudwatch.Metric({
            metricName: '5xxErrorRate',
            namespace: 'AWS/CloudFront',
            dimensionsMap: {
                DistributionId: cloudFrontDistributionId,
                Region: 'Global', // CloudFront metrics are global
            },
            period: Duration.minutes(5),
            statistic: 'average',
        });

        const cloudfront5xxRateAlarm = new aws_cloudwatch.Alarm(
            this,
            '5xxRateAlarm',
            {
                alarmName: `${repoName}-cloudfront-5XX-rate-${runtimeEnvironment}`,
                alarmDescription:
                    'BigCommerce Checkout JS serving the MyIapp Login button on the Store checkout page is experiencing a high 5xx error rate, which may indicate an issue with the CloudFront distribution or its origin. Immediate investigation is recommended to ensure the checkout experience remains stable for customers.',
                metric: cloudfrontDistribution5xxAlert,
                threshold: 8, // Trigger if > 1% error rate
                evaluationPeriods: 2, // Evaluate over 3 periods
                datapointsToAlarm: 2, // 2 out of 3 periods must breach
                comparisonOperator:
                    aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                actionsEnabled: true,
                treatMissingData: aws_cloudwatch.TreatMissingData.NOT_BREACHING,
            },
        );

        cloudfront5xxRateAlarm.addAlarmAction(
            new aws_cloudwatch_actions.SnsAction(alarmTopic),
        );

    }
}
