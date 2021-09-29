
#ifndef ADPCMCODER_H
#define ADPCMCODER_H

typedef struct adpcm_state_t {
    short valPrev;
    char index;
} adpcm_state;

void adpcm_decode(char* inData, short* outData, int len, adpcm_state *state);

#endif //ADPCMCODER_H
