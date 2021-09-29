//
//  OCRDrivingInfoValidationViewController.m
//  scanning
//
//  Created by zwkj on 2019/6/26.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import "OCRDrivingInfoValidationViewController.h"
#import "DTScrollStatusView.h"
#import "AppDelegate.h"
#import "NSString+Category.h"
#import "OCRSingleton.h"
#import "OCRServices.h"
#import "ToastView.h"
#import "PhotoFullScreen.h"
#import "MyUITapGestureRecognizer.h"
#import "QFDatePickerView.h"

#define UIColorFromRGB(rgbValue) [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 green:((float)((rgbValue & 0xFF00) >> 8))/255.0 blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@interface OCRDrivingInfoValidationViewController ()<DTScrollStatusDelegate, UITextFieldDelegate>

@property (nonatomic, strong) UILabel *monitorNameLabel;
@property (nonatomic, strong) NSArray *vehicleLicensePositiveData;
@property (nonatomic, strong) NSArray *vehicleLicenseReverseData;
@property (nonatomic, strong) UIButton *uploadPositive; // 上传证件正本按钮
@property (nonatomic, strong) UIButton *uploadReverse; // 上传证件正本按钮
@property (nonatomic, strong) UIView* datePickerView;// 日期选择器视图
@property (nonatomic, assign) NSInteger textLocation;//这里声明一个全局属性，用来记录输入位置
@property (nonatomic, strong) UITextField *currentTextField; // 当前输入框
@property (nonatomic, strong) UITextField *chassisNumberTextField; // 车架号输入框
@property (nonatomic, strong) UITextField *usingNatureTextField; // 车架号输入框
@property (nonatomic, strong) UITextField *brandTypeTextField; // 品牌类型输入框
@property (nonatomic, strong) UIButton *registrationDateButton; // 注册日期
@property (nonatomic, strong) UIButton *certificateDateButton; // 发证日期
@property (nonatomic, strong) UIButton *periodOfvValidityButton; // 有效期
@property (nonatomic, strong) UIDatePicker *datePicker;
@property (nonatomic, strong) UITextField *qualityTextField; // 总质量
@property (nonatomic, strong) UITextField *longSizeTextField; // 外廊尺寸-长
@property (nonatomic, strong) UITextField *heightSizeTextField; // 外廊尺寸-高
@property (nonatomic, strong) UITextField *widthSizeTextField; // 外廊尺寸-宽
@property (nonatomic, strong) UITextField *engineNumberTextField; // 发动机输入框

@property (nonatomic, strong) NSArray *nonFreightCarData;
@property (nonatomic, assign) CGFloat originY;

@property (nonatomic, strong) QFDatePickerView *qfDatePickerView;

@end

@implementation OCRDrivingInfoValidationViewController

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  if ([self.navigationController respondsToSelector:@selector(interactivePopGestureRecognizer)]) {
    self.navigationController.interactivePopGestureRecognizer.enabled = NO;
  }
  self.navigationController.navigationBar.topItem.title = @"";
//  [super.navigationController setNavigationBarHidden:NO animated:YES];
  self.navigationController.navigationBarHidden = NO;
  self.view.backgroundColor = [UIColor whiteColor];
  [OCRSingleton sharedSingleton].isNativePage = YES;
  self.title = @"确认信息";
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  self.originY = self.view.frame.origin.y;
}

//- (void)viewWillDisappear:(BOOL)animated
//{
//  self.navigationController.navigationBarHidden = YES;
//}

- (void)viewDidLoad {
  [super viewDidLoad];
  [self initData];
  [self initPage];
  [self setPageContent];
  
  // 键盘输入变化通知
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(textFiledEditChanged:)name:UITextFieldTextDidChangeNotification object:nil];
  // 键盘出现的通知
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillShow:)name:UIKeyboardWillShowNotification object:nil];
  // 键盘消失的通知
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:)name:UIKeyboardWillHideNotification object:nil];
}

- (void)initPage
{
  CGFloat height = self.view.bounds.size.height;
  CGFloat width = self.view.bounds.size.width;
  
  // 顶部监控对象名称
  self.monitorNameLabel = [[UILabel alloc] initWithFrame:CGRectMake(15, 75, width - 30, 30)];
  self.monitorNameLabel.textAlignment = NSTextAlignmentCenter;
  self.monitorNameLabel.textColor = [UIColor blackColor];
  [self.view addSubview:self.monitorNameLabel];
  
//  NSString *carType = [OCRSingleton sharedSingleton].carType;
  
//  if ([carType isEqualToString:@"1"]) {
//    // 选项卡
//    UIView *tabContentView = [[UIView alloc] initWithFrame:CGRectMake(0, 100, width, height - 160)];
//    [self.view addSubview:tabContentView];
//
//    DTScrollStatusView *scrollTapView = [[DTScrollStatusView alloc]initWithTitleArr:@[@"行驶证正本", @"行驶证副本"]
//                                                                               type:ScrollTapTypeWithNavigation];
//    scrollTapView.scrollStatusDelegate = self;
//    [tabContentView addSubview:scrollTapView];
//  } else {
    UITableView *tableView = [[UITableView alloc] initWithFrame:CGRectMake(0, 0, width, height)];
    tableView.delegate = self;
    tableView.dataSource = self;
    tableView.tableFooterView = [[UIView alloc] init];
    tableView.tag = 3;
    tableView.backgroundColor = UIColorFromRGB(0xf4f7fa);
    [self.view addSubview:tableView];
//  }
}

-(void)setPageContent
{
  if (self.vehicleLicensePositiveInfoData != nil) {
    self.vehicleLicensePositiveData = self.vehicleLicensePositiveInfoData;
  }
  if (self.vehicleLicenseReverseInfoData != nil) {
    self.vehicleLicenseReverseData = self.vehicleLicenseReverseInfoData;
  }
  if (self.nonFreightCarInfoData != nil) {
    self.nonFreightCarData = self.nonFreightCarInfoData;
  }
  self.monitorNameLabel.text = [OCRSingleton sharedSingleton].monitorName;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  
  static NSString *text = @"UITableViewCell";
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:text];
  if (cell == nil) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleValue1 reuseIdentifier:text];
  }
  if ([OCRSingleton sharedSingleton].tableSelectedIndex == 0) {
    cell = [self positiveContent:cell indexPathRow:indexPath.row];
  }
  else if([OCRSingleton sharedSingleton].tableSelectedIndex == 1)
  {
    cell = [self reverseContent:cell indexPathRow:indexPath.row];
  }
  else if ([OCRSingleton sharedSingleton].tableSelectedIndex == 3) {
    cell = [self nonFreightCarContent:cell indexPathRow:indexPath.row];
  }
  cell.selectionStyle = UITableViewCellSelectionStyleNone;
  return cell;
}

/**
 * 非货运车行驶证正面
 */
-(UITableViewCell *)nonFreightCarContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 0) {
    NSDictionary *data = [self.nonFreightCarData objectAtIndex:index];
    NSString *value = [data objectForKey:@"value"];
    UILabel *nameLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, self.view.frame.size.width, 44)];
    nameLabel.textAlignment = NSTextAlignmentCenter;
    [nameLabel setText:value];
    [cell addSubview:nameLabel];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  }
  else if (index == 2) {
    UILabel *textLabel = [[UILabel alloc] initWithFrame:CGRectMake(50, 0, self.view.frame.size.width - 30, 30)];
    [textLabel setText:@"请核对扫描信息，确认无误"];
    textLabel.textColor = [UIColor grayColor];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
//    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell addSubview:textLabel];
  } else if (index == 1) {
    NSDictionary *data = [self.nonFreightCarData objectAtIndex:index];
    UIImage *image = [data objectForKey:@"value"];
    //    UIImage *image = [UIImage imageNamed:value];
    UIImageView *imageview = [[UIImageView alloc] initWithFrame:CGRectMake(40, 0, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
    imageview.contentMode = UIViewContentModeScaleAspectFit;
    imageview.image = image;
//    imageview.backgroundColor = [UIColor whiteColor];
//    imageview.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
//    imageview.layer.borderWidth = 1.0f;
    
    imageview.userInteractionEnabled = YES;
    MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
    singleTap.image = image;
    [imageview addGestureRecognizer:singleTap];
    
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell.contentView addSubview:imageview];
  } else if (index == 9) {
    self.uploadPositive = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadPositive setTitle:@"确认上传" forState:UIControlStateNormal];
    self.uploadPositive.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadPositive.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:255/255.0 alpha:1];
    [self.uploadPositive addTarget:self action:@selector(uploadPositiveEvent) forControlEvents:UIControlEventTouchUpInside];
    self.uploadPositive.layer.cornerRadius = 5;
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell.contentView addSubview:self.uploadPositive];
  } else if (index == 3) {
    NSDictionary *data = [self.nonFreightCarData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.chassisNumberTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.chassisNumberTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.chassisNumberTextField.delegate = self;
    self.chassisNumberTextField.textAlignment = NSTextAlignmentRight;
    self.chassisNumberTextField.returnKeyType = UIReturnKeyDone;
    self.chassisNumberTextField.text = value;
    self.chassisNumberTextField.tag = 2;
    self.chassisNumberTextField.keyboardType = UIKeyboardTypeASCIICapable;
    self.chassisNumberTextField.placeholder = @"请输入车架号";
    [self.chassisNumberTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.chassisNumberTextField];
  } else if (index == 4) {
    NSDictionary *data = [self.nonFreightCarData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.engineNumberTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.engineNumberTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.engineNumberTextField.delegate = self;
    self.engineNumberTextField.textAlignment = NSTextAlignmentRight;
    self.engineNumberTextField.returnKeyType = UIReturnKeyDone;
    self.engineNumberTextField.text = value;
    self.engineNumberTextField.tag = 3;
    self.engineNumberTextField.placeholder = @"请输入发动机号";
    [self.engineNumberTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.engineNumberTextField];
  } else if (index == 5) {
    NSDictionary *data = [self.nonFreightCarData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.usingNatureTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.usingNatureTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.usingNatureTextField.delegate = self;
    self.usingNatureTextField.textAlignment = NSTextAlignmentRight;
    self.usingNatureTextField.returnKeyType = UIReturnKeyDone;
    self.usingNatureTextField.text = value;
    self.usingNatureTextField.tag = 4;
    self.usingNatureTextField.placeholder = @"请输入使用性质";
    [self.usingNatureTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.usingNatureTextField];
  } else if (index == 6) {
    NSDictionary *data = [self.nonFreightCarData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.brandTypeTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.brandTypeTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.brandTypeTextField.delegate = self;
    self.brandTypeTextField.textAlignment = NSTextAlignmentRight;
    self.brandTypeTextField.returnKeyType = UIReturnKeyDone;
    self.brandTypeTextField.text = value;
    self.brandTypeTextField.tag = 5;
    self.brandTypeTextField.placeholder = @"请输入品牌类型";
    [self.brandTypeTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.brandTypeTextField];
  } else if (index == 7) {
    NSDictionary *data = [self.nonFreightCarData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    if (![value isEqualToString:@"--"]) {
      NSString *year = [value substringWithRange:NSMakeRange(0, 4)];
      NSString *month = [value substringWithRange:NSMakeRange(4, 2)];
      NSString *day = [value substringWithRange:NSMakeRange(6, 2)];
      value = [NSString stringWithFormat:@"%@-%@-%@", year, month, day];
    }
    
    self.registrationDateButton = [[UIButton alloc] initWithFrame:CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    [self.registrationDateButton setTitle:value forState:UIControlStateNormal];
    self.registrationDateButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
    [self.registrationDateButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
    self.registrationDateButton.tag = 1;
    [self.registrationDateButton addTarget:self action:@selector(selectedRegistrationDate:) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview: self.registrationDateButton];
    [self addDatePickerView];
  } else if (index == 8) {
    NSDictionary *data = [self.nonFreightCarData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    if (![value isEqualToString:@"--"]) {
      NSString *year = [value substringWithRange:NSMakeRange(0, 4)];
      NSString *month = [value substringWithRange:NSMakeRange(4, 2)];
      NSString *day = [value substringWithRange:NSMakeRange(6, 2)];
      value = [NSString stringWithFormat:@"%@-%@-%@", year, month, day];
    }
    
    self.certificateDateButton = [[UIButton alloc] initWithFrame:CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    [self.certificateDateButton setTitle:value forState:UIControlStateNormal];
    self.certificateDateButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
    [self.certificateDateButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
    self.certificateDateButton.tag = 2;
    [self.certificateDateButton addTarget:self action:@selector(selectedRegistrationDate:) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview: self.certificateDateButton];
    [self addDatePickerView];
  }
  return cell;
}

/**
 * 行驶证正面
 */
-(UITableViewCell *)positiveContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 1) {
    UILabel *textLabel = [[UILabel alloc] initWithFrame:CGRectMake(50, 0, self.view.frame.size.width - 30, 30)];
    [textLabel setText:@"请核对扫描信息，确认无误"];
    textLabel.textColor = [UIColor grayColor];
//    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell addSubview:textLabel];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (index == 0) {
    NSDictionary *data = [self.vehicleLicensePositiveData objectAtIndex:index];
    UIImage *image = [data objectForKey:@"value"];
//    UIImage *image = [UIImage imageNamed:value];
    UIImageView *imageview = [[UIImageView alloc] initWithFrame:CGRectMake(40, 0, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
    imageview.contentMode = UIViewContentModeScaleAspectFit;
    imageview.image = image;
//    imageview.backgroundColor = [UIColor whiteColor];
//    imageview.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
//    imageview.layer.borderWidth = 1.0f;
    
    imageview.userInteractionEnabled = YES;
    MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
    singleTap.image = image;
    [imageview addGestureRecognizer:singleTap];
    
    [cell.contentView addSubview:imageview];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else if (index == 8) {
    self.uploadPositive = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadPositive setTitle:@"确认上传" forState:UIControlStateNormal];
    self.uploadPositive.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadPositive.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:255/255.0 alpha:1];
    [self.uploadPositive addTarget:self action:@selector(uploadPositiveEvent) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview:self.uploadPositive];
    self.uploadPositive.layer.cornerRadius = 5;
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else if (index == 2) {
    NSDictionary *data = [self.vehicleLicensePositiveData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.chassisNumberTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.chassisNumberTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.chassisNumberTextField.delegate = self;
    self.chassisNumberTextField.textAlignment = NSTextAlignmentRight;
    self.chassisNumberTextField.returnKeyType = UIReturnKeyDone;
    self.chassisNumberTextField.text = value;
    self.chassisNumberTextField.tag = 2;
    self.chassisNumberTextField.keyboardType = UIKeyboardTypeASCIICapable;
    self.chassisNumberTextField.placeholder = @"请输入车架号";
    [self.chassisNumberTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.chassisNumberTextField];
  } else if (index == 3) {
    NSDictionary *data = [self.vehicleLicensePositiveData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.engineNumberTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.engineNumberTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.engineNumberTextField.delegate = self;
    self.engineNumberTextField.textAlignment = NSTextAlignmentRight;
    self.engineNumberTextField.returnKeyType = UIReturnKeyDone;
    self.engineNumberTextField.text = value;
    self.engineNumberTextField.tag = 3;
    self.engineNumberTextField.placeholder = @"请输入发动机号";
    [self.engineNumberTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.engineNumberTextField];
  } else if (index == 4) {
    NSDictionary *data = [self.vehicleLicensePositiveData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.usingNatureTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.usingNatureTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.usingNatureTextField.delegate = self;
    self.usingNatureTextField.textAlignment = NSTextAlignmentRight;
    self.usingNatureTextField.returnKeyType = UIReturnKeyDone;
    self.usingNatureTextField.text = value;
    self.usingNatureTextField.tag = 4;
    self.usingNatureTextField.placeholder = @"请输入使用性质";
    [self.usingNatureTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.usingNatureTextField];
  } else if (index == 5) {
    NSDictionary *data = [self.vehicleLicensePositiveData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.brandTypeTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.brandTypeTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.brandTypeTextField.delegate = self;
    self.brandTypeTextField.textAlignment = NSTextAlignmentRight;
    self.brandTypeTextField.returnKeyType = UIReturnKeyDone;
    self.brandTypeTextField.text = value;
    self.brandTypeTextField.tag = 5;
    self.brandTypeTextField.placeholder = @"请输入品牌类型";
    [self.brandTypeTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.brandTypeTextField];
  } else if (index == 6) {
    NSDictionary *data = [self.vehicleLicensePositiveData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    if (![value isEqualToString:@"--"]) {
      NSString *year = [value substringWithRange:NSMakeRange(0, 4)];
      NSString *month = [value substringWithRange:NSMakeRange(4, 2)];
      NSString *day = [value substringWithRange:NSMakeRange(6, 2)];
      value = [NSString stringWithFormat:@"%@-%@-%@", year, month, day];
    }
    
    self.registrationDateButton = [[UIButton alloc] initWithFrame:CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    [self.registrationDateButton setTitle:value forState:UIControlStateNormal];
    self.registrationDateButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
    [self.registrationDateButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
    self.registrationDateButton.tag = 1;
    [self.registrationDateButton addTarget:self action:@selector(selectedRegistrationDate:) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview: self.registrationDateButton];
    [self addDatePickerView];
  } else if (index == 7) {
    NSDictionary *data = [self.vehicleLicensePositiveData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    if (![value isEqualToString:@"--"]) {
      NSString *year = [value substringWithRange:NSMakeRange(0, 4)];
      NSString *month = [value substringWithRange:NSMakeRange(4, 2)];
      NSString *day = [value substringWithRange:NSMakeRange(6, 2)];
      value = [NSString stringWithFormat:@"%@-%@-%@", year, month, day];
    }
    
    self.certificateDateButton = [[UIButton alloc] initWithFrame:CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    [self.certificateDateButton setTitle:value forState:UIControlStateNormal];
    self.certificateDateButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
    [self.certificateDateButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
    self.certificateDateButton.tag = 2;
    [self.certificateDateButton addTarget:self action:@selector(selectedRegistrationDate:) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview: self.certificateDateButton];
    [self addDatePickerView];
  } else {
    NSDictionary *data = [self.vehicleLicensePositiveData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.detailTextLabel.text = value;
    cell.textLabel.text = key;
  }
  return cell;
}

/**
 * 驾驶证正面上传
 */
- (void)uploadPositiveEvent
{
  UIImage *image = nil;
  if ([[OCRSingleton sharedSingleton].carType isEqualToString:@"1"]) {
      image = [[self.vehicleLicensePositiveInfoData objectAtIndex:0] objectForKey:@"value"];
  } else {
     image = [[self.nonFreightCarData objectAtIndex:1] objectForKey:@"value"];
  }
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
                               [self uploadPositiveInfo:newImageUrl];
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

-(void)uploadPositiveInfo:(NSString *)newImageUrl
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *registrationDate = self.registrationDateButton.titleLabel.text;
    if ([registrationDate isEqualToString:@"--"]) {
      registrationDate = @"";
    } else {
      registrationDate = [registrationDate stringByReplacingOccurrencesOfString:@"-" withString:@""];
    }
    
    NSString *licenseIssuanceDate = self.certificateDateButton.titleLabel.text;
    if ([licenseIssuanceDate isEqualToString:@"--"]) {
      licenseIssuanceDate = @"";
    } else {
      licenseIssuanceDate = [licenseIssuanceDate stringByReplacingOccurrencesOfString:@"-" withString:@""];
    }
    NSDictionary *params = @{
                             @"monitorId": [OCRSingleton sharedSingleton].monitorId,
                             @"chassisNumber": self.chassisNumberTextField.text,
                             @"engineNumber": self.engineNumberTextField.text,
                             @"usingNature": self.usingNatureTextField.text,
                             @"brandModel": self.brandTypeTextField.text,
                             @"registrationDate": registrationDate,
                             @"licenseIssuanceDate": licenseIssuanceDate,
                             @"drivingLicenseFrontPhoto": newImageUrl,
                             @"oldDrivingLicenseFrontPhoto": [OCRSingleton sharedSingleton].oldPhotoUrl,
                             };
    [[OCRServices shardService] uploadVehicleDriveLicenseFrontInfo:params
                                                    successHandler:^(id result) {
                                                      NSLog(@"sssss");
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

/**
 * 行驶证反面
 */
-(UITableViewCell *)reverseContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 1) {
    UILabel *textLabel = [[UILabel alloc] initWithFrame:CGRectMake(50, 0, self.view.frame.size.width - 30, 44)];
    [textLabel setText:@"请核对扫描信息，确认无误"];
    textLabel.textColor = [UIColor grayColor];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
//    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell addSubview:textLabel];
  } else if (index == 0) {
    NSDictionary *data = [self.vehicleLicenseReverseData objectAtIndex:index];
    UIImage *image = [data objectForKey:@"value"];
//    UIImage *image = [UIImage imageNamed:value];
    UIImageView *imageview = [[UIImageView alloc] initWithFrame:CGRectMake(40, 0, self.view.frame.size.width - 80, (self.view.frame.size.width - 80) * 0.56)];
    imageview.contentMode = UIViewContentModeScaleAspectFit;
    imageview.image = image;
//    imageview.backgroundColor = [UIColor whiteColor];
//    imageview.layer.borderColor = [UIColorFromRGB(0xadcafc) CGColor];
//    imageview.layer.borderWidth = 1.0f;
    
    imageview.userInteractionEnabled = YES;
    MyUITapGestureRecognizer *singleTap = [[MyUITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
    singleTap.image = image;
    [imageview addGestureRecognizer:singleTap];
    
    [cell.contentView addSubview:imageview];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else if (index == 7) {
    self.uploadReverse = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadReverse setTitle:@"确认上传" forState:UIControlStateNormal];
    self.uploadReverse.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadReverse.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:255/255.0 alpha:1];
    [self.uploadReverse addTarget:self action:@selector(uploadReverseEvent) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview:self.uploadReverse];
    self.uploadReverse.layer.cornerRadius = 5;
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else if (index == 2) {
    NSDictionary *data = [self.vehicleLicenseReverseData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.periodOfvValidityButton = [[UIButton alloc] initWithFrame:CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    [self.periodOfvValidityButton setTitle:value forState:UIControlStateNormal];
    self.periodOfvValidityButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
    [self.periodOfvValidityButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
    self.periodOfvValidityButton.tag = 3;
    [self.periodOfvValidityButton addTarget:self action:@selector(selectedRegistrationDate:) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview: self.periodOfvValidityButton];
    
    if (self.qfDatePickerView == nil) {
      self.qfDatePickerView = [[QFDatePickerView alloc] initDatePackerWithSUperView:self.view response:^(NSString *str) {
        NSString *string = str;
        NSArray *dateArr = [string componentsSeparatedByString:@"-"];
        NSString *month = @"";
        if ([dateArr[1] integerValue] < 10) {
          month = [NSString stringWithFormat:@"%@%@", @"0", dateArr[1]];
        }
        string = [NSString stringWithFormat:@"%@年%@月", dateArr[0], month];
        NSLog(@"str = %@",string);
        [self.periodOfvValidityButton setTitle:string forState:UIControlStateNormal];
      }];
    }
//    [self addDatePickerView];
  } else if (index == 3) {
    NSDictionary *data = [self.vehicleLicenseReverseData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.qualityTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.qualityTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.qualityTextField.delegate = self;
    self.qualityTextField.textAlignment = NSTextAlignmentRight;
    self.qualityTextField.returnKeyType = UIReturnKeyDone;
    self.qualityTextField.text = value;
    self.qualityTextField.tag = 23;
    self.qualityTextField.keyboardType = UIKeyboardTypeNumberPad;
    self.qualityTextField.placeholder = @"请输入总质量";
    [self.qualityTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.qualityTextField];
  } else if (index == 4) {
    NSDictionary *data = [self.vehicleLicenseReverseData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.longSizeTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.longSizeTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.longSizeTextField.delegate = self;
    self.longSizeTextField.textAlignment = NSTextAlignmentRight;
    self.longSizeTextField.returnKeyType = UIReturnKeyDone;
    self.longSizeTextField.text = value;
    self.longSizeTextField.tag = 24;
    self.longSizeTextField.keyboardType = UIKeyboardTypeNumberPad;
    self.longSizeTextField.placeholder = @"请输入外廊尺寸-长";
    [self.longSizeTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.longSizeTextField];
  } else if (index == 5) {
    NSDictionary *data = [self.vehicleLicenseReverseData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.heightSizeTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.heightSizeTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.heightSizeTextField.delegate = self;
    self.heightSizeTextField.textAlignment = NSTextAlignmentRight;
    self.heightSizeTextField.returnKeyType = UIReturnKeyDone;
    self.heightSizeTextField.text = value;
    self.heightSizeTextField.tag = 25;
    self.heightSizeTextField.keyboardType = UIKeyboardTypeNumberPad;
    self.heightSizeTextField.placeholder = @"请输入外廊尺寸-高";
    [self.heightSizeTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.heightSizeTextField];
  } else if (index == 6) {
    NSDictionary *data = [self.vehicleLicenseReverseData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.widthSizeTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.widthSizeTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.widthSizeTextField.delegate = self;
    self.widthSizeTextField.textAlignment = NSTextAlignmentRight;
    self.widthSizeTextField.returnKeyType = UIReturnKeyDone;
    self.widthSizeTextField.text = value;
    self.widthSizeTextField.tag = 25;
    self.widthSizeTextField.keyboardType = UIKeyboardTypeNumberPad;
    self.widthSizeTextField.placeholder = @"请输入外廊尺寸-宽";
    [self.widthSizeTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.widthSizeTextField];
  } else {
    NSDictionary *data = [self.vehicleLicenseReverseData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.detailTextLabel.text = value;
    cell.textLabel.text = key;
  }
  return cell;
}

/**
 * 驾驶证反面上传
 */
- (void)uploadReverseEvent
{
  UIImage *image = [[self.vehicleLicenseReverseInfoData objectAtIndex:0] objectForKey:@"value"];
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
                               [self uploadReverseInfo:newImageUrl];
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

-(void)uploadReverseInfo:(NSString *)newImageUrl
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *validEndDate = self.periodOfvValidityButton.titleLabel.text;
    
    NSCharacterSet *setToRemove =
    [[ NSCharacterSet characterSetWithCharactersInString:@"0123456789"]
     invertedSet ];
    
    validEndDate = [[validEndDate componentsSeparatedByCharactersInSet:setToRemove] componentsJoinedByString:@""];
    
    validEndDate = [NSString stringWithFormat:@"%@%@", validEndDate, @"01"];
    
//    validEndDate = [validEndDate stringByReplacingOccurrencesOfString:@"" withString:@""];
    if ([validEndDate isEqualToString:@"--"]) {
      validEndDate = @"";
    } else {
      validEndDate = [validEndDate stringByReplacingOccurrencesOfString:@"-" withString:@""];
    }
    
    NSDictionary *params = @{
                             @"monitorId": [OCRSingleton sharedSingleton].monitorId,
                             @"totalQuality": self.qualityTextField.text,
                             @"validEndDate": validEndDate,
                             @"profileSizeLong": self.longSizeTextField.text,
                             @"profileSizeWide": self.widthSizeTextField.text,
                             @"profileSizeHigh": self.heightSizeTextField.text,
                             @"drivingLicenseDuplicatePhoto": newImageUrl,
                             @"oldDrivingLicenseDuplicatePhoto": [OCRSingleton sharedSingleton].oldPhotoUrl,
                             };
    [[OCRServices shardService] uploadVehicleDriveLicenseDuplicateInfo:params
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

- (void)refreshViewWithTag:(NSInteger)tag
                  isHeader:(BOOL)isHeader {
  if(isHeader)
  {
    NSLog(@"当前%ld个tableview 的头部正在刷新",(long)tag);
  }
  else
  {
    NSLog(@"当前%ld个tableview 的尾部正在刷新",(long)tag);
  }
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
  return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  if ([OCRSingleton sharedSingleton].tableSelectedIndex == 0) {
    return 9;
  }
  else if ([OCRSingleton sharedSingleton].tableSelectedIndex == 1)
  {
    return 8;
  }
  else {
    return 10;
  }
}

/**
 * 行驶证正面数据填充
 */
-(void)setContentValue
{
  
}

- (void)initData
{
  UIImage *image = [UIImage imageNamed:@"idCard.png"];
  // 行驶证正面数据
  self.vehicleLicensePositiveData = @[
                                      @{@"key": @"图片", @"value": image},
                                      @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                                      @{@"key": @"车架号", @"value": @"--"},
                                      @{@"key": @"发动机号", @"value": @"--"},
                                      @{@"key": @"使用性质", @"value": @"--"},
                                      @{@"key": @"品牌型号", @"value": @"--"},
                                      @{@"key": @"注册日期", @"value": @"--"},
                                      @{@"key": @"发证日期", @"value": @"--"}
                                    ];
  // 行驶证反面数据
  self.vehicleLicenseReverseData = @[
                                     @{@"key": @"图片", @"value": image},
                                     @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                                     @{@"key": @"检验有效期至", @"value": @"--"},
                                     @{@"key": @"总质量（kg）", @"value": @"--"},
                                     @{@"key": @"外廓尺寸-长(mm)", @"value": @"--"},
                                     @{@"key": @"外廓尺寸-高(mm)", @"value": @"--"},
                                     @{@"key": @"外廓尺寸-宽(mm)", @"value": @"--"}
                                   ];
  
  // 非货运车数据
  self.nonFreightCarData = @[
                             @{@"key": @"monitorName", @"value": @"张三德"},
                             @{@"key": @"图片", @"value": image},
                             @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                             @{@"key": @"车架号", @"value": @"--"},
                             @{@"key": @"发动机号", @"value": @"--"},
                             @{@"key": @"使用性质", @"value": @"--"},
                             @{@"key": @"品牌型号", @"value": @"--"},
                             @{@"key": @"注册日期", @"value": @"--"},
                             @{@"key": @"发证日期", @"value": @"--"}
                           ];
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if ([OCRSingleton sharedSingleton].tableSelectedIndex == 3) {
    if (indexPath.row == 1) {
      return (self.view.frame.size.width - 80) * 0.56 + 15;
    }
  } else {
    if (indexPath.row == 0) {
      return (self.view.frame.size.width - 80) * 0.56 + 15;
    }
  }
  return 44;
}

- (BOOL)textField:(UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  if (textField.tag == 6) {
    return NO;
  }
  return YES;
}

- (void)keyboardWillShow:(NSNotification *)notification {
//  CGRect s = self.view.frame;
//  CGRect t = self.view.bounds;
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

-(void)textfieldDone
{
  [self viewAnimation:self.datePickerView willHidden:YES];
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
  if (tag == 2) {
    [self validateChassisNumberTextField:textField string:text];
  } else if (tag == 4) {
    [self validateUsingNatureTextField:textField string:text];
  } else if (tag == 5) {
    [self validateBrandTypeTextField:textField string:text];
  } else if (tag == 23 || tag == 24 || tag == 25 || tag == 26) {
    [self validateQualityTextField:textField string:text];
  } else if (tag == 3) {
    [self validateEngineNumberTextField:textField string:text];
  }
}

/**
 * 车架号
 */
- (void)validateChassisNumberTextField:(UITextField *)textField string:(NSString *)text
{
  UITextRange *selectedRange = [textField markedTextRange];
  UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
  if (!position) {
    if (![text validateEngNumber]) {
      textField.text = [text substringToIndex:self.textLocation];
    } else {
      if ([text length] > 17) {
        textField.text = [text substringToIndex:self.textLocation];
      }
    }
    self.textLocation = [textField.text length];
  }
}

/**
 * 使用性质
 */
-(void)validateUsingNatureTextField:(UITextField *)textField string:(NSString *)text
{
  UITextRange *selectedRange = [textField markedTextRange];
  UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
  if (!position) {
    if ([text length] > 10) {
      textField.text = [text substringToIndex:self.textLocation];
    }
    self.textLocation = [textField.text length];
  }
}

/**
 * 品牌类型
 */
-(void)validateBrandTypeTextField:(UITextField *)textField string:(NSString *)text
{
  UITextRange *selectedRange = [textField markedTextRange];
  UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
  if (!position) {
    if (![text validateChineseEngNumber]) {
      textField.text = [text substringToIndex:self.textLocation];
    } else {
      if ([text length] > 20) {
        textField.text = [text substringToIndex:self.textLocation];
      }
    }
    self.textLocation = [textField.text length];
  }
}

/**
 * 总质量
 */
-(void)validateQualityTextField:(UITextField *)textField string:(NSString *)text
{
  UITextRange *selectedRange = [textField markedTextRange];
  UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
  if (!position) {
    if ([text length] > 8) {
      textField.text = [text substringToIndex:self.textLocation];
    }
    self.textLocation = [textField.text length];
  }
}

/**
 * 发动机号输入验证
 */
- (void)validateEngineNumberTextField:(UITextField *)textField string:(NSString *)text
{
  UITextRange *selectedRange = [textField markedTextRange];
  UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
  if (!position) {
    if ([text length] > 15) {
      textField.text = [text substringToIndex:self.textLocation];
    }
    self.textLocation = [textField.text length];
  }
}

/**
 * 添加日期选择器
 */
- (void)addDatePickerView
{
  if (self.datePickerView == nil) {
    CGFloat width = self.view.frame.size.width;
    CGFloat height = self.view.frame.size.height;
    self.datePickerView = [[UIView alloc] initWithFrame:CGRectMake(0, height, width, 200)];
    self.datePickerView.backgroundColor = [UIColor whiteColor];
    [self.view addSubview:self.datePickerView];
    
    UIButton *btnOK = [[UIButton alloc] initWithFrame:CGRectMake(width - 75, 15, 40, 30)];
    btnOK.titleLabel.font = [UIFont systemFontOfSize:18.0];
    [btnOK setTitle:@"确定" forState:UIControlStateNormal];
    [btnOK setTitleColor:[UIColor blueColor] forState:UIControlStateNormal];
    [btnOK addTarget:self action:@selector(datePickerViewBtnOk) forControlEvents:UIControlEventTouchUpInside];
    [self.datePickerView addSubview:btnOK];

    UIButton *btnCancel = [[UIButton alloc] initWithFrame:CGRectMake(30, 15, 40, 30)];
    btnCancel.titleLabel.font = [UIFont systemFontOfSize:18.0];
    [btnCancel setTitle:@"取消" forState:UIControlStateNormal];
    [btnCancel setTitleColor:[UIColor blueColor] forState:UIControlStateNormal];
    [btnCancel addTarget:self action:@selector(datePickerViewBtnCancel) forControlEvents:UIControlEventTouchUpInside];
    [self.datePickerView addSubview:btnCancel];
    
    self.datePicker = [[UIDatePicker alloc] initWithFrame:CGRectMake(0, 50, width, 150)];
    self.datePicker.locale = [[NSLocale alloc] initWithLocaleIdentifier:@"zh"];
    self.datePicker.datePickerMode = UIDatePickerModeDate;
    [self.datePicker setDate:[NSDate date] animated:YES];
    [self.datePickerView addSubview:self.datePicker];
  }
}

-(void)selectedRegistrationDate:(UIButton *)btn
{
  [self.view endEditing:YES];
  self.datePickerView.tag = btn.tag;
  [self.qfDatePickerView show];
//  [self viewAnimation:self.datePickerView willHidden:NO];
}

/**
 * 日期选择器显示与隐藏动画
 */
- (void)viewAnimation:(UIView*)view willHidden:(BOOL)hidden {
  CGFloat height = self.view.frame.size.height;
  CGFloat width = self.view.frame.size.width;
  [UIView animateWithDuration:0.3 animations:^{
    if (hidden) {
      view.frame = CGRectMake(0, height, width, 200);
    } else {
      [view setHidden:hidden];
      view.frame = CGRectMake(0, height - 200, width, 200);
    }
  } completion:^(BOOL finished) {
    [view setHidden:hidden];
  }];
}

- (void)datePickerViewBtnOk
{
  [self viewAnimation:self.datePickerView willHidden:YES];
  NSDate *date = [self.datePicker date];
  NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  formatter.dateFormat = @"yyyy-MM-dd";
  NSString *dateStr = [formatter stringFromDate:date];
  if (self.datePickerView.tag == 1) {
    [self.registrationDateButton setTitle:dateStr forState:UIControlStateNormal];
  } else if (self.datePickerView.tag == 2) {
    [self.certificateDateButton setTitle:dateStr forState:UIControlStateNormal];
  } else if (self.datePickerView.tag == 3) {
    [self.periodOfvValidityButton setTitle:dateStr forState:UIControlStateNormal];
  }
}

- (void)datePickerViewBtnCancel
{
  [self viewAnimation:self.datePickerView willHidden:YES];
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
