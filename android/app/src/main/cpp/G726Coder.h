//
// Created by zwkj on 2018/9/28.
//

#ifndef G726CODER_H
#define G726CODER_H

#define NULL_VALUE 0

/*! Bitstream handler state */
typedef struct bitstream_state_s
{
    unsigned int bitstream;
    int residue;
} bitstream_state_t;

typedef struct g726_state_s g726_state_t;

typedef struct g726_state_s
{
    int rate;
    int bits_per_sample;
    int yl;
    short yu;
    short dms;
    short dml;
    short ap;
    short a[2];
    short b[6];
    short pk[2];
    short dq[6];
    short sr[2];
    int td;
    bitstream_state_t bs;
} g726_state_t;

void initG726State(int bitCount, g726_state_t *g726State);
int decodeG726(unsigned char* inData, int len, short* outData, g726_state_t *g726State);
int encodeG726(short* inData, int len, unsigned char* outData, g726_state_t *g726State);

#endif //G726CODER_H
