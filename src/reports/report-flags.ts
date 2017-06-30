/*
export let NODE = '.<';
export let XOR_EQUAL = '^=';*/
const enum ReportFlags {
    FLAG_01	= 1,//keyPoints
    FLAG_02	= 2,//transpiledCode
    FLAG_03	= 4,//nodesTree
    FLAG_04	= 8,//parserContent
    FLAG_05	= 16,//parserFunctions
    FLAG_06	= 32,//parserImports
    FLAG_07	= 64,//parserPoints
    FLAG_08	= 128,
    FLAG_09	= 256,
    FLAG_10	= 512,
    FLAG_11	= 1024,
    FLAG_12	= 2048,
    FLAG_13	= 4096,
    FLAG_14  = 8912,
    FLAG_15	= 16384,
    FLAG_16	= 32768,
    FLAG_17	= 65536,
    FLAG_18	= 131072,//scannerPoints
    FLAG_19	= 262144,//scannerDetails
    FLAG_20	= 524288,
    FLAG_21	= 1048576,
    FLAG_22	= 2097152,
    FLAG_23	= 4194304,//createNodes
    FLAG_24	= 8388608,
    FLAG_25	= 16777216,
    FLAG_26	= 33554432,
    FLAG_27	= 67108864,
    FLAG_28	= 134217728,
    FLAG_29	= 268435456,
    FLAG_30	= 536870912,
    FLAG_31	= 1073741824,
    FLAG_32	= 2147483648,


    TRACE_ALL = 0 | FLAG_01 | FLAG_03 | FLAG_04 | FLAG_05 | FLAG_06 | FLAG_07 | FLAG_08 | FLAG_09 | FLAG_10 | FLAG_11
}