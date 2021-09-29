// 风险证据媒体文件
import ImgUrl from '../static/video/1.jpeg';
import ImgUrl2 from '../static/video/2.jpeg';
import ImgUrl3 from '../static/video/3.jpeg';
import VideoUrl from '../static/video/1.mp4';

// import VideoUrl2 from '../static/video/2.mp4';
// import VideoUrl3 from '../static/video/3.mp4';

// 风险列表
const riskList = {
  exceptionDetailMsg: null,
  msg: null,
  obj: [
    {
      brand: '黑B8A361',
      id: '61911a1a-d13d-49f3-ba29-0093be64b18d',
      picFlag: 1,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 1,
      warningTime: '2018-12-13 11:43:30',
    },
    {
      brand: '黑B98367',
      id: '48878a09-5c44-429f-8ad2-752de9428f89',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:43:00',
    },
    {
      brand: '黑B8A677',
      id: 'c859b7ae-3052-4a01-8be9-b98d2c2f8ca7',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:42:30',
    },
    {
      brand: '黑D8A364',
      id: 'f3fc354e-ba1b-43d7-9dc3-255ba057a8ae',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:42:00',
    },
    {
      brand: '黑E8A365',
      id: 'b03862ce-6053-40f2-9e8e-9bd00cd87b05',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:41:30',
    },
    {
      brand: '黑B8A377',
      id: 'dc101b02-07f7-44bf-b058-1c96622dff72',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:41:00',
    },
    {
      brand: '黑B8Q122',
      id: '910851eb-a5f0-4624-b54b-bf3cbda364e2',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:40:30',
    },
    {
      brand: '黑B8F666',
      id: '58ecba66-97d1-415b-b05e-a9b9150cfe01',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:40:00',
    },
    {
      brand: '黑B8C111',
      id: '75a63e33-e44a-4d21-9732-48927b40088d',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:39:30',
    },
    {
      brand: '黑B8A636',
      id: '06695072-013b-4e72-8ad4-a8d62dc0faf3',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:39:00',
    },
    {
      brand: '黑B8V527',
      id: '06695072-013b-4e72-8ad4-a8d62dc0faf3',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:39:00',
    },
    {
      brand: '黑B8G012',
      id: '06695072-013b-4e72-8ad4-a8d62dc0faf3',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:39:00',
    },
    {
      brand: '黑A47789',
      id: '06695072-013b-4e72-8ad4-a8d62dc0faf3',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:39:00',
    },
    {
      brand: '黑B8A777',
      id: '06695072-013b-4e72-8ad4-a8d62dc0faf3',
      picFlag: 0,
      riskLevel: 1,
      riskStatus: '待处理',
      riskType: '碰撞危险',
      videoFlag: 0,
      warningTime: '2018-12-13 11:39:00',
    },
  ],
  statusCode: 200,
  success: true,
};

// 今日风险处理统计
const dealInfo = {
  exceptionDetailMsg: null,
  msg: null,
  obj: { total: 100, treated: 38, untreated: 62 },
  statusCode: 200,
  success: true,
};

// 风险事件列表
const eventList = {
  exceptionDetailMsg: null,
  msg: null,
  obj: [{
    address: '重庆市渝北区大盛镇013乡道',
    eventTime: '2018-12-13 11:43:30',
    riskEvent: '前车碰撞',
    riskType: '碰撞危险',
  }, {
    address: '重庆市渝北区大盛镇013乡道',
    eventTime: '2018-12-13 11:43:10',
    riskEvent: '前车碰撞',
    riskType: '碰撞危险',
  }, {
    address: '重庆市渝北区大盛镇013乡道',
    eventTime: '2018-12-13 11:43:02',
    riskEvent: '打哈欠',
    riskType: '疲劳驾驶',
  }],
  statusCode: 200,
  success: true,
};


const MediaInfo = {
  exceptionDetailMsg: '平台类型不能为空',
  msg: null,
  obj: [
    {
      eventTime: '12:52:02',
      eventName: '闭眼',
      mediaUrl: ImgUrl,
    },
    {
      eventTime: '12:52:45',
      eventName: '闭眼',
      mediaUrl: ImgUrl2,
    },
    {
      eventTime: '12:12:02',
      eventName: '闭眼',
      mediaUrl: ImgUrl3,
    },
  ],
  statusCode: 400,
  success: false,
};
const MediaInfo2 = {
  exceptionDetailMsg: '平台类型不能为空',
  msg: null,
  obj: [
    {
      eventTime: '12:52:02',
      eventName: '闭眼',
      mediaUrl: VideoUrl,
    },
    // {
    //   eventTime: '12:52:45',
    //   eventName: '视频2',
    //   mediaUrl: VideoUrl2,
    // },
    // {
    //   eventTime: '12:52:02',
    //   eventName: '视频3',
    //   mediaUrl: VideoUrl3,
    // },
  ],
  statusCode: 400,
  success: false,
};

// 风险处理
const dealRisk = {
  exceptionDetailMsg: null,
  msg: null,
  obj: true,
  statusCode: 200,
  success: true,
};

export {
  riskList,
  dealInfo,
  eventList,
  MediaInfo,
  MediaInfo2,
  dealRisk,
};