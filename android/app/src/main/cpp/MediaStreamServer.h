//
// Created by qwe on 2020/5/21.
//

#ifndef ANDROIDDEMO_MEDIASTREAMSERVER_H
#define ANDROIDDEMO_MEDIASTREAMSERVER_H

#include "CommonPublic.h"
#include <fstream>

//#define CACHE_STREAM 1
#define BUFFER_READ_SIZE_MAX    1024000
#define BUFFER_READ_SIZE_STEP   8192

const uint8_t zwkj_Client_Head[4] = { 0x7a, 0x77, 0x6b, 0x6a};  // 'zwkj'
const uint8_t zwkj_Client_Tail[4] = { 0x61, 0x70, 0x70, 0x31};  // 'app1'

struct DataBufferInfo
{
    std::vector<uint8_t> buffer;
    int dataLength = 0;
    int64_t freeLengthAll = 0;
};

struct TaskInfoPar
{
    std::string ip = "";
    int port = 0;
    std::string key = "";
    int channel = 0;
    std::function<int(const uint8_t* buffer, int bufferLengh, void*data)> cb = nullptr;
    void* cbdata = nullptr;
    std::string cacheDir = "";
};
struct TaskInfo:public TaskInfoPar
{
    DataBufferInfo bufferInfoRead;
    DataBufferInfo bufferInfoWrite;
    int socket = -1;
    int bufferState = 0;      // 1: full;  other:0
    bool showResult = false;
    TaskInfo(){

    }
    TaskInfo(const TaskInfoPar& info) {
        *this = info;
    }
    TaskInfo& operator=(const TaskInfoPar& info)
    {
        this->ip = info.ip;
        this->port = info.port;
        this->key = info.key;

        this->channel = info.channel;
        this->cb = info.cb;
        this->cbdata = info.cbdata;
        this->cacheDir = info.cacheDir;
        return *this;
    }
};

class MediaStreamServer {
private:
    int _testPackageIndex = 0;
    TaskInfo _task;
    std::chrono::system_clock::time_point _lastLogTime;
    bool _running = false;
    bool _abort = false;
    bool _clean = false;
    std::ofstream _cacheTestStream;
    std::ofstream _cacheTestStream2;
    std::string _cacheTestFile;

    bool sendHead(int sock, std::string key);
    int initConnection(const char* ip, int port, bool async=true);

    void RunInner();
    void OnData();

    void LogTasks();
    void freeSocket();

    void initTestFile();
public:
    MediaStreamServer();
    ~MediaStreamServer();

    bool SetupTask(const TaskInfoPar& info);
    void StopTask();
    bool Running();
    void Send(const uint8_t* data, int dataLen);
    void Clean();
};


#endif //ANDROIDDEMO_MEDIASTREAMSERVER_H
