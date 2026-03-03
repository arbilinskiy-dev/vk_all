// Типы данных для эмодзи

export type EmojiData = {
  char: string;
  name: string;
  keywords: string[];
};

export type EmojiCategory = {
  name: string;
  icon: string;
  emojis: EmojiData[];
};
