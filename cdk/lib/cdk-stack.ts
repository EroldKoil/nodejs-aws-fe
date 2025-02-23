import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class MyShopStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const websiteBucket = new s3.Bucket(this, 'MyShopFirstBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      websiteIndexDocument: 'index.html',
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', {
      comment: 'Allow CloudFront to access the website bucket',
    });

    // Grant read permissions to CloudFront
    websiteBucket.grantRead(originAccessIdentity);

    // Create a CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'MyShop-distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30),
        },
      ],
    });

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, 'MyShop-Bucket-Deployment', {
      sources: [s3deploy.Source.asset('../dist')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'Website URL',
    });

    // Output the S3 bucket name
    new cdk.CfnOutput(this, 'BucketName', {
      value: websiteBucket.bucketName,
      description: 'Website bucket name',
    });
  }
}
