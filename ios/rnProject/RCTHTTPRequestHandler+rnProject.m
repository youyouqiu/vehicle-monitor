//
//  RCTHTTPRequestHandler+rnProject.m
//  rnProject
//
//  Created by zwlbs on 2020/7/21.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTHTTPRequestHandler.h>
//#import <RCTHTTPRequestHandler.h>

@implementation RCTHTTPRequestHandler(rnProject)

- (void)URLSession:(NSURLSession *)session
didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
 completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential * _Nullable))completionHandler
{
  completionHandler(NSURLSessionAuthChallengeUseCredential, [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust]);
}

@end
