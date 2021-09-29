//
// Created by qwe on 2020/5/21.
//

#include <sys/socket.h>
#include <sys/select.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include "MediaStreamServer.h"

#define logd(...) LogMessageA(0, _task.key.c_str(), _task.channel, __VA_ARGS__)
#define logi(...) LogMessageA(1, _task.key.c_str(), _task.channel, __VA_ARGS__)
#define logw(...) LogMessageA(2, _task.key.c_str(), _task.channel, __VA_ARGS__)
#define loge(...) LogMessageA(3, _task.key.c_str(), _task.channel, __VA_ARGS__)

MediaStreamServer::MediaStreamServer()
{
}

MediaStreamServer::~MediaStreamServer()
{
    logd("~MediaStreamServer");
    StopTask();
}


int MediaStreamServer::initConnection(const char* ip, int port, bool async)
{
//    auto& task = _task;
    logi("Connect server->%s:%d", ip, port);
    int servSock = socket(PF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (servSock == -1)
    {
        loge("failed to socket, errno=%d", errno);
        return -1;
    }
    do
    {
        sockaddr_in sockAddr;
        memset(&sockAddr, 0, sizeof(sockAddr));  //每个字节都用0填充
        sockAddr.sin_family = PF_INET;  //使用IPv4地址
        sockAddr.sin_addr.s_addr = inet_addr(ip);  //具体的IP地址
        sockAddr.sin_port = htons(port);  //端口
        auto iret = ::connect(servSock, (sockaddr*)&sockAddr, sizeof(sockaddr));
        if (iret != 0)
        {
            loge("Failed to connect server, errno=%d", errno);
            break;
        }
        int flags = fcntl(servSock, F_GETFL, 0);
        if (flags == -1)
        {
            loge("Failed to F_GETFL");
            break;
        }
        if (async) {
            flags = fcntl(servSock, F_SETFL, flags | O_NONBLOCK);
            if (flags == -1)
            {
                loge("Failed to F_SETFL(O_NONBLOCK)");
                break;
            }
        }
        logi("Successfully connected to server:%d", servSock);
        return servSock;
    } while (false);
    ::close(servSock);
    return -1;
}

void MediaStreamServer::initTestFile(){
#if CACHE_STREAM
    auto output = _task.cacheDir + "/1_"+std::to_string(_task.channel)+".bin";
    auto output2 = _task.cacheDir + "/2_"+std::to_string(_task.channel)+".bin";
    _cacheTestStream.open(output, std::ios::binary | std::ios::trunc);
    _cacheTestStream2.open(output2, std::ios::binary | std::ios::trunc);
    _cacheTestFile = output;
    logd(("Open cache file:"+output).c_str());
#endif
}

bool MediaStreamServer::SetupTask(const TaskInfoPar& info)
{
    logd(("cache:"+info.cacheDir).c_str());
    _task = info;

    int sock = initConnection(info.ip.c_str(), info.port, true);
    if (sock < 0)
    {
        return false;
    }

    initTestFile();
    
    _task.socket = sock;
    _running = true;
    _abort = false;
    std::thread(&MediaStreamServer::RunInner, this).detach();
    return true;
}
void MediaStreamServer::StopTask()
{
    logd("MediaStreamServer::StopTask.");
    if (_running && !_abort) {
        _abort = true;
    }
}
void MediaStreamServer::freeSocket()
{
    if (_task.socket) {
//        _task.cb = nullptr;
        close(_task.socket);
        _task.socket = 0;
    }
    if (_cacheTestStream.is_open()){
        _cacheTestStream.close();
        logd(("Close cache file:"+_cacheTestFile).c_str());
    }
    if (_cacheTestStream2.is_open()){
        _cacheTestStream2.close();
    }
}

bool MediaStreamServer::sendHead(int sock, std::string key)
{
    auto strJson = std::string() + "{\"url\": \"/"+key+"\"}";

    uint32_t jsonSize = (uint32_t)strJson.size();
    jsonSize = swapBigEndian_u32(jsonSize);

    std::vector<uint8_t> sendData(strJson.size() + sizeof(jsonSize));

    memcpy(sendData.data(), &jsonSize, sizeof(jsonSize));
    memcpy(sendData.data() + sizeof(jsonSize), strJson.data(), strJson.size());

    int iret = (int)send(sock, sendData.data(), sendData.size(), 0);
  logd("send head: datasize = %d, iret=%d, content=%s", sendData.size(), iret, strJson.c_str());
    return iret == sendData.size();
}

bool MediaStreamServer::Running()
{
    return _running;
}

void MediaStreamServer::Send(const uint8_t* data, int dataLen)
{
    if (_task.socket>0){
        dataLen = (int)strlen((const char*)data);
        uint32_t jsonSize = dataLen;
        jsonSize = swapBigEndian_u32(jsonSize);

        std::vector<uint8_t> sendData(dataLen + sizeof(jsonSize));

        memcpy(sendData.data(), &jsonSize, sizeof(jsonSize));
        memcpy(sendData.data() + sizeof(jsonSize), data, dataLen);

        auto iret = (int)send(_task.socket, sendData.data(), sendData.size(), 0);
        if(iret != sendData.size()){
            loge("send:%ld/%d ,socket=%d,error=%d",iret,sendData.size(),_task.socket,errno);
        }
    }
}

void MediaStreamServer::LogTasks()
{
    std::chrono::system_clock::time_point now = std::chrono::system_clock::now();
    auto off = std::chrono::duration_cast<std::chrono::seconds>(now - _lastLogTime);
//    logd("the off=%d",off.count());
    if (off.count()>10) {
        std::stringstream ss;
        ss<<"Stream buffer "<<_task.bufferInfoRead.dataLength<<"/"<<_task.bufferInfoRead.buffer.size() <<"; bufferState "
          << _task.bufferState<<"; ";
        _task.showResult = _task.bufferInfoRead.dataLength>=BUFFER_READ_SIZE_MAX/3;
        logd(ss.str().c_str());
        _lastLogTime = now;
    }
}

void MediaStreamServer::RunInner()
{
    int readResult = 0;
    while(!_abort)
    {
        if (_task.socket <= 0) {
            break;
        }

        if (_task.bufferInfoRead.buffer.size() - _task.bufferInfoRead.dataLength < BUFFER_READ_SIZE_STEP)
        {
            _task.bufferInfoRead.buffer.resize(_task.bufferInfoRead.dataLength + BUFFER_READ_SIZE_STEP);
        }
        if (_task.bufferInfoRead.dataLength > BUFFER_READ_SIZE_MAX)
        {
//            logw("Read buffer full");
            _task.bufferState = 1;
            OnData();
            usleep(1000);
        } else {
            _task.bufferState = 0;
            void* ptr = _task.bufferInfoRead.buffer.data() + _task.bufferInfoRead.dataLength;
            auto buflen = _task.bufferInfoRead.buffer.size() - _task.bufferInfoRead.dataLength;
            readResult = (int)recv(_task.socket, ptr, buflen, 0);
//            logd("readResult=%d",readResult);
            if (readResult>0) {
                if (_cacheTestStream.is_open()){
//                    logd("_cacheTestStream.write 1");
                    _cacheTestStream.write((const char*)ptr, readResult);
                    _cacheTestStream.flush();
//                    logd("_cacheTestStream.write 2");
                }
                _task.bufferInfoRead.dataLength += readResult;
                OnData();
            } else {
                if (readResult==0 || !(readResult == -1 && (errno == EAGAIN || errno == EINTR)))
                {
                    loge("recv result=%d, errno=%d", readResult,errno);
                    break;
                }
                usleep(1000);
            }
        }
        if (_clean){
            _task.bufferInfoRead.dataLength = 0;
            _clean = false;
        }
    }
    freeSocket();
    _abort = false;
    _running = false;
    logd("MediaStreamServer::RunInner over.");
}
void MediaStreamServer::Clean()
{
    _clean=true;
}

void MediaStreamServer::OnData()
{
//    logd("OnData 1");
    int offset = 0;
    while (_task.bufferInfoRead.buffer.size()>=_task.bufferInfoRead.dataLength&& _task.bufferInfoRead.dataLength - offset > 100)
    {
        uint8_t* pdata = _task.bufferInfoRead.buffer.data() + offset;
        int pdataLen = _task.bufferInfoRead.dataLength - offset;
        int rtpHeadIndex = -1;
        int i=0;
        int maxPackageSize = 2000000;
        for (; i < pdataLen-15; ++i) {
            if (pdata[i] == zwkj_Client_Head[0] && pdata[i+1] == zwkj_Client_Head[1] && pdata[i+2] == zwkj_Client_Head[2] && pdata[i+3] == zwkj_Client_Head[3]
            &&
            pdata[i+8] == 0x30 && pdata[i+9] == 0x31 && pdata[i+10] == 0x63 && pdata[i+11] == 0x64){
                // rtp 包
                auto pckType = pdata[i+8+15] & 0xf;
                if (pckType == 0 || pckType == 1){
                    // 原子包&第一包
                    rtpHeadIndex = i;
                    break;
                }
            }
        }
        if (rtpHeadIndex == -1){
            offset+=i;
            logw("fail find package data",rtpHeadIndex);
            continue;
        } else {
            if (rtpHeadIndex!=0){
                logw(("error package:"+std::to_string(_task.bufferInfoRead.freeLengthAll)+" + "+std::to_string(offset)).c_str());
            }
            offset+=rtpHeadIndex;
        }
        uint32_t packageSizetmp = *((uint32_t*)(_task.bufferInfoRead.buffer.data() + offset + 4));
        uint32_t packageSize = swapBigEndian_u32(packageSizetmp);

        if (packageSize>=maxPackageSize){
            logw("error packageSize：%d",packageSize);
            offset+=4;
            continue;
        }

//        logd("_task.bufferInfoRead.dataLength=%d, offset=%d,packageSize=%d",_task.bufferInfoRead.dataLength,offset,packageSize);
//        logd("netxt=%d",packageSize+4 <= _task.bufferInfoRead.dataLength-offset);
        if (packageSize+12 <= _task.bufferInfoRead.dataLength - offset)
        {
            uint8_t* packageTail = _task.bufferInfoRead.buffer.data() + offset + 4 + 4 + packageSize;
            if (packageTail[0]!=zwkj_Client_Tail[0] || packageTail[1]!=zwkj_Client_Tail[1] || packageTail[2]!=zwkj_Client_Tail[2] || packageTail[3]!=zwkj_Client_Tail[3]){
                logw(("error tail:freeAll="+std::to_string(_task.bufferInfoRead.freeLengthAll)
                +" + offset="+std::to_string(offset)
                +",packageSize="+std::to_string(packageSize)
                +",tail=%02X %02X %02X %02X").c_str(), packageTail[0], packageTail[1], packageTail[2], packageTail[3]);
                offset+=4;
                continue;
            }


            _testPackageIndex++;
            int iret = 0;
            if (_task.cb)
            {
                iret=1;
//                logd("_task.cb 1");
                iret = _task.cb(_task.bufferInfoRead.buffer.data() + offset + 8, packageSize, _task.cbdata);
//                logd("_task.cb=%d",iret);
            }
//            logd("_task.cb 2 iret=%d",iret);
            if (iret==0)
            {
                // 没处理，则阻塞着
                if (_task.showResult) {
                    logw("_task.cb iret=%d offset=%d", iret, offset);
                }
                break;
            }
//            logd("_task.cb 3");
            if (iret<0)
            {
                logd("_task.cb iret=%d",iret);
                StopTask();
                break;
            }
            if (_cacheTestStream2.is_open()){
                _cacheTestStream2.write(
                        reinterpret_cast<const char *>(_task.bufferInfoRead.buffer.data() + offset), packageSize + 12);
                _cacheTestStream2.flush();
            }
//            logd("_task.cb 4");
            // 处理了，不管是否处理完都跳过这一个包，自定义内部通讯协议一个包就是一帧,包头4字节，包大小4字节,包尾4字节
            offset+=packageSize+12;
        }
        else
        {
            if (_task.showResult) {
                logd("ondata %d : %ld | %ld", _testPackageIndex, packageSize, packageSizetmp);
                logd("packageSize=%d,dataLength=%d",packageSize,_task.bufferInfoRead.dataLength);
            }
            break;
        }
    }
    auto ptr = _task.bufferInfoRead.buffer.data();
//    logd(("OnData dataLength=%d offset=%d 8buf=%02X%02X%02X%02X%02X%02X%02X%02X , freeall="+std::to_string(_task.bufferInfoRead.freeLengthAll)).c_str(), _task.bufferInfoRead.dataLength, offset,
//         ptr[0],ptr[1],ptr[2],ptr[3],ptr[4],ptr[5],ptr[6],ptr[7]);


    _task.bufferInfoRead.dataLength -= offset;
    _task.bufferInfoRead.freeLengthAll += offset;
    if (_task.bufferInfoRead.dataLength>0)
    {
        if (offset > 0) {
            memcpy(_task.bufferInfoRead.buffer.data(), _task.bufferInfoRead.buffer.data() + offset, _task.bufferInfoRead.dataLength);
        }
    }
    else
    {
        _task.bufferInfoRead.dataLength = 0;
    }

    LogTasks();
}
