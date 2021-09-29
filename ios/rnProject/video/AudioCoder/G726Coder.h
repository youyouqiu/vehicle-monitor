//
//  G726Coder.h
//  VideoEx1
//
//  Created by 改革丰富 on 2018/10/18.
//  Copyright © 2018年 zwlbs. All rights reserved.
//

#ifndef G726Coder_h
#define G726Coder_h

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

void initG726State(int bitCount, g726_state_t *g726_state);

int decodeG726(unsigned char* inData, int len, short* outData, g726_state_t *state);

int encodeG726(short* inData, int len, unsigned char* outData, g726_state_t *state);

#endif /* G726Coder_h */
