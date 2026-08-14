import { TextEncoder, TextDecoder } from 'util';

// These must be set before any other imports
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
