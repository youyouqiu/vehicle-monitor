//
//  OCRPractitionersValidationViewController.m
//  scanning
//
//  Created by zwkj on 2019/7/1.
//  Copyright © 2019年 Facebook. All rights reserved.
//

#import <objc/runtime.h>
#import "OCRPractitionersValidationViewController.h"
#import "DTScrollStatusView.h"
#import "OCRCameraViewController.h"
#import "AppDelegate.h"
#import "NSString+Category.h"
#import "OCRServices.h"
#import "OCRSingleton.h"
#import "ToastView.h"
#import "PhotoFullScreen.h"
#import "MyUITapGestureRecognizer.h"


#define UIColorFromRGB(rgbValue) [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 green:((float)((rgbValue & 0xFF00) >> 8))/255.0 blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@interface OCRPractitionersValidationViewController ()<DTScrollStatusDelegate, UITextFieldDelegate, UIPickerViewDelegate, UIPickerViewDataSource>

@property (nonatomic, strong) UILabel *monitorNameLabel; // 监控对象名称
@property (nonatomic, strong) UILabel *peopleNameLabel; // 从业人员名称
@property (nonatomic, strong) UIButton *addButton; // 新增按钮
@property (nonatomic, strong) NSArray *idCardData;
@property (nonatomic, strong) NSArray *driverData;
@property (nonatomic, strong) NSArray *qualificationCertificateData;
@property (nonatomic, strong) UIButton *uploadIdCardBtn; // 上传身份证
@property (nonatomic, strong) UIButton *uploadDriverLicenseBtn; // 上传驾驶证
@property (nonatomic, strong) UIButton *uploadQualificationCertificateBtn; // 上传从业资格证
@property (nonatomic, strong) UITextField *currentTextField; // 当前输入框
@property (nonatomic, strong) UITextField *nameTextField; // 姓名输入框
@property (nonatomic, strong) UITextField *idCardTextField; // 姓名输入框
@property (nonatomic, assign) NSInteger textLocation;//这里声明一个全局属性，用来记录输入位置
@property (nonatomic, strong) UIView *pickerContainerView; // 性别选择器
@property (nonatomic, strong) NSString *gender;
@property (nonatomic, strong) UIButton *genderButton; // 性别按钮
@property (nonatomic, strong) UITextField *drivingLicenseTextField; // 驾驶证号
@property (nonatomic, strong) UITextField *carTypeTextField; // 准驾车型
@property (nonatomic, strong) UIButton *validityBeginDateButton; // 有效期起
@property (nonatomic, strong) UIButton *validityEndDateButton; // 有效期至
@property (nonatomic, strong) UIView* datePickerView;// 日期选择器视图
@property (nonatomic, strong) UIDatePicker *datePicker;
@property (nonatomic, strong) UITextField *qualificationsNumberTextField; // 从业资格正好输入框

@property (nonatomic, strong) UITableView *tableView; // 从业资格正好输入框

@property (nonatomic, assign) CGFloat originY;

@property (nonatomic, strong) UIView *alertView;

@end

@implementation OCRPractitionersValidationViewController

- (void)viewWillAppear:(BOOL)animated {
//  if ([self.navigationController respondsToSelector:@selector(interactivePopGestureRecognizer)]) {
//    self.navigationController.interactivePopGestureRecognizer.enabled = NO;
//  }
//  [super.navigationController setNavigationBarHidden:NO animated:YES];
//  self.view.backgroundColor = [UIColor whiteColor];
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
  self.view.backgroundColor = UIColorFromRGB(0xf4f7fa); // [UIColor whiteColor];
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
  self.monitorNameLabel = [[UILabel alloc] initWithFrame:CGRectMake(15, 0, (width - 30) / 3, 45)];
  self.monitorNameLabel.textAlignment = NSTextAlignmentLeft;
  [self.view addSubview:self.monitorNameLabel];
//  self.monitorNameLabel.backgroundColor = UIColorFromRGB(0xf4f7fa);
  // 从业人员
  self.peopleNameLabel = [[UILabel alloc] initWithFrame:CGRectMake((width - 30) / 3 + 15, 0, (width - 30) / 3, 45)];
  self.peopleNameLabel.textAlignment = NSTextAlignmentCenter;
  
  [self.view addSubview:self.peopleNameLabel];
  //  self.peopleNameLabel.backgroundColor = [UIColor blackColor];
  // 新增按钮
//  self.addButton = [[UIButton alloc] initWithFrame:CGRectMake((width - 30) / 3 * 2 + 15, 75, (width - 30) / 3, 30)];
//  self.addButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
//  [self.view addSubview:self.addButton];
//  [self.addButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
  //  self.addButton.titleLabel.textColor = [UIColor blackColor];
  //  self.addButton.backgroundColor = [UIColor grayColor];
  
  // 选项卡
//  UIView *tabContentView = [[UIView alloc] initWithFrame:CGRectMake(0, 100, width, height - 160)];
//  [self.view addSubview:tabContentView];
//
//  DTScrollStatusView *scrollTapView = [[DTScrollStatusView alloc]initWithTitleArr:@[@"身份证", @"驾驶证", @"从业资格证"]
//                                                                             type:ScrollTapTypeWithNavigation];
//  scrollTapView.scrollStatusDelegate = self;
//  [tabContentView addSubview:scrollTapView];
  self.tableView = [[UITableView alloc] initWithFrame:CGRectMake(0, 45, width, height - 45)];
  self.tableView.delegate = self;
  self.tableView.dataSource = self;
  self.tableView.tableFooterView = [[UIView alloc] init];
  self.tableView.backgroundColor = UIColorFromRGB(0xf4f7fa);
  [self.view addSubview:self.tableView];
}

-(void)setPageContent
{
  if (self.idCardInfoData != nil) {
    self.idCardData = self.idCardInfoData;
  }
  if (self.driverLicenseInfoData != nil) {
    self.driverData = self.driverLicenseInfoData;
  }
  if (self.qualificationCertificateInfoData != nil) {
    self.qualificationCertificateData = self.qualificationCertificateInfoData;
  }
  self.monitorNameLabel.text = [OCRSingleton sharedSingleton].monitorName;
  self.peopleNameLabel.text = [OCRSingleton sharedSingleton].peopleName;
//  [self.addButton setTitle:@"新增" forState:UIControlStateNormal];
  self.gender = [self.idCardData[3] objectForKey:@"value"];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  
  static NSString *text = @"UITableViewCell";
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:text];
  if (cell == nil) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleValue1 reuseIdentifier:text];
  }
  if ([OCRSingleton sharedSingleton].tableSelectedIndex == 0) {
    cell = [self idCardContent:cell indexPathRow:indexPath.row];
  }
  else if([OCRSingleton sharedSingleton].tableSelectedIndex == 1)
  {
    cell = [self driverContent:cell indexPathRow:indexPath.row];
  }
  else if ([OCRSingleton sharedSingleton].tableSelectedIndex == 2) {
    cell = [self qualificationCertificateContent:cell indexPathRow: indexPath.row];
  }
  cell.selectionStyle = UITableViewCellSelectionStyleNone;
  return cell;
}

/**
 * 身份证内容
 */
-(UITableViewCell *)idCardContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 1) {
    NSDictionary *data = [self.idCardData objectAtIndex:index];
    NSString *value = [data objectForKey:@"value"];
    UILabel *textLabel = [[UILabel alloc] initWithFrame:CGRectMake(50, 0, self.view.frame.size.width - 30, 44)];
    [textLabel setText:value];
    textLabel.textColor = [UIColor grayColor];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
//    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell addSubview:textLabel];
  } else if (index == 0) {
    NSDictionary *data = [self.idCardData objectAtIndex:index];
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
    
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell.contentView addSubview:imageview];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (index == 5) {
    self.uploadIdCardBtn = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadIdCardBtn setTitle:@"确认上传" forState:UIControlStateNormal];
    self.uploadIdCardBtn.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadIdCardBtn.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:1 alpha:1];
    self.uploadIdCardBtn.tag = 1;
    [self.uploadIdCardBtn addTarget:self action:@selector(uploadInfoEvent:) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview:self.uploadIdCardBtn];
    self.uploadIdCardBtn.layer.cornerRadius = 5;
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  }else if (index == 2) {
    NSDictionary *data = [self.idCardData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    self.nameTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.nameTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.nameTextField.delegate = self;
    self.nameTextField.textAlignment = NSTextAlignmentRight;
    self.nameTextField.returnKeyType = UIReturnKeyDone;
    self.nameTextField.text = value;
    self.nameTextField.tag = 1;
    self.nameTextField.placeholder = @"请输入姓名";
    [self.nameTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    if ([OCRSingleton sharedSingleton].isICType) {
      [self.nameTextField setEnabled:NO];
    }
    [cell.contentView addSubview: self.nameTextField];
  } else if (index == 4) {
    NSDictionary *data = [self.idCardData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    self.idCardTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.idCardTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.idCardTextField.delegate = self;
    self.idCardTextField.textAlignment = NSTextAlignmentRight;
    self.idCardTextField.returnKeyType = UIReturnKeyDone;
    self.idCardTextField.text = value;
    self.idCardTextField.tag = 3;
    self.idCardTextField.keyboardType = UIKeyboardTypeASCIICapable;
    self.idCardTextField.placeholder = @"请输入身份证号";
    [self.idCardTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    if ([OCRSingleton sharedSingleton].isICType) {
      [self.idCardTextField setEnabled:NO];
    }
    [cell.contentView addSubview: self.idCardTextField];
  } else if (index == 3) {
    NSDictionary *data = [self.idCardData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.genderButton = [[UIButton alloc] initWithFrame:CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    [self.genderButton setTitle:value forState:UIControlStateNormal];
    
    self.genderButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
    [self.genderButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
    [self.genderButton addTarget:self action:@selector(selectedGendder) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview: self.genderButton];
    
    // 添加性别选择器
    [self addGenderPickerView];
  }
  return cell;
}

/**
 * 驾驶证内容
 */
-(UITableViewCell *)driverContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 1) {
    NSDictionary *data = [self.idCardData objectAtIndex:index];
    NSString *value = [data objectForKey:@"value"];
    UILabel *textLabel = [[UILabel alloc] initWithFrame:CGRectMake(50, 0, self.view.frame.size.width - 30, 44)];
    [textLabel setText:value];
    textLabel.textColor = [UIColor grayColor];
//    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell addSubview:textLabel];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (index == 0) {
    NSDictionary *data = [self.driverData objectAtIndex:index];
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
  } else if (index == 6) {
    self.uploadDriverLicenseBtn = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadDriverLicenseBtn setTitle:@"确认上传" forState:UIControlStateNormal];
    self.uploadDriverLicenseBtn.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadDriverLicenseBtn.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:1 alpha:1];
    self.uploadDriverLicenseBtn.tag = 2;
    self.uploadDriverLicenseBtn.layer.cornerRadius = 5;
    [self.uploadDriverLicenseBtn addTarget:self action:@selector(uploadInfoEvent:) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview:self.uploadDriverLicenseBtn];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else if (index == 2) {
    NSDictionary *data = [self.driverData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.drivingLicenseTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.drivingLicenseTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.drivingLicenseTextField.delegate = self;
    self.drivingLicenseTextField.textAlignment = NSTextAlignmentRight;
    self.drivingLicenseTextField.returnKeyType = UIReturnKeyDone;
    self.drivingLicenseTextField.text = value;
    self.drivingLicenseTextField.tag = 11;
    self.drivingLicenseTextField.keyboardType = UIKeyboardTypeASCIICapable;
    self.drivingLicenseTextField.placeholder = @"请输入驾驶证号";
    [self.drivingLicenseTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    if ([OCRSingleton sharedSingleton].isICType) {
      [self.drivingLicenseTextField setEnabled:NO];
    }
    [cell.contentView addSubview: self.drivingLicenseTextField];
  } else if (index == 3) {
    NSDictionary *data = [self.driverData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.carTypeTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.carTypeTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.carTypeTextField.delegate = self;
    self.carTypeTextField.textAlignment = NSTextAlignmentRight;
    self.carTypeTextField.returnKeyType = UIReturnKeyDone;
    self.carTypeTextField.text = value;
    self.carTypeTextField.tag = 12;
    self.carTypeTextField.keyboardType = UIKeyboardTypeASCIICapable;
    self.carTypeTextField.placeholder = @"请输入准驾车型";
    [self.carTypeTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    [cell.contentView addSubview: self.carTypeTextField];
  } else if (index == 4) {
    NSDictionary *data = [self.driverData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    if (![value isEqualToString:@"--"]) {
      NSString *year = [value substringWithRange:NSMakeRange(0, 4)];
      NSString *month = [value substringWithRange:NSMakeRange(4, 2)];
      NSString *day = [value substringWithRange:NSMakeRange(6, 2)];
      value = [NSString stringWithFormat:@"%@-%@-%@", year, month, day];
    }
    
    self.validityBeginDateButton = [[UIButton alloc] initWithFrame:CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    [self.validityBeginDateButton setTitle:value forState:UIControlStateNormal];
    self.validityBeginDateButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
    [self.validityBeginDateButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
    self.validityBeginDateButton.tag = 1;
    [self.validityBeginDateButton addTarget:self action:@selector(selectedValidityDate:) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview: self.validityBeginDateButton];
    [self addDatePickerView];
  } else if (index == 5) {
    NSDictionary *data = [self.driverData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    if (![value isEqualToString:@"--"]) {
      if (value.length == 8) {
        NSString *year = [value substringWithRange:NSMakeRange(0, 4)];
        NSString *month = [value substringWithRange:NSMakeRange(4, 2)];
        NSString *day = [value substringWithRange:NSMakeRange(6, 2)];
        value = [NSString stringWithFormat:@"%@-%@-%@", year, month, day];
      } else if (value.length == 6) {
        NSString *year = [value substringWithRange:NSMakeRange(0, 2)];
        NSString *month = [value substringWithRange:NSMakeRange(2, 2)];
        NSString *day = [value substringWithRange:NSMakeRange(4, 2)];
        value = [NSString stringWithFormat:@"20%@-%@-%@", year, month, day];
      }
    }
    
    self.validityEndDateButton = [[UIButton alloc] initWithFrame:CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    [self.validityEndDateButton setTitle:value forState:UIControlStateNormal];
    self.validityEndDateButton.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
    [self.validityEndDateButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
    self.validityEndDateButton.tag = 2;
    [self.validityEndDateButton addTarget:self action:@selector(selectedValidityDate:) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview: self.validityEndDateButton];
    [self addDatePickerView];
  }
  return cell;
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

/**
 * 从业资格证内容
 */
-(UITableViewCell *)qualificationCertificateContent:(UITableViewCell *)cell indexPathRow:(NSInteger)index
{
  if (index == 1) {
    NSDictionary *data = [self.idCardData objectAtIndex:index];
    NSString *value = [data objectForKey:@"value"];
    UILabel *textLabel = [[UILabel alloc] initWithFrame:CGRectMake(50, 0, self.view.frame.size.width - 30, 44)];
    [textLabel setText:value];
    textLabel.textColor = [UIColor grayColor];
//    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
    [cell addSubview:textLabel];
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
  } else if (index == 0) {
    NSDictionary *data = [self.qualificationCertificateData objectAtIndex:index];
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
  } else if (index == 3) {
    self.uploadQualificationCertificateBtn = [[UIButton alloc] initWithFrame:CGRectMake(15, 15, self.view.frame.size.width - 30, 40)];
    [self.uploadQualificationCertificateBtn setTitle:@"确认上传" forState:UIControlStateNormal];
    self.uploadQualificationCertificateBtn.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
    self.uploadQualificationCertificateBtn.backgroundColor = UIColorFromRGB(0x4287ff); // [UIColor colorWithRed:51/255.0 green:80/255.0 blue:1 alpha:1];
    self.uploadQualificationCertificateBtn.tag = 3;
    [self.uploadQualificationCertificateBtn addTarget:self action:@selector(uploadInfoEvent:) forControlEvents:UIControlEventTouchUpInside];
    [cell.contentView addSubview:self.uploadQualificationCertificateBtn];
    self.uploadQualificationCertificateBtn.layer.cornerRadius = 5;
    cell.backgroundColor = UIColorFromRGB(0xf4f7fa);
    cell.separatorInset = UIEdgeInsetsMake(0, 0, 0, self.view.frame.size.width);
  } else if (index == 2) {
    NSDictionary *data = [self.qualificationCertificateData objectAtIndex:index];
    NSString *key = [data objectForKey:@"key"];
    NSString *value = [data objectForKey:@"value"];
    cell.textLabel.text = key;
    
    self.qualificationsNumberTextField = [[UITextField alloc] initWithFrame: CGRectMake(100, 0, self.view.frame.size.width - 110, 44)];
    self.qualificationsNumberTextField.clearsOnBeginEditing = NO;//鼠标点上时，不清空
    self.qualificationsNumberTextField.delegate = self;
    self.qualificationsNumberTextField.textAlignment = NSTextAlignmentRight;
    self.qualificationsNumberTextField.returnKeyType = UIReturnKeyDone;
    self.qualificationsNumberTextField.text = value;
    self.qualificationsNumberTextField.tag = 21;
    self.qualificationsNumberTextField.placeholder = @"请输入从业资格证号";
    [self.qualificationsNumberTextField addTarget:self action:@selector(textfieldDone) forControlEvents:UIControlEventEditingDidEndOnExit];//把DidEndOnExit事件响应为 textfieldDone: 方法
    if ([OCRSingleton sharedSingleton].isICType) {
      [self.qualificationsNumberTextField setEnabled:NO];
    }
    [cell.contentView addSubview: self.qualificationsNumberTextField];
  }
  return cell;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
  return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  if ([OCRSingleton sharedSingleton].tableSelectedIndex == 0) {
    return 6;
  }
  else if ([OCRSingleton sharedSingleton].tableSelectedIndex == 1) {
    return 7;
  } else {
    return 4;
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
  // 身份证数据
  self.idCardData = @[
                      @{@"key": @"图片", @"value": image},
                      @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                      @{@"key": @"姓名", @"value": @"--"},
                      @{@"key": @"性别", @"value": @"--"},
                      @{@"key": @"身份证号", @"value": @"--"}
                    ];
  // 驾驶证数据
  self.driverData = @[
                      @{@"key": @"图片", @"value": image},
                      @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                      @{@"key": @"驾驶证号", @"value": @"--"},
                      @{@"key": @"准驾车型", @"value": @"--"},
                      @{@"key": @"有效期起", @"value": @"--"},
                      @{@"key": @"有效期至", @"value": @"--"}
                    ];
  // 从业资格证书数据
  self.qualificationCertificateData = @[
                                        @{@"key": @"图片", @"value": image},
                                        @{@"key": @"prompt", @"value": @"请核对扫描信息，确认无误"},
                                        @{@"key": @"从业资格证", @"value": @"--"}
                                      ];
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.row == 0) {
    return (self.view.frame.size.width - 80) * 0.56;
  }
  return 44;
}

- (void)textfieldDone
{
  
}

/**
 * 添加性别选择器
 */
- (void)addGenderPickerView
{
  CGFloat width = self.view.frame.size.width;
  CGFloat height = self.view.frame.size.height;
  self.pickerContainerView = [[UIView alloc] initWithFrame:CGRectMake(0, height, width, 150)];
  self.pickerContainerView.backgroundColor = [UIColor whiteColor];
  self.pickerContainerView.layer.borderWidth = 1;
  self.pickerContainerView.layer.borderColor = [UIColor colorWithRed:0 green:0 blue:0 alpha:0.1].CGColor;
  
  UIButton *btnOK = [[UIButton alloc] initWithFrame:CGRectMake(width - 75, 5, 40, 30)];
  btnOK.titleLabel.font = [UIFont systemFontOfSize:18.0];
  [btnOK setTitle:@"确定" forState:UIControlStateNormal];
  [btnOK setTitleColor:UIColorFromRGB(0x339eff) forState:UIControlStateNormal];
  [btnOK addTarget:self action:@selector(pickerViewBtnOk:) forControlEvents:UIControlEventTouchUpInside];
  [self.pickerContainerView addSubview:btnOK];
  
  UIButton *btnCancel = [[UIButton alloc] initWithFrame:CGRectMake(30, 5, 40, 30)];
  btnCancel.titleLabel.font = [UIFont systemFontOfSize:18.0];
  [btnCancel setTitle:@"取消" forState:UIControlStateNormal];
  [btnCancel setTitleColor:UIColorFromRGB(0x339eff) forState:UIControlStateNormal];
  [btnCancel addTarget:self action:@selector(pickerViewBtnCancel:) forControlEvents:UIControlEventTouchUpInside];
  [self.pickerContainerView addSubview:btnCancel];
  
  UIPickerView *pickView = [[UIPickerView alloc] initWithFrame:CGRectMake(0, 30, self.view.frame.size.width, 120)];
  pickView.delegate = self;
  pickView.dataSource = self;
  pickView.backgroundColor = [UIColor whiteColor];
  [self.pickerContainerView addSubview:pickView];
  [self.view addSubview:self.pickerContainerView];
}

/**
 * 性别选择器显示
 */
-(void)selectedGendder
{
  [self.view endEditing:YES];
  [self viewAnimation:self.pickerContainerView willHidden:NO];
  //  self.pickerContainerView.hidden = NO;
  if (self.gender == nil) {
    self.gender = @"男";
  }
}

/**
 * 选择器确定按钮
 */
- (void)pickerViewBtnOk:(UIButton *)btn
{
  //  self.pickerContainerView.hidden = YES;
  [self viewAnimation:self.pickerContainerView willHidden:YES];
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [self.genderButton setTitle:self.gender forState:UIControlStateNormal];
  });
}

/**
 * 选择器取消按钮
 */
- (void)pickerViewBtnCancel:(UIButton *)btn
{
  [self viewAnimation:self.pickerContainerView willHidden:YES];
  //  self.pickerContainerView.hidden = YES;
}

/**
 * 选择器显示与隐藏动画
 */
- (void)viewAnimation:(UIView*)view willHidden:(BOOL)hidden {
  //  0, height - 150, width, 150
  CGFloat height = self.view.frame.size.height;
  CGFloat width = self.view.frame.size.width;
  [UIView animateWithDuration:0.3 animations:^{
    if (hidden) {
      view.frame = CGRectMake(0, height, width, 260);
    } else {
      [view setHidden:hidden];
      view.frame = CGRectMake(0, height - 260, width, 260);
    }
  } completion:^(BOOL finished) {
    [view setHidden:hidden];
  }];
}

/**
 * 设置UIPickerView列数
 */
- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView
{
  return 1;
}

/**
 * 设置UIPickerView行数
 */
- (NSInteger)pickerView:(UIPickerView *)pickerView numberOfRowsInComponent:(NSInteger)component
{
  return 2;
}

/**
 * 设置UIPickerView每一列的内容
 */
- (NSString *)pickerView:(UIPickerView *)pickerView titleForRow:(NSInteger)row forComponent:(NSInteger)component
{
  if (row == 0) {
    return @"男";
  } else {
    return @"女";
  }
}

- (void)pickerView:(UIPickerView *)pickerView didSelectRow:(NSInteger)row inComponent:(NSInteger)component
{
  if (row == 0) {
    self.gender = @"男";
  } else if (row == 1) {
    self.gender = @"女";
  }
}

-(void)textFiledEditChanged:(NSNotification *)obj
{
  UITextField *textField = (UITextField *)obj.object;
  NSInteger tag = textField.tag;
  NSString *text = textField.text;
  if (tag == 1) {
    [self validateNameTextField:textField string:text];
  } else if (tag == 3) {
    [self validateIdCardTextField:textField string:text];
  } else if (tag == 12) {
    [self validateCarTypeTextField:textField string:text];
  } else if (tag == 21) {
    [self validateQualificationsNumberTextField:textField string:text];
  } else {
    [self validateDrivingLicenseTextField:textField string:text];
  }
}

/**
 * 姓名输入框验证
 */
- (void)validateNameTextField:(UITextField *)textField string:(NSString *)text
{
  NSString *lang = [[textField textInputMode] primaryLanguage];
  if ([lang isEqualToString:@"zh-Hans"]) {
    UITextRange *selectedRange = [textField markedTextRange];
    UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
    if (!position) {
      // 中文和英文一起检测  中文是两个字符
      if ([text validateChineseEng]) {
        if ([text length] > 8)
        {
          textField.text = [text subBytesOfstringToIndex:8];
        }
      } else {
        textField.text = [text substringToIndex:self.textLocation];
      }
      self.textLocation = [textField.text length];
    }
  } else if ([lang isEqualToString:@"en-US"]) {
    if ([text validateChineseEng]) {
      if ([text length] > 8) {
        textField.text = [text subBytesOfstringToIndex:8];
      }
    } else {
      textField.text = [text substringToIndex:self.textLocation];
    }
    self.textLocation = [textField.text length];
  } else {
    textField.text = [text substringToIndex:self.textLocation];
  }
}

/**
 * 身份证输入框验证
 */
- (void)validateIdCardTextField:(UITextField *)textField string:(NSString *)text
{
  UITextRange *selectedRange = [textField markedTextRange];
  UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
  if (!position) {
    if (![text validateIdCard]) {
      textField.text = [text substringToIndex:self.textLocation];
    } else if ([text length] > 18) {
      textField.text = [text substringToIndex:self.textLocation];
    }
    self.textLocation = [textField.text length];
  }
}

/**
 * 准驾车型输入验证
 */
- (void)validateCarTypeTextField:(UITextField *)textField string:(NSString *)text
{
  UITextRange *selectedRange = [textField markedTextRange];
  UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
  if (!position) {
    if (![text validateEngNumber]) {
      textField.text = [text substringToIndex:self.textLocation];
    } else {
      if ([text length] > 10) {
        textField.text = [text substringToIndex:self.textLocation];
      }
    }
    self.textLocation = [textField.text length];
  }
}

/**
 * 从业资格证号输入验证
 */
-(void)validateQualificationsNumberTextField:(UITextField *)textField string:(NSString *)text
{
  UITextRange *selectedRange = [textField markedTextRange];
  UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
  if (!position) {
    if ([text length] > 24) {
      textField.text = [text substringToIndex:self.textLocation];
    }
    self.textLocation = [textField.text length];
  }
}

/**
 * 驾驶证输入验证
 */
-(void)validateDrivingLicenseTextField:(UITextField *)textField string:(NSString *)text
{
  UITextRange *selectedRange = [textField markedTextRange];
  UITextPosition *position = [textField positionFromPosition:selectedRange.start offset:0];
  if (!position) {
    if (![text validateIdCard]) {
      textField.text = [text substringToIndex:self.textLocation];
    } else if ([text length] > 18) {
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

/**
 * textField获取焦点
 */
- (void)textFieldDidBeginEditing:(UITextField *)textField
{
  self.currentTextField = textField;
  self.textLocation = [textField.text length];
}

-(void)selectedValidityDate:(UIButton *)btn
{
  [self.view endEditing:YES];
  self.datePickerView.tag = btn.tag;
  [self viewAnimation:self.datePickerView willHidden:NO];
}

/**
 * 添加日期选择器
 */
- (void)addDatePickerView
{
  if (self.datePickerView == nil) {
    CGFloat width = self.view.frame.size.width;
    CGFloat height = self.view.frame.size.height;
    self.datePickerView = [[UIView alloc] initWithFrame:CGRectMake(0, height, width, 260)];
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
    
    self.datePicker = [[UIDatePicker alloc] initWithFrame:CGRectMake(0, 50, width, 210)];
    self.datePicker.locale = [[NSLocale alloc] initWithLocaleIdentifier:@"zh"];
    self.datePicker.datePickerMode = UIDatePickerModeDate;
    [self.datePicker setDate:[NSDate date] animated:YES];
    [self.datePickerView addSubview:self.datePicker];
  }
}

- (void)datePickerViewBtnOk
{
  [self viewAnimation:self.datePickerView willHidden:YES];
  NSDate *date = [self.datePicker date];
  NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  formatter.dateFormat = @"yyyy-MM-dd";
  NSString *dateStr = [formatter stringFromDate:date];
  if (self.datePickerView.tag == 1) {
    [self.validityBeginDateButton setTitle:dateStr forState:UIControlStateNormal];
    self.validityBeginDateButton.titleLabel.font = [UIFont systemFontOfSize: 18.0];
  } else if (self.datePickerView.tag == 2) {
    [self.validityEndDateButton setTitle:dateStr forState:UIControlStateNormal];
    self.validityEndDateButton.titleLabel.font = [UIFont systemFontOfSize: 18.0];
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
  
  if (_alertView == nil) {
    [_alertView removeFromSuperview];
  }
}

-(void)uploadInfoEvent:(UIButton *)btn
{
  int index = (int)btn.tag;
  UIImage *image = nil;
  if (index == 1) {
    image = [[self.idCardInfoData objectAtIndex:0] objectForKey:@"value"];
  } else if (index == 2) {
    image = [[self.driverLicenseInfoData objectAtIndex:0] objectForKey:@"value"];
  } else if (index == 3) {
    image = [[self.qualificationCertificateInfoData objectAtIndex:0] objectForKey:@"value"];
  }
  if (image != nil) {
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
                                 dispatch_async(dispatch_get_main_queue(), ^{
                                   if (index == 1) {
                                     [self uploadIdCardEvent:newImageUrl];
                                   } else if (index == 2) {
                                     [self uploadDriverEvent:newImageUrl];
                                   } else if (index == 3) {
                                     [self uploadQualificationCertificateEvent:newImageUrl];
                                   }
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
  }
}

/**
 * 身份证信息组装
 */
- (void)uploadIdCardEvent:(NSString *)newImageUrl
{
  NSDictionary *params = nil;
  NSString *name = self.nameTextField.text;
  if (![name isEqualToString:@""]) {
    if ([OCRSingleton sharedSingleton].isAddPractitioners) {
      params = @{
                 @"vehicleId": [OCRSingleton sharedSingleton].monitorId,
                 @"oldPhoto": @"",
                 @"info": @{
                       @"name": name,
                       @"gender": [self getGenderValue:self.gender],
                       @"identity": self.idCardTextField.text,
                       @"identity_card_photo": newImageUrl,
                     },
                 @"type": @"1",
                 };
    } else {
      params = @{
                 @"vehicleId": [OCRSingleton sharedSingleton].monitorId,
                 @"oldPhoto": [OCRSingleton sharedSingleton].oldPhotoUrl,
                 @"info": @{
                       @"name": name,
                       @"gender": [self getGenderValue:self.gender],
                       @"identity": self.idCardTextField.text,
                       @"identity_card_photo": newImageUrl,
                       @"id": [OCRSingleton sharedSingleton].practitionersId,
                     },
                 @"type": @"1",
                 };
    }
    [self uploadInfo:params];
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[ToastView shareInstance] makeToast:@"姓名不能为空" duration:2.0];
    });
  }
}

/**
 * 驾驶证信息组装
 */
- (void)uploadDriverEvent:(NSString *)newImageUrl
{
  NSString *driving_start_date = self.validityBeginDateButton.titleLabel.text;
  if ([driving_start_date isEqualToString:@"--"]) {
    driving_start_date = @"";
  } else {
    driving_start_date = [driving_start_date stringByReplacingOccurrencesOfString:@"-" withString:@""];
  }
  
  NSString *driving_end_date = self.validityEndDateButton.titleLabel.text;
  if ([driving_end_date isEqualToString:@"--"]) {
    driving_end_date = @"";
  } else {
    driving_end_date = [driving_end_date stringByReplacingOccurrencesOfString:@"-" withString:@""];
  }
  
  NSDictionary *params = @{
                           @"vehicleId": [OCRSingleton sharedSingleton].monitorId,
                           @"oldPhoto": [OCRSingleton sharedSingleton].oldPhotoUrl,
                           @"info": @{
                                  @"driving_license_no": self.drivingLicenseTextField.text,
                                  @"driving_type": self.carTypeTextField.text,
                                  @"driving_start_date": driving_start_date,
                                  @"driving_end_date": driving_end_date,
                                  @"driver_license_photo": newImageUrl,
                                  @"id": [OCRSingleton sharedSingleton].practitionersId,
                               },
                           @"type": @"2",
                           };
  [self uploadInfo:params];
}

/**
 * 从业资格证上传
 */
- (void)uploadQualificationCertificateEvent:(NSString *)newImageUrl
{
  NSDictionary *params = @{
                           @"vehicleId": [OCRSingleton sharedSingleton].monitorId,
                           @"oldPhoto": [OCRSingleton sharedSingleton].oldPhotoUrl,
                           @"info": @{
                                  @"card_number": self.qualificationsNumberTextField.text,
                                  @"qualification_certificate_photo": newImageUrl,
                                  @"id": [OCRSingleton sharedSingleton].practitionersId,
                               },
                           @"type": @"3",
                         };
  [self uploadInfo:params];
}

/**
 * 信息上传
 */
- (void)uploadInfo:(NSDictionary *)params
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [[OCRServices shardService] uploadPractitionersInfo:params
                                         successHandler:^(id result) {
                                           NSInteger statusCode = [[result objectForKey:@"statusCode"] integerValue];
                                           BOOL success = [[result objectForKey:@"success"] boolValue];
                                           if (statusCode == 200 && success == YES) {
                                             NSDictionary *data = [result objectForKey:@"obj"];
                                             if (data.count > 0) {
                                               NSString *flag = [data objectForKey:@"flag"];
                                               if ([flag isEqualToString:@"1"]) {
                                                 dispatch_async(dispatch_get_main_queue(), ^{
                                                   [[ToastView shareInstance] makeToast:@"上传成功" duration:2.0];
                                                   [OCRSingleton sharedSingleton].isLoadData = YES;
                                                   dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                                                     NSArray *controllers = self.navigationController.viewControllers;
                                                     [self.navigationController popToViewController:[controllers objectAtIndex:controllers.count - 3] animated:YES];
                                                   });
                                                 });
                                               } else {
                                                 NSString *pId = [data objectForKey:@"id"];
                                                 NSString *msg = [data objectForKey:@"msg"];
                                                 if (pId != nil) {
                                                   if ([pId isEqual:[NSNull null]] || [pId isEqualToString:@""]) {
                                                     dispatch_async(dispatch_get_main_queue(), ^{
                                                       [[ToastView shareInstance] makeToast:msg duration:2.0];
                                                     });
                                                   } else {
                                                     //                                                   self.alertView.hidden = NO;
                                                     [self addAlertView:pId];
                                                     //                                                   [self.view addSubview:self.alertView];
                                                   }
                                                 } else {
                                                   dispatch_async(dispatch_get_main_queue(), ^{
                                                     [[ToastView shareInstance] makeToast:msg duration:2.0];
                                                   });
                                                 }
                                               }
                                             }
                                            
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

-(NSString *)getGenderValue:(NSString *)gender
{
  if ([gender isEqualToString:@"男"]) {
    return @"1";
  } else {
    return @"2";
  }
}

- (void)handleSingleTap:(UITapGestureRecognizer *)gestureRecognizer {
  MyUITapGestureRecognizer *tap = (MyUITapGestureRecognizer *)gestureRecognizer;
  [[PhotoFullScreen shareInstances] makeToast:tap.image];
}

-(void)addAlertView:(NSString *)pId
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!_alertView) {
      CGFloat height = [UIScreen mainScreen].bounds.size.height;
      CGFloat width = [UIScreen mainScreen].bounds.size.width;
      
      _alertView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, width, height)];
      _alertView.backgroundColor = [UIColor colorWithRed:0 green:0 blue:0 alpha:0.5];
      
      UIView *content = [[UIView alloc] initWithFrame:CGRectMake((width-300)/2, (height-300)/2 + 70, 300, 140)];
      content.backgroundColor = [UIColor whiteColor];
      content.layer.cornerRadius = 5;
      
      UILabel *title = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, 300, 40)];
      title.text = @"提示";
      title.textAlignment = NSTextAlignmentCenter;
      [content addSubview:title];
      
      UILabel *info1 = [[UILabel alloc] initWithFrame:CGRectMake(0, 40, 300, 25)];
      info1.text = @"该从业人员已存在，";
      info1.textAlignment = NSTextAlignmentCenter;
      [content addSubview:info1];
      
      UILabel *info2 = [[UILabel alloc] initWithFrame:CGRectMake(0, 65, 300, 25)];
      info2.text = @"是否与当前监控对象绑定";
      info2.textAlignment = NSTextAlignmentCenter;
      [content addSubview:info2];
      
      UIButton *cancelBtn = [[UIButton alloc] initWithFrame:CGRectMake(60, 100, 80, 30)];
//      cancelBtn.titleLabel.text = @"取消";
      [cancelBtn setTitle:@"取消" forState:UIControlStateNormal];
      cancelBtn.layer.cornerRadius = 5;
      cancelBtn.backgroundColor = [UIColor grayColor];
      cancelBtn.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
      [cancelBtn addTarget:self action:@selector(cancelBind:) forControlEvents:UIControlEventTouchUpInside];
      [content addSubview:cancelBtn];
      
      UIButton *confirmBtn = [[UIButton alloc] initWithFrame:CGRectMake(160, 100, 80, 30)];
//      confirmBtn.titleLabel.text = @"确定";
      
      [confirmBtn setTitle:@"绑定" forState:UIControlStateNormal];
      confirmBtn.layer.cornerRadius = 5;
      confirmBtn.backgroundColor = UIColorFromRGB(0x4287ff);
      confirmBtn.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
      objc_setAssociatedObject(confirmBtn, @"pId", pId, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
      [confirmBtn addTarget:self action:@selector(confirmBind:) forControlEvents:UIControlEventTouchUpInside];
      [content addSubview:confirmBtn];
      
      [_alertView addSubview:content];
      [[[UIApplication sharedApplication] keyWindow] addSubview:_alertView];
//      [self.view addSubview:_alertView];
    }
    self.alertView.hidden = NO;
  });
}

- (void)cancelBind:(UIButton *)btn
{
  self.alertView.hidden = YES;
}

- (void)confirmBind:(UIButton *)btn
{
  NSString *pid = objc_getAssociatedObject(btn, @"pId");
  NSDictionary *params = @{
                           @"newId": pid,
                           @"vehicleId": [OCRSingleton sharedSingleton].monitorId,
                           };
  dispatch_async(dispatch_get_main_queue(), ^{
    [[OCRServices shardService] bindPractitioners:params
                                   successHandler:^(id result) {
                                     NSLog(@"ssss");
                                     NSInteger statusCode = [[result objectForKey:@"statusCode"] integerValue];
                                     BOOL success = [[result objectForKey:@"success"] boolValue];
                                     if (statusCode == 200 && success == YES) {
                                       NSDictionary *data = [result objectForKey:@"obj"];
                                       if (![data isEqual:[NSNull null]]) {
                                         NSString *flag = [data objectForKey:@"flag"];
                                         if ([flag isEqualToString:@"1"]) {
                                           dispatch_async(dispatch_get_main_queue(), ^{
                                             [[ToastView shareInstance] makeToast:@"绑定成功" duration:2.0];
                                             dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                                               NSArray *controllers = self.navigationController.viewControllers;
                                               [self.navigationController popToViewController:[controllers objectAtIndex:controllers.count - 3] animated:YES];
                                             });
                                           });
                                         } else {
                                           dispatch_async(dispatch_get_main_queue(), ^{
                                             NSString *msg = [data objectForKey:@"msg"];
                                             [[ToastView shareInstance] makeToast:msg duration:2.0];
                                           });
                                         }
                                       }
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
                                            [[ToastView shareInstance] makeToast:@"绑定失败" duration:2.0];
                                          });
                                        }
                                      }];
  });
  self.alertView.hidden = YES;
}

@end
