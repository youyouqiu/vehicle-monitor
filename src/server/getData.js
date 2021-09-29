/* eslint-disable import/no-cycle */
import fetch from '../utils/fetch';


/**
 * 登录接口
 */
export const postLogin = async data => fetch(`/clbs/oauth/token?client_id=mobile_1&client_secret=secret_1&grant_type=password&username=${data.username}&password=${data.password}`, 'POST', data, 12000, false);

/**
 * 强制更新接口
 */
export const ifMustUpdate = async data => fetch(`/clbs/app/update/force?version=${data.version}&platform=${data.platform}`, 'POST', data, 12000, false);

/**
 * 平台版本检测
 */
export const getHighest = async data => fetch('/clbs/app/update/highest', 'POST-FORM', data, 12000, false);

/**
 * 中寰登录接口
 */
export const postLoginZhonghuan = async data => fetch(`/clbs/oauth/token?client_id=mobile_1&client_secret=secret_1&grant_type=password&username=${data.username}&password=${data.password}&verificationCode=${data.verificationCode}`, 'POST', data, 12000, false);

/**
 * 获取当前用户下所有监控对象id及经纬度
 */
export const getMonitorIds = data => fetch('/clbs/app/monitor/monitorIds', 'GET', data);

/**
 * 获取监控对象基础位置信息
 */
export const getBasicLocationInfo = data => fetch('/clbs/app/monitor/getBasicLocationInfoByMonitorId', 'POST-FORM', data);

/**
 * 获取监控对象信息
 */
export const getMsgFun = data => fetch('/clbs/app/videoResource/getAudioAndVideoParameters', 'POST-FORM', data);

/**
 * 获取监控对象详细位置信息
 */
export const getDetailLocationInfo = data => fetch(`/clbs/app/monitor/detailLocationInfo/${data.monitorId}`, 'GET', {});

/**
 * 根据socket数据,获取监控对象详细位置信息
 */
export const setDetailLocationInfo = data => fetch('/clbs/app/monitor/setDetailLocationInfo', 'POST-FORM', data);


/**
 * 获取监控对象分组
 */
export const getAssignment = data => fetch('/clbs/app/monitor/assignmentByUser', 'GET', data, 20000);

/**
 * 获取监控对象分组列表
 */
export const getAssignmentList = data => fetch('/clbs/app/monitor/list', 'GET', data);

/**
 * 获取监控对象搜索
 */
export const searchAssignment = data => fetch('/clbs/app/monitor/fuzzyList', 'GET', data, 20000);

/**
 * 根据监控对象id获取监控对象列表
 */
export const getSearchVehicleList = data => fetch('/clbs/app/monitor/fuzzyDetailList', 'GET', data, 20000);

/**
 * 获取监控对象详情
 */
export const getAssignmentDetail = data => fetch(`/clbs/app/monitor/getMonitorInfo/${data.id}`, 'GET', data);


/**
 * 获取报警对象信息
 */
export const getAlarmData = data => fetch('/clbs/app/alarm/monitor', 'GET', data, 20000);

/**
 * 获取报警对象数
 */
export const getAlarmNum = data => fetch('/clbs/app/alarm/monitorNumber', 'GET', data, 20000);

/**
 * 获取报警对象概要信息
 */
export const getAlarmInfoSummary = data => fetch(`/clbs/app/alarm/monitor/${data.id}/summary`, 'GET', data);

/**
 * 获取报警对象详细信息
 */
export const getAlarmInfoDetail = data => fetch(`/clbs/app/alarm/monitor/${data.id}/detail`, 'GET', data);

/**
 * 获取用户报警配置信息
 */
export const getAlarmSetting = data => fetch('/clbs/app/alarm/setting', 'GET', data);

/**
 * 获取app信息配置
 */
export const getAppConfig = () => fetch('/clbs/m/app/personalized/list', 'POST', {});

/**
 * 获取监控对象通道号接口
 */
export const getChannel = data => fetch(`/clbs/app/monitor/channelData/${data.id}`, 'GET', data);

/**
 * 获取监控对象通道号接口
 */
export const sendParamByBatch = data => fetch('/clbs/app/monitor/sendParamByBatch', 'POST-FORM', data);

/**
 * 获取监控对象传感器列表
 */
export const getAttached = data => fetch(`/clbs/app/monitor/${data.monitorId}/attached`, 'GET', data);

/**
 * 获取监控对象里程统计数据
 */
export const getMileageStatistics = data => fetch(`/clbs/app/monitor/${data.monitorId}/history/mileDayStatistics`, 'GET', data);


/**
 * 获取监控对象里程数据
 */
export const getMileage = data => fetch(`/clbs/app/monitor/${data.monitorId}/history/mileage`, 'GET', data);

/**
 * 获取监控对象停止数据
 */
export const getStop = data => fetch(`/clbs/app/monitor/${data.monitorId}/history/stop`, 'GET', data);

/**
 * 获取监控对象油量数据
 */
export const getOilData = data => fetch(`/clbs/app/monitor/${data.monitorId}/history/oilMass`, 'GET', data);

/**
 * 获取监控对象油耗数据
 */
export const getOilConsumption = data => fetch(`/clbs/app/monitor/${data.monitorId}/history/oilConsume`, 'GET', data);

/**
 * 获取监控对象温度数据
 */
export const getTemperaturey = data => fetch(`/clbs/app/monitor/${data.monitorId}/history/temperature`, 'GET', data);

/**
 * 获取监控对象湿度数据
 */
export const getHumidity = data => fetch(`/clbs/app/monitor/${data.monitorId}/history/humidity`, 'GET', data);

/**
 * 获取监控对象正反转数据
 */
export const getReverse = data => fetch(`/clbs/app/monitor/${data.monitorId}/history/motor`, 'GET', data);

/**
 * 获取监控对象IO数据
 */
export const getIoData = data => fetch(`/clbs/app/monitor/${data.monitorId}/history/switch`, 'GET', data);

/**
 * 获取监控对象载重数据
 */
export const getWeight = data => fetch('/clbs/app/monitor/loadWeight', 'POST-FORM', data);

/**
 * 获取监控对象胎压数据
 */
export const getTire = data => fetch('/clbs/app/monitor/tirePressureData', 'POST-FORM', data);

/**
 * 获取监控对象历史位置数据
 */
export const getHistoryLocation = data => fetch(`/clbs/app/monitor/${data.monitorId}/history/location`, 'GET', data);

/**
 * 个人中心-意见反馈
 */
export const postFeedBack = data => fetch(`/clbs/app/sendFeedback?feedback=${data.feedback}`, 'POST', {});

/**
 * 获取监控对象通道号接口
 */
export const sendVideoParam = data => fetch('/clbs/app/monitor/sendVideoParam', 'POST-FORM', data);

/**
 * 个人中心-修改密码
 */
export const postChangePassword = data => fetch(`/clbs/app/user/password?oldPassword=${data.oldPassword}&newPassword=${data.newPassword}`, 'POST', {});

/**
 * 个人中心-关于我们getUserInfo
 */
export const getAbout = () => fetch('/clbs/app/customInfo', 'GET', {});

/**
 * 获取监控对象工时数据
 */
export const getWorkHour = data => fetch(`/clbs/app/monitor/${data.monitorId}/history/workHour`, 'GET', data);

/**
 * 个人中心-用户信息
 */
export const getUserInfo = () => fetch('/clbs/app/AppUserInformation', 'GET', {});

/**
 * 保存日志
 */
export const saveLog = data => fetch('/clbs/app/saveAppRegisterLog', 'POST-FORM', data);

/**
 * 点名下发
 */
export const setRollCallIssued = data => fetch('/clbs/app/order/call', 'POST-FORM', data);

/**
 * 判断监控对象是否在线
 */
export const checkMonitorOnline = data => fetch(`/clbs/app/monitor/${data.monitorId}/checkMonitorOnline`, 'GET', {});

/**
 * 检测服务器是否联通
 */
export const checkServerUnobstructed = () => fetch('/clbs/app/order/checkServerUnobstructed', 'GET', {}, 2000, false);

/**
 * 判断监控对象是否解绑
 */
export const checkMonitorAuth = data => fetch(`/clbs/app/monitor/${data.monitorId}/checkMonitorAuth`, 'GET', {});

/**
 * 报警排名，报警处置选择监控对象
 */
export const getAlarmMonitor = data => fetch('/clbs/app/risk/riskRank/getVehiclesOfUser', 'GET', data);

/**
 * 上线统计，超速统计选择监控对象
 */
export const getStatisticalMonitor = data => fetch('/clbs/app/risk/riskRank/getMonitorOfUser', 'GET', data);

/**
 * 工时统计选择监控对象
 */
export const getWorkingStatisticalMonitor = data => fetch('/clbs/app/reportManagement/workHourReport/getSendWorkHourPollsMonitorInfo', 'POST-FORM', data);

/**
 * 登陆页 短信验证码
 */
export const getCaptchaAuth = data => fetch(`/clbs/app/sm/check?phoneNumber=${data.account}&platform=${data.platform}&version=${data.version}`, 'POST', { phoneNumber: data }, 8000, false);

/**
 * 获取版本
 */
export const getAppVersion = data => fetch(`/clbs/app/update/version?version=${data.version}&platform=${data.platform}`, 'POST', {});
/**
 * 主动安全-报警列表详情信息
 */
export const getRiskList = data => fetch('/clbs/app/risk/security/getRiskList', 'POST-FORM', data);
/**
 * 主动安全-今日报警处置情况
 */
export const getDealInfos = () => fetch('/clbs/app/risk/security/dealInfo', 'POST-FORM', {});
/**
 * 主动安全-展现多媒体列表数据
 */
export const getMediaInfo = data => fetch('/clbs/app/risk/security/getMediaInfo', 'POST-FORM', data);
/**
 * 主动安全-风险处理
 */
export const getDealRisk = data => fetch('/clbs/app/risk/security/dealRisk', 'POST-FORM', data);
/**
 * 主动安全-风险事件的列表详情
 */
export const getRiskEvent = data => fetch('/clbs/app/risk/security/getRiskEventByRiskId', 'POST-FORM', data);
/**
 * 获取报警排行柱状图信息
 */
export const getAlarmRankBar = data => fetch('/clbs/app/risk/riskRank/getRiskRank', 'POST-FORM', data);

/**
 * 获取报警排行饼状图信息
 */
export const getAlarmRankPie = data => fetch('/clbs/app/risk/riskRank/getPercentageOfRank', 'POST-FORM', data);

/**
 * 获取超速统计信息
 */
export const getSpeedingStatistics = data => fetch('/clbs/app/reportManagement/speedReport/list', 'POST-FORM', data);

/**
 * 获取超速统计柱状图详情
 */
export const getSpeedingStatisticsDetail = data => fetch('/clbs/app/reportManagement/speedReport/detail', 'POST-FORM', data);

/**
 * 获取上线率排行柱状图信息
 */
export const getOnlineBar = data => fetch(`/clbs/app/reportManagement/onlineReport/list?startTime=${data.startTime}&endTime=${data.endTime}&moniterIds=${data.vehicleIds}`, 'POST-FORM', data);
/**
 * 获取上线率排行柱状图详情
 */
export const getBarDetailData = data => fetch(`/clbs/app/reportManagement/onlineReport/detail?startTime=${data.startTime}&endTime=${data.endTime}&moniterId=${data.moniterId}`, 'POST-FORM', data);

/**
 * 获取行驶统计柱状图信息
 */
export const getMileBar = data => fetch(`/clbs/app/statistic/mileageReport/findTravelDetailList?startTime=${data.startTime}&endTime=${data.endTime}&monitorIds=${data.vehicleIds}`, 'POST-FORM', data);
/**
 * 获取行驶统计柱状图详情
 */
export const getMileDetailData = data => fetch(`/clbs/app/statistic/mileageReport/findSingleMonitorList?startTime=${data.startTime}&endTime=${data.endTime}&monitorIds=${data.moniterId}`, 'POST-FORM', data);

/**
 * 获取里程统计柱状图信息
 */
export const terminalMileageBar = data => fetch('/clbs/app/reportManagement/terminalMileage/list', 'POST-FORM', data);
/**
 * 获取里程统计柱状图详情
 */
export const terminalMileageDetailData = data => fetch('/clbs/app/reportManagement/terminalMileage/detail', 'POST-FORM', data);


/**
 * 获取停止统计柱状图信息
 */
export const getStopBar = data => fetch(`/clbs/app/statistic/parkingReport/findParkingDetailList?startTime=${data.startTime}&endTime=${data.endTime}&monitorIds=${data.vehicleIds}`, 'POST-FORM', data);
/**
 * 获取停止统计柱状图详情
 */
export const getStopDetailData = data => fetch(`/clbs/app/statistic/parkingReport/findSingleMonitorParkingList?startTime=${data.startTime}&endTime=${data.endTime}&monitorIds=${data.moniterId}`, 'POST-FORM', data);

/**
 * 获取报警处置柱状图数据
 */
export const getAlarmDisposal = data => fetch('/clbs/app/risk/dealRank/getDealRank', 'POST-FORM', data);

/**
 * 获取报警处置数量
 */
export const getDisposalNumber = data => fetch('/clbs/app/risk/dealRank/getDealNum', 'POST-FORM', data);

/**
 * 获取综合统计报表默认监控对象id
 */
export const getDefaultMonitors = data => fetch('/clbs/app/risk/riskRank/getDefaultMonitorIds', 'POST-FORM', data);

/**
 * 工时统计,判断用户是否拥有下发了工时传感器轮询的监控对象
 */
export const judgeUserIfOwnSend = data => fetch('/clbs/app/reportManagement/workHourReport/judgeUserIfOwnSendWorkHourPollsMonitor', 'GET', data);

/**
 * 获取工时统计信息
 */
export const getWorkHourStatisticsInfo = data => fetch('/clbs/app/reportManagement/workHourReport/getWorkHourStatisticsInfo', 'POST-FORM', data);


/**
 * 油量里程,判断用户权限内是否有设置了油量传感器轮询的监控对象
 */
export const judgeUserPollingOilMassMonitor = data => fetch('/clbs/app/statistic/oilMassAndMile/judgeUserPollingOilMassMonitor', 'POST-FORM', data);

/**
 * 油量里程,获取用户权限内设置了油量传感器轮询的监控对象信息及用户分组信息
 */
export const getPollingOilMassMonitor = data => fetch('/clbs/app/statistic/oilMassAndMile/getPollingOilMassMonitor', 'GET', data);

/**
 * 获取油量里程信息
 */
export const getOilStatisticsInfo = data => fetch('/clbs/app/statistic/oilMassAndMile/getData', 'GET', data);

/**
 * 获取油耗里程监控对象
 */
export const getOilConsumptionMonitor = data => fetch('/clbs/app/reportManagement/oilMileage/getOilSensorMoniterIds', 'POST-FORM', data);
/**
 * 获取油耗里程统计数据
 */
export const getOilConsumptionInfo = data => fetch('/clbs/app/reportManagement/oilMileage/list', 'POST-FORM', data);
/**
 * 获取油耗里程统计详情数据
 */
export const getOilConsumptionDetail = data => fetch('/clbs/app/reportManagement/oilMileage/detail', 'POST-FORM', data);

/**
 * 获取综合统计报表默认监控对象id
 */
export const goSecurity = data => fetch('/clbs/app/risk/riskRank/getAdasMonitorFlag', 'POST-FORM', data);

/**
 * 安全信息-获取单车自定义天数范围每天的报警数量
 */
export const getDayRiskNum = data => fetch('/clbs/app/risk/security/getDayRiskNum', 'POST-FORM', data);

/**
 * 安全信息-获取报警详情
 */
export const getDayRiskDetail = data => fetch('/clbs/app/risk/security/getDayRiskDetail', 'POST-FORM', data);

/**
 * 监控对象是否设置风险定义
 */
export const checkMonitorBindRisk = data => fetch('/clbs/app/risk/riskRank/getVehicleIsBindRiskDefined', 'POST-FORM', data);

/**
 * 监控对象是否绑定了obd传感器
 */
export const checkMonitorBindObd = data => fetch('/clbs/app/manager/obdManager/findIsBandObdSensor', 'POST-FORM', data);

/**
 * 生成客户端id
 */
export const getClientId = data => fetch('/clbs/m/user/clientId', 'POST-FORM', data);

/**
 * 检查客户端id是否改变
 */
export const validateClientId = data => fetch('/clbs/m/user/clientId/check', 'POST-FORM', data, 8000, false);

/**
 * 行驶统计,停止统计,上线统计,超速统计监控对象模糊搜索
 */
export const getFuzzyMonitorOfUser = data => fetch('/clbs/app/risk/riskRank/getFuzzyMonitorOfUser', 'GET', data);

/**
 * 报警排名 报警处置监控对象模糊搜索
 */
export const getFuzzyVehicleOfUser = data => fetch('/clbs/app/risk/riskRank/getFuzzyVehicleOfUser', 'GET', data);

/**
 * 工时统计监控对象模糊搜索
 */
export const getFuzzyHourPollsOfUser = data => fetch('/clbs/app/risk/riskRank/getFuzzyHourPollsOfUser', 'GET', data);

/**
 * 油量统计监控对象模糊搜索
 */
export const getFuzzyPollingOilOfUser = data => fetch('/clbs/app/risk/riskRank/getFuzzyPollingOilOfUser', 'GET', data);

/**
 * 油耗统计监控对象模糊搜索
 */
export const getFuzzyOilSensorOfUser = data => fetch('/clbs/app/risk/riskRank/getFuzzyOilSensorOfUser', 'GET', data);

/**
 * 到期提醒接口
 */
export const getExpireRemindInfos = data => fetch('/clbs/app/expireRemind/getExpireRemindInfos', 'POST-FORM', data);

/**
 * 获取到期提醒详情
 */
export const getExpireRemindInfoDetails = data => fetch('/clbs/app/expireRemind/getExpireRemindInfoDetails', 'POST-FORM', data);
/*
 * 获取监控对象通道号接口，跟之前的接口相比，过滤了音频
 */
export const getVideoChannel = data => fetch('/clbs/app/videoResource/getVideoChannel', 'POST-FORM', data);

/**
 * 视频回放下发9205获取资源信息接口（websocket 数据返回监听路径 ： /resourceList）
 * 一天的数据
 */
export const send9205 = data => fetch('/clbs/app/videoResource/getResourceList', 'POST-FORM', data);

/**
 * 视频回放下发920f获取资源信息接口（websocket 数据返回监听路径 ： /resourceDateList ）
 * 15天中哪些天有码流数据
 */
export const send920f = data => fetch('/clbs/app/videoResource/send920f', 'POST-FORM', data);

/**
 * 视频回放下发参数
 */
export const send9201 = data => fetch('/clbs/app/videoResource/locusPoint', 'POST-FORM', data);

/**
 * 视频回放下发参数 播放控制
 */
export const send9202 = data => fetch('/clbs/app/videoResource/playbackControl', 'POST-FORM', data);