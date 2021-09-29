import pako from 'pako';
import Base64 from './base64';
// const pako = require('./pako.min.js');
/**
 * 解压缩字符串
 * @param zipData
 *            经过 gzip压缩和base64编码的字符串
 * @param callback
 *            回调函数 用解压缩后的数据进行处理后续操作
 * @author wangying
 */
export function ungzip(zipData) {
  // try {
  const punzipstr = zipData;
  // punzipstr =decodeURIComponent(punzipstr);
  const restored = pako.inflate(punzipstr, { to: 'string' }); // 解 压
  return restored;
  // }
}


export function unzip(b64Data) {
  // const binaryString = pako.gzip(b64Data, { to: 'string' });

  // return binaryString;

  let strData = Base64.atob(b64Data);
  //
  // Convert binary string to character-number array
  const charData = strData.split('').map(x => x.charCodeAt(0));


  // Turn number array into byte-array
  const binData = new Uint8Array(charData);


  // // unzip
  const data = pako.inflate(binData);


  // Convert gunzipped byteArray back to ascii string:
  strData = String.fromCharCode.apply(null, new Uint16Array(data));
  return strData;
}
