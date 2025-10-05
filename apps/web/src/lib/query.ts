export const queryKeys = {
  user: () => ["user"] as const,
  folder: (id: string) => ["folder", id],
  note: (id: string) => ["note", id] as const,
};
