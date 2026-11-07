import type { SongLanguage } from '$lib/types';

const kanaPattern = /[\u3040-\u30ff]/u;
const cjkPattern = /[\u3400-\u9fff]/gu;
const latinPattern = /[A-Za-z]/gu;

const countMatches = (value: string, pattern: RegExp) => value.match(pattern)?.length ?? 0;

export const inferSongLanguage = (title: string, artist = ''): SongLanguage => {
  const combined = `${title} ${artist}`;

  if (kanaPattern.test(combined)) {
    return '日语';
  }

  // 先只看歌名。歌手名可能是 hita、CRITTY 这类拉丁字母艺名，
  // 把歌手一起算的话，「夙 / hita」这种中文歌会被误判成英语。
  const titleCjkCount = countMatches(title, cjkPattern);
  const titleLatinCount = countMatches(title, latinPattern);

  if (titleCjkCount > 0 && titleCjkCount >= titleLatinCount) {
    return '中文';
  }

  const cjkCount = countMatches(combined, cjkPattern);
  const latinCount = countMatches(combined, latinPattern);

  if (cjkCount > 0 && cjkCount >= latinCount) {
    return '中文';
  }

  if (latinCount > 0) {
    return '英语';
  }

  return '其他';
};
