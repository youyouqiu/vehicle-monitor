//
// Created by qwe on 2020/7/10.
//

#include "MediaStreamServer.h"
extern "C"{
#include "MediaStreamServerC.h"
}

typedef struct MediaStreamServerC{
    TaskInfoPar task;
    std::shared_ptr<MediaStreamServer> streamServer;
}MediaStreamServerC;


bool initTaskInfo(TaskInfoPar& task, const char* cstrUri)
{
    std::string uri = cstrUri;
    // "ws://58.87.111.217:7971/4ae969bb-b90f-4a65-9d6a-99dd85a5367f"
    task.ip = "";
    task.port = 0;
    task.key = "";
    do
    {
        std::string strPip = "ws://";
        std::string strPport = ":";
        std::string strPkey = "/";
        auto pip = uri.find(strPip);
        if (pip == uri.npos)
        {
            break;
        }
        auto pport = uri.find(strPport, pip+strPip.size());
        if (pport == uri.npos)
        {
            break;
        }
        auto pkey = uri.find(strPkey, pport+strPport.size());
        if (pkey == uri.npos)
        {
            break;
        }
        task.ip = uri.substr(pip+strPip.size(),pport-pip-strPip.size());
        task.port = atoi(uri.substr(pport+strPport.size(),pkey-pport-strPport.size()).c_str());
        task.key = uri.substr(pkey+strPkey.size());
      if (task.ip.size()>0&&task.port>0&&task.key.size()>0) {
        return true;
      }
    }while(false);
  return false;
}
void* initServer(const char* uri, int channel, OnDataBlock block, void* blockData) {
  MediaStreamServerC* ptr = new MediaStreamServerC();
  auto bret = initTaskInfo(ptr->task, uri);
  if (!bret) {
    delete ptr;
    return nullptr;
  }
  ptr->task.channel = channel;
  ptr->task.cbdata = blockData;
  ptr->task.cb = [block](const uint8_t* buffer, int bufferLength, void* data) {
      int iret = 1;
      if (block) {
          iret = block(buffer, bufferLength, data);
      }
      return iret;

  };
  ptr->streamServer = std::make_shared<MediaStreamServer>();
  return ptr;
}
void stopServer(void* ptr){
    if (ptr) {
        MediaStreamServerC* pServerC = (MediaStreamServerC*)ptr;
        if (pServerC->streamServer && pServerC->streamServer->Running()) {
            pServerC->streamServer->StopTask();
        }
    }
}
void freeServer(void** ptr) {
    if (ptr && *ptr) {
        MediaStreamServerC* pServerC = (MediaStreamServerC*)*ptr;
        *ptr = nullptr;
        if (pServerC->streamServer && pServerC->streamServer->Running()) {
            pServerC->streamServer->StopTask();
        }
        delete pServerC;
    }
}

bool checkServerRunning(void* ptr) {
    if (ptr) {
        MediaStreamServerC* pServerC = (MediaStreamServerC*)ptr;
        return pServerC->streamServer->Running();
    } else {
        return false;
    }
}
bool runServer(void* ptr) {
    if (ptr) {
        MediaStreamServerC* pServerC = (MediaStreamServerC*)ptr;
        return pServerC->streamServer->SetupTask(pServerC->task);
    } else {
        return false;
    }
}
void sendHeartbeat(void* ptr){
    if (ptr) {
        MediaStreamServerC* pServerC = (MediaStreamServerC*)ptr;
        pServerC->streamServer->Send((const uint8_t*)"0", 1);
    }
}
void sendRtpMessage(void* ptr,const char* data, int len){
    if (ptr) {
        MediaStreamServerC* pServerC = (MediaStreamServerC*)ptr;
        pServerC->streamServer->Send((const uint8_t*)data, len);
    }
}

void cleanBuffer(void* ptr){
    if (ptr) {
        MediaStreamServerC* pServerC = (MediaStreamServerC*)ptr;
        pServerC->streamServer->Clean();
    }
}