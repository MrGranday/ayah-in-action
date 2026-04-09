import { QuranClient } from '@quranjs/api';
import { qfConfig } from './qf-config';

let _client: QuranClient | null = null;

export function getQuranClient() {
  if (_client) return _client;
  _client = new QuranClient({
    clientId: qfConfig.clientId,
    clientSecret: qfConfig.clientSecret,
    authBaseUrl: qfConfig.authBaseUrl,
    contentBaseUrl: 'https://api.quran.com/api/v4' // Default for quran.com content
  });
  return _client;
}

export function getRandomChapter(): number {
  const chapters = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
  return chapters[Math.floor(Math.random() * chapters.length)];
}

export function getRandomVerse(chapterId: number, versesCount: number): number {
  return Math.floor(Math.random() * versesCount) + 1;
}
