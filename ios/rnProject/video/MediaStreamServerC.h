//
// Created by qwe on 2020/7/10.
//

#ifndef RNPROJECT_MEDIASTREAMSERVERC_H
#define RNPROJECT_MEDIASTREAMSERVERC_H

typedef int (*OnDataBlock)(const uint8_t* buffer, int bufferLength, void* data);

void* initServer(const char* uri, int channel, OnDataBlock block, void* blockData);
void stopServer(void*);
void freeServer(void**);

bool runServer(void*);
bool checkServerRunning(void*);
void sendHeartbeat(void*);
void sendRtpMessage(void* ptr,const char* data, int len);
void cleanBuffer(void* ptr);

#endif //RNPROJECT_MEDIASTREAMSERVERC_H
