//
//  OCRTransportInfoValidationViewController.m
//  scanning
//
//  Created by zwkj on 2019/6/26.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "OCRTransportInfoValidationViewController.h"
#import "OCRServices.h"
#import "OCRSingleton.h"
#import "ToastView.h"
#import "PhotoFullScreen.h"
#import "MyUITapGestureRecognizer.h"

#define UIColorFromRGB(rgbValue) [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 green:((float)((rgbValue & 0xFF00) >> 8))/255.0 blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@interface OCRTransportInfoValidationViewController ()<UITableViewDelegate, UITableViewDataSource, UITextFieldDelegate>

@property (nonatomic, strong) UILabel *monitorName;
@property (nonatomic, strong) NSArray *transportData;
@property (nonatomic, strong) UIButton *uploadCertificate;
@property (nonatomic, strong) UITextField *transportationCardNumberTextField;
@property (nonatomic, strong) UITextField *currentTextField; // 当前输入框
@property (nonatomic, assign) NSInteger textLocation;//这里声明一个全局属性，用来记录输入位置
@property (nonatomic, assign) CGFloat originY;

@end

@implementation OCRTransportInfoValidationViewController

- (void)viewWillAppear:(BOOL)animated {
//  if ([self.navigationController respondsToSelector:@selector(interactivePopGestureRecognizer)]) {
//    self.navigationController.interactivePopGestureRecognizer.enabled = NO;
//  }
////  [super.navigationController setNavigationBarHidden:NO animated:YES];
//  self.navigationController.navigationBarHidden = NO;
//  self.view.backgroundColor = [UIColor whiteColor];
//  [OCRSingleton sharedSingleton].isNativePage = YES;
//  self.title = @"确认信息";
  [super viewWillAppear:animated];
  
  if ([self.navigationController respondsToSelector:@selector(interactivePopGestureRecognizer)]) {
    self.navigationController.interactivePopGestureRecognizer.enabled = NO;
  }
  self.navigationController.navigationBar.topItem.title = @"";
  self.navigationController.navigationBar.barTintColor = UIColorFromRGB(0x339eff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:1 alpha:1];
  [self.navigationController.navigationBar setTitleTextAttributes:
   @{NSFontAttributeName:[UIFont systemFontOfSize:18],
     NSForegroundColorAttributeName:[UIColor whiteColor]}];
  [[UINavigationBar appearance] setTintColor:[UIColor whiteColor]];
  //  [super.navigationController setNavigationBarHidden:NO animated:YES];
  self.navigationController.navigationBarHidden = NO;
  [OCRSingleton sharedSingleton].isNativePage = YES;
  self.title = @"确认信息";
}

//- (void)viewWillDisappear:(BOOL)animated
//{
//  self.navigationController.navigationBarHidden = YES;
//}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  self.originY = self.view.frame.origin.y;
}

- (void)viewDidLoad {
  [super viewDidLoad];
//  self.originY = self.view.frame.origin.y;
  [self getData];
  [self setContentData];
  [self initPage];
  // 键盘输入变化通知
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(textFiledEditChanged:)name:UITextFieldTextDidChangeNotification object:nil];
  // 键盘出现的通知
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillShow:)name:UIKeyboardWillShowNotification object:nil];
  // 键盘消失的通知
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:)name:UIKeyboardWillHideNotification object:nil];
}

-(void)setContentData
{
  if (self.transportInfoData != nil) {
    self.transportData = self.transportInfoData;
  }
}

-(void)initPage
{
  CGFloat height = self.view.frame.size.height;
  CGFloat width = self.view.frame.size.width;
  UITableView *tableView = [[UITableView alloc] initWithFrame:CGRectMake(0, 0, width, height)];
  tableView.delegate = self;
  tableView.dataSource = self;
  tableView.tableFooterView = [[UIView alloc] init];
  tableView.backgroundColor = UIColorFromRGB(0xf4f7fa);
  [self.view addSubview:tableView];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  static NSString *text = @"UITableViewTransportCell";
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:text];
  if (cell == nil) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleValue1 reuseIdentifier:text];
  }
  if (indexPath.row == 0) {
    NSDictionary *data = [self.transportData objectAtIndex:indexPath.row];
    NSString *value = [data objectForKey:@"value"];
    UILabel *nameLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, 44)];
    nameLabel.textAlignment = NSTextAlignmentCenter;
    [nameLabel setText:value];
    [cell addSubview:nameLabel];
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (indexPath.row == 2) {
    UILabel *textLabel = [[UILabel alloc] initWithFrame:CGRectMake(50, 0, self.view.frame.size.width - 30, 44)];
    [textLabel setText:@"请核对扫描信息，确认无误"];
    textLabel.textColor = [UIColor grayColor];
//    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell addSubview:textLabel];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (indexPath.row == 1) {
    NSDictionary *data = [self.transportData objectAtIndex:indexPath.row];
    UIImage *image = [data objectForKey:@"value"];
//    UIImage *image = [UIImage imageNamed:value];
    UIImageView *imageview = [[UIImageView alloc] initWithFrame:CGRectMake(40, 0, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
    imageview.contentMode = UIViewContentModeScaleAspectFit;
    imageview.image = image;
    imageview.backgroundColor = [UIColor whiteColor];
//    imageview.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
    imageview.layer.borderWidth = 1.0f;
    
    imageview.userInteractionEnabled = YES;
    MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
    singleTap.image = image;
    [imageview addGestureRecognizer:singleTap];
    
    [cell.contentView addSubview:imageview];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else if (indexPath.row == 3) {
    NSDictionary *data = [self.transportData objectAtIndex:indexPath.row];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
//    cell.detailTextLabel.text = value;
    cell.textLabel.text = key;
    
    self.transportationCardNumberTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.transportationCardNumberTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.transportationCardNumberTextField.delegate = self;
    self.transportationCardNumberTextField.textAlignment = NSTextAlignmentRight;
    self.transportationCardNumberTextField.returnKeyType = UIReturnKeyDone;
    self.transportationCardNumberTextField.text = value;
    self.transportationCardNumberTextField.tag = 3;
    self.transportationCardNumberTextField.keyboardType = UIKeyboardTypeASCIICapable;
    self.transportationCardNumberTextField.placeholder = @"请输入运输证号";
    [self.transportationCardNumberTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.transportationCardNumberTextField];
  } else if (indexPath.row == 4) {
    self.uploadCertificate = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadCertificate setTitle:@"上传证件" forState:UIControlStateNormal];
    self.uploadCertificate.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadCertificate.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:1 alpha:1];
    [self.uploadCertificate addTarget:self action:@selector(uploadCertificateEvent) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview:self.uploadCertificate];
    self.uploadCertificate.layer.cornerRadius = 5;
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  }
  cell.selectionStyle = UITableViewCellSelectionStyleNone;
  return cell;
}

-(void)textfieldDone
{
  
}

/**
 * textField获取焦点
 */
- (void)textFieldDidBeginEditing:(UITextField *)textField
{
  self.currentTextField = textField;
  self.textLocation = [textField.text length];
}

-(void)textFiledEditChanged:(NSNotification *)obj
{
  UITextField *textField = (UITextField *)obj.object;
  NSInteger tag = textField.tag;
  NSString *text = textField.text;
  if (tag == 3) {
    [self validateTransportationCardNumberTextField:textField string:text];
  }
}

/**
 * 运输证号
 */
- (void)validateTransportationCardNumberTextField:(UITextField *)textField string:(NSString *)text
{
  UITextRange *selectedRange = [textField markedTextRange];
  UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
  if (!position) {
    // 中文和英文一起检测  中文是两个字符
    if ([text length] > 24) {
      textField.text = [text substringToIndex:self.textLocation];
    }
    self.textLocation = [textField.text length];
  }
}

- (void)keyboardWillShow:(NSNotification *)notification {
  // 获取键盘高度
  CGFloat kbHeight = [[notification.userInfo objectForKey:UIKeyboardFrameEndUserInfoKey] CGRectValue].size.height;
  
  // 计算出键盘顶端到输入框底端的距离
  CGRect tFActualFrame = [self.currentTextField convertRect:self.currentTextField.frame toView:self.view];  // textField在self.view中的实际frame
  
  CGFloat offset;
  
  offset = tFActualFrame.origin.y + tFActualFrame.size.height - (self.view.frame.size.height - kbHeight - 30);  // Keyboard_Interval为自定义的textField与键盘保持的距离
  
  // 键盘动画时间
  double duration = [[notification.userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  
  // 将视图上移计算好的偏移
  if (offset > 0) {
    [UIView animateWithDuration:duration animations:^{
      self.view.frame = CGRectMake(0, -offset, self.view.frame.size.width, self.view.frame.size.height);
    }];
  }
}

// 键盘消失事件
- (void)keyboardWillHide:(NSNotification *)notification {
  // 键盘动画时间
  double duration = [[notification.userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  
  // 视图恢复原位置
  [UIView animateWithDuration:duration animations:^{
    self.view.frame = CGRectMake(0, self.originY, self.view.frame.size.width, self.view.frame.size.height);
  }];
}

-(void)uploadCertificateEvent
{
  UIImage *image = [[self.transportInfoData objectAtIndex:1] objectForKey:@"value"];
  NSDictionary *imageData = @{
                              @"decodeImage": image,
                              };
  [[OCRServices shardService] uploadImage:imageData
                           successHandler:^(id result) {
                             NSLog(@"sss");
                             NSInteger statusCode = [[result objectForKey:@"statusCode"] integerValue];
                             BOOL success = [[result objectForKey:@"success"] boolValue];
                             if (statusCode == 200 && success == YES) {
                               NSDictionary *data = [result objectForKey:@"obj"];
                               NSString *newImageUrl = [data objectForKey:@"imageFilename"];
                               [self uploadCertificateInfo:newImageUrl];
                             }
                           }
                              failHandler:^(NSError *err) {
                                if (err.code == 50050) {
                                  dispatch_async(dispatch_get_main_queue(), ^{
                                    [[ToastView shareInstance] makeToast:@"登录失效，请重新登录" duration:2.0];
                                    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                                      NSArray *controllers = self.navigationController.viewControllers;
                                      self.navigationController.navigationBarHidden = YES;
                                      [self.navigationController popToViewController:[controllers objectAtIndex:controllers.count - 4] animated:YES];
                                    });
                                  });
                                } else {
                                  dispatch_async(dispatch_get_main_queue(), ^{
                                    [[ToastView shareInstance] makeToast:@"上传失败" duration:2.0];
                                  });
                                }
                              }];
}

-(void)uploadCertificateInfo:(NSString *)newImageUrl
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSDictionary *params = @{
                             @"monitorId": [OCRSingleton sharedSingleton].monitorId,
                             @"transportNumber": self.transportationCardNumberTextField.text,
                             @"transportNumberPhoto": newImageUrl,
                             @"oldTransportNumberPhoto": [OCRSingleton sharedSingleton].oldPhotoUrl,
                             };
    [[OCRServices shardService] uploadTransportNumberInfo:params
                                           successHandler:^(id result) {
                                             NSInteger statusCode = [[result objectForKey:@"statusCode"] integerValue];
                                             BOOL success = [[result objectForKey:@"success"] boolValue];
                                             if (statusCode == 200 && success == YES) {
                                               dispatch_async(dispatch_get_main_queue(), ^{
                                                 [[ToastView shareInstance] makeToast:@"上传成功" duration:2.0];
                                                 [OCRSingleton sharedSingleton].isLoadData = YES;
                                                 dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                                                   NSArray *controllers = self.navigationController.viewControllers;
                                                   [self.navigationController popToViewController:[controllers objectAtIndex:controllers.count - 3] animated:YES];
                                                 });
                                                 
                                               });
                                             } else {
                                               dispatch_async(dispatch_get_main_queue(), ^{
                                                 [[ToastView shareInstance] makeToast:@"上传失败" duration:2.0];
                                               });
                                             }
                                           }
                                              failHandler:^(NSError *err) {
                                                if (err.code == 50050) {
                                                  dispatch_async(dispatch_get_main_queue(), ^{
                                                    [[ToastView shareInstance] makeToast:@"登录失效，请重新登录" duration:2.0];
                                                    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                                                      NSArray *controllers = self.navigationController.viewControllers;
                                                      self.navigationController.navigationBarHidden = YES;
                                                      [self.navigationController popToViewController:[controllers objectAtIndex:controllers.count - 4] animated:YES];
                                                    });
                                                  });
                                                } else {
                                                  dispatch_async(dispatch_get_main_queue(), ^{
                                                    [[ToastView shareInstance] makeToast:@"上传失败" duration:2.0];
                                                  });
                                                }
                                              }];
  });
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return 5;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
  return 1;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.row == 1) {
    return (self.view.frame.size.width - 80) * 0.56 + 15;
  }
  return 44;
}

-(void)getData
{
  UIImage *image = [UIImage imageNamed:@"idCard.png"];
  self.transportData = @[
                         @{@"key": @"monitorName", @"value": @"--"},
                         @{@"key": @"image", @"value": image},
                         @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                         @{@"key": @"运输证号", @"value": @""}
                       ];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  // 收起键盘
  [self.view endEditing:YES];
}

-(void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UITextFieldTextDidChangeNotification object:nil];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
  // 键盘消失的通知
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
}

- (void)handleSingleTap:(UITapGestureRecognizer *)gestureRecognizer {
  MyUITapGestureRecognizer *tap = (MyUITapGestureRecognizer *)gestureRecognizer;
  [[PhotoFullScreen shareInstances] makeToast:tap.image];
}

@end
