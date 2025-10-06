export const queryKeys = {
  user: () => ["user"] as const,
  folder: (id: string) => ["folder", id] as const,
  foldersInFolder: () => ["foldersInFolder"] as const,
  note: (id: string) => ["note", id] as const,
};
