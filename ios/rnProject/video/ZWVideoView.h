//
//  ZWVideoView.h
//  rnProject
//
//  Created by zwkj on 2018/8/29.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "ZWStreamView.h"

@interface ZWVideoView : ZWStreamView

-(void)close;
-(void)sendMessage:(NSString*)msg;
@end
