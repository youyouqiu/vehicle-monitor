//
//  AdpcmCoder.h
//  VideoEx1
//
//  Created by 改革丰富 on 2018/9/29.
//  Copyright © 2018年 zwlbs. All rights reserved.
//

#ifndef AdpcmCoder_h
#define AdpcmCoder_h

typedef struct adpcm_state_t {
    short valprev;
    char index;
} adpcm_state;

void initAdpcmState(char* data, adpcm_state* adpcmState);

void adpcm_decode(char* inData, short* outData, int len, adpcm_state *state);

#endif /* AdpcmCoder_h */
