import { UserFacingError } from '$lib/server/errors';

export type PastedSong = {
  title: string;
  artist: string;
};

const maxPastedSongCount = 5000;
const unknownArtist = '未知';

// 常见粘贴格式的列分隔符，按优先级尝试。
const columnSeparators = [/\t/, /\s+-\s+/, /\s+–\s+/, /\s+—\s+/, /－/, /\|/];

const parseLine = (line: string): PastedSong => {
  for (const separator of columnSeparators) {
    if (!separator.test(line)) {
      continue;
    }

    const [rawTitle, ...rest] = line.split(separator);
    const title = rawTitle.trim();
    const artist = rest.join(' ').trim();

    if (title) {
      return { title, artist: artist || unknownArtist };
    }
  }

  return { title: line.trim(), artist: unknownArtist };
};

/**
 * 解析粘贴进来的歌单文本：一行一首，列之间支持制表符、` - `、`–`、`—`、`－`、`|`。
 * 没有分隔符时整行当歌名，原唱记为「未知」。`#` 开头的行视为注释。
 */
export const parsePastedSongs = (input: string): PastedSong[] => {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  if (lines.length === 0) {
    throw new UserFacingError('没有读到歌曲。请每行填写一首，格式如「歌名 - 原唱」。');
  }

  if (lines.length > maxPastedSongCount) {
    throw new UserFacingError(`单次最多导入 ${maxPastedSongCount} 首歌曲。`);
  }

  const songs = lines.map(parseLine).filter((song) => song.title.length > 0);

  if (songs.length === 0) {
    throw new UserFacingError('没有读到有效的歌曲。请检查内容格式。');
  }

  return songs;
};
