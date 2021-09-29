import { getStorageHttpConfig } from '../server/getStorageData';

const defaultConfig = {
  baseUrl: '112.126.64.32',
  port: '8080',
  realTimeVideoIp: '120.220.247.11',
  videoRequestPort: '8971',
  videoPlaybackPort: '8977',
  imageWebUrl: 'http://112.126.64.32:8799',
};

const optionConfig = {
  baseUrl: defaultConfig.baseUrl,
  port: defaultConfig.port,
  realTimeVideoIp: defaultConfig.realTimeVideoIp,
  videoRequestPort: defaultConfig.videoRequestPort,
  videoPlaybackPort: defaultConfig.videoPlaybackPort,
  imageWebUrl: defaultConfig.imageWebUrl,
  ledBillboardState: false,
  version: 20303,
};

export const assemblyUrl = (
  url = defaultConfig.baseUrl,
  rPort = defaultConfig.port,
) => {
  const config = {
    baseUrl: url,
    port: rPort,
  };
  Object.assign(optionConfig, config);
};

export const assemblyVideoPort = (
  vIp = defaultConfig.videoRequestPort,
  vPort = defaultConfig.videoRequestPort,
  vPlaybackPort = defaultConfig.videoPlaybackPort,
  imageWebUrl = defaultConfig.imageWebUrl,
) => {
  const config = {
    realTimeVideoIp: vIp,
    videoRequestPort: vPort,
    videoPlaybackPort: vPlaybackPort,
    imageWebUrl,
  };
  Object.assign(optionConfig, config);
};

export const requestConfig = () => optionConfig;

export async function resetHttpConfig () {
  const httpConfig = await getStorageHttpConfig();
  assemblyUrl(httpConfig.baseUrl, httpConfig.port);
  assemblyVideoPort(
    httpConfig.realTimeVideoIp,
    httpConfig.videoRequestPort,
    httpConfig.videoPlaybackPort,
    httpConfig.imageWebUrl,
  );
}
