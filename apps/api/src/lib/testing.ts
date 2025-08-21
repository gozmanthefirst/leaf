import db, { and, eq, sql } from "@repo/database";
import { folders, notes } from "@repo/database/schemas/notes-schema";

const _getAllUserItems = async (userId: string) => {
  const result = await db.execute(sql`
    WITH RECURSIVE folder_tree AS (
      -- Base case: get the root folder
      SELECT id, name, parent_folder_id, is_root, user_id, 0 as depth
      FROM folders 
      WHERE user_id = ${userId} AND is_root = true
      
      UNION ALL
      
      -- Recursive case: get child folders
      SELECT f.id, f.name, f.parent_folder_id, f.is_root, f.user_id, ft.depth + 1
      FROM folders f
      INNER JOIN folder_tree ft ON f.parent_folder_id = ft.id
      WHERE f.is_root = false
    ),
    all_notes AS (
      -- Get all notes in any of the folders from the tree
      SELECT n.id, n.title, n.content, n.folder_id, n.user_id
      FROM notes n
      INNER JOIN folder_tree ft ON n.folder_id = ft.id
    )
    SELECT 
      'folder' as type,
      ft.id,
      ft.name as title,
      null as content,
      ft.parent_folder_id as parent_id,
      ft.depth
    FROM folder_tree ft
    
    UNION ALL
    
    SELECT 
      'note' as type,
      an.id,
      an.title,
      an.content,
      an.folder_id as parent_id,
      null as depth
    FROM all_notes an
    
    ORDER BY type, title
  `);

  return result.rows;
};

const _getAllUserItemsRecursive = async (userId: string) => {
  // First, get the root folder
  const rootFolder = await db
    .select()
    .from(folders)
    .where(and(eq(folders.userId, userId), eq(folders.isRoot, true)))
    .limit(1);

  if (!rootFolder.length) {
    throw new Error("Root folder not found");
  }

  const allItems: Array<{
    type: "folder" | "note";
    id: string;
    title: string;
    content?: string;
    parentId: string;
    depth: number;
  }> = [];

  // Recursive function to get all items in a folder
  async function getItemsInFolder(folderId: string, depth: number = 0) {
    // Get all subfolders
    const subfolders = await db
      .select()
      .from(folders)
      .where(
        and(eq(folders.parentFolderId, folderId), eq(folders.isRoot, false)),
      );

    // Get all notes in this folder
    const notesInFolder = await db
      .select()
      .from(notes)
      .where(eq(notes.folderId, folderId));

    // Add current folder's notes to results
    for (const note of notesInFolder) {
      allItems.push({
        type: "note",
        id: note.id,
        title: note.title,
        content: note.content,
        parentId: folderId,
        depth: depth + 1,
      });
    }

    // Add subfolders and recursively get their contents
    for (const folder of subfolders) {
      allItems.push({
        type: "folder",
        id: folder.id,
        title: folder.name,
        parentId: folderId,
        depth: depth + 1,
      });

      // Recursively get items in this subfolder
      await getItemsInFolder(folder.id, depth + 1);
    }
  }

  // Start with root folder
  allItems.push({
    type: "folder",
    id: rootFolder[0].id,
    title: rootFolder[0].name,
    parentId: rootFolder[0].id, // Root points to itself
    depth: 0,
  });

  // Get all items starting from root
  await getItemsInFolder(rootFolder[0].id);

  return allItems;
};
