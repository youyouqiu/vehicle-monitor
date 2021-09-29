//
// Created by qwe on 2020/12/11.
//

#ifndef RNPROJECT_G711CODER_H
#define RNPROJECT_G711CODER_H


void decodeG711a(short* amp, unsigned char* data, int len);
void decodeG711u(short* amp, unsigned char* data, int len);

void encodeG711a(unsigned char* g711_data, short* amp, int len);
void encodeG711u(unsigned char* g711_data, short* amp, int len);

#endif //RNPROJECT_G711CODER_H
