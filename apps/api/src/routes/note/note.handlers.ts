import type { Note } from "@repo/db";

import { db } from "@/lib/db";
import { decryptContent, encryptContent } from "@/lib/encryption";
import type { AppRouteHandler, EncryptedNote } from "@/lib/types";
import { getFolderForUser } from "@/queries/folder-queries";
import {
  generateUniqueNoteTitle,
  getNoteForUser,
} from "@/queries/note-queries";
import type {
  CopyNoteRoute,
  DeleteNoteRoute,
  GetSingleNoteRoute,
  MoveNoteRoute,
  ToggleNoteFavoriteRoute,
  UpdateNoteRoute,
} from "@/routes/note/note.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { CreateNoteRoute, GetAllNotesRoute } from "./note.routes";

const normalizeTags = (tags: string[] | undefined): string[] => {
  if (!tags) return [];
  // Remove empty strings and duplicates
  return Array.from(new Set(tags.filter((tag) => tag.trim().length > 0)));
};

export const getAllNotes: AppRouteHandler<GetAllNotesRoute> = async (c) => {
  try {
    const notes = await db.note.findMany();

    return c.json(
      successResponse(notes, "All notes retrieved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error retrieving notes:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve notes"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const createNote: AppRouteHandler<CreateNoteRoute> = async (c) => {
  const user = c.get("user");
  const noteData = c.req.valid("json");

  try {
    const folder = await getFolderForUser(noteData.folderId, user.id);

    if (!folder) {
      return c.json(
        errorResponse("NOT_FOUND", "Folder not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const uniqueTitle = await generateUniqueNoteTitle(
      noteData.title || "untitled",
      user.id,
      noteData.folderId,
    );

    let encryptedData: EncryptedNote = {
      contentEncrypted: "",
      contentIv: "",
      contentTag: "",
    };

    if (noteData.content) {
      const { encrypted, iv, tag } = encryptContent(noteData.content);
      encryptedData = {
        contentEncrypted: encrypted,
        contentIv: iv,
        contentTag: tag,
      };
    }

    const { content: _, ...rest } = noteData;

    const payload = {
      ...rest,
      ...encryptedData,
      userId: user.id,
      title: uniqueTitle,
      tags: normalizeTags(noteData.tags),
    };

    const newNote = await db.note.create({ data: payload });

    return c.json(
      successResponse(newNote, "Note created successfully"),
      HttpStatusCodes.CREATED,
    );
  } catch (error) {
    console.error("Error creating note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to create note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const getSingleNote: AppRouteHandler<GetSingleNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  try {
    const note = await getNoteForUser(id, user.id);

    if (!note) {
      return c.json(
        errorResponse("NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const decryptedNote: Omit<
      Note,
      "contentEncrypted" | "contentIv" | "contentTag"
    > & { content: string } = {
      id: note.id,
      title: note.title,
      content: "",
      folderId: note.folderId,
      userId: note.userId,
      isFavorite: note.isFavorite,
      tags: note.tags,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };

    if (note.contentEncrypted && note.contentIv && note.contentTag) {
      decryptedNote.content = decryptContent(
        note.contentEncrypted,
        note.contentIv,
        note.contentTag,
      );
    }

    return c.json(
      successResponse(decryptedNote, "Note retrieved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error retrieving note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to retrieve note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const copyNote: AppRouteHandler<CopyNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  try {
    const noteToBeCopied = await getNoteForUser(id, user.id);

    // Check if the note exists
    if (!noteToBeCopied) {
      return c.json(
        errorResponse("NOTE_NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const uniqueTitle = await generateUniqueNoteTitle(
      noteToBeCopied.title || "untitled",
      user.id,
      noteToBeCopied.folderId,
    );

    // Decrypt the content of the original note
    const decryptedContent = noteToBeCopied.contentEncrypted
      ? decryptContent(
          noteToBeCopied.contentEncrypted,
          noteToBeCopied.contentIv,
          noteToBeCopied.contentTag,
        )
      : "";

    // Encrypt the content for the new note
    const { encrypted, iv, tag } = encryptContent(decryptedContent);

    const payload = {
      title: uniqueTitle,
      contentEncrypted: encrypted,
      contentIv: iv,
      contentTag: tag,
      userId: user.id,
      folderId: noteToBeCopied.folderId,
      isFavorite: false,
      tags: normalizeTags(noteToBeCopied.tags),
    };

    const copiedNote = await db.note.create({ data: payload });

    return c.json(
      successResponse(copiedNote, "Note copied successfully"),
      HttpStatusCodes.CREATED,
    );
  } catch (error) {
    console.error("Error copying note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to copy note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const toggleNoteFavorite: AppRouteHandler<
  ToggleNoteFavoriteRoute
> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { favorite } = c.req.valid("json");

  try {
    const note = await getNoteForUser(id, user.id);

    if (!note) {
      return c.json(
        errorResponse("NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const updatedNote = await db.note.update({
      data: { isFavorite: favorite },
      where: { id },
    });

    return c.json(
      successResponse(updatedNote, "Note favorite state updated successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error updating note favorite state:", error);
    return c.json(
      errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to update note favorite state",
      ),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const moveNote: AppRouteHandler<MoveNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { folderId } = c.req.valid("json");

  try {
    const note = await getNoteForUser(id, user.id);

    if (!note) {
      return c.json(
        errorResponse("NOTE_NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    if (folderId === note.folderId) {
      return c.json(
        successResponse(note, "Note moved successfully"),
        HttpStatusCodes.OK,
      );
    }

    const folder = await getFolderForUser(folderId, user.id);
    if (!folder) {
      return c.json(
        errorResponse("FOLDER_NOT_FOUND", "Folder not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const uniqueTitle = await generateUniqueNoteTitle(
      note.title,
      user.id,
      folderId,
    );

    const updatedNote = await db.note.update({
      data: { folderId, title: uniqueTitle },
      where: { id },
    });

    return c.json(
      successResponse(updatedNote, "Note moved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error moving note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to move note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const updateNote: AppRouteHandler<UpdateNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const noteData = c.req.valid("json");

  try {
    const note = await getNoteForUser(id, user.id);

    if (!note) {
      return c.json(
        errorResponse("NOTE_NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const folderId = noteData.folderId ?? note.folderId;
    const title = noteData.title ?? note.title;
    const isFavorite = noteData.isFavorite ?? note.isFavorite;
    const tags = normalizeTags(noteData.tags ?? note.tags);

    if (folderId !== note.folderId) {
      const folder = await getFolderForUser(folderId, user.id);
      if (!folder) {
        return c.json(
          errorResponse("FOLDER_NOT_FOUND", "Folder not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }
    }

    let encryptedData: EncryptedNote = {
      contentEncrypted: "",
      contentIv: "",
      contentTag: "",
    };

    if (noteData.content) {
      const { encrypted, iv, tag } = encryptContent(noteData.content);
      encryptedData = {
        contentEncrypted: encrypted,
        contentIv: iv,
        contentTag: tag,
      };
    }

    let newTitle = title;
    if (folderId !== note.folderId || title !== note.title) {
      newTitle = await generateUniqueNoteTitle(title, user.id, folderId);
    }

    const updatedNote = await db.note.update({
      data: {
        ...noteData,
        ...encryptedData,
        folderId,
        title: newTitle,
        isFavorite,
        tags,
      },
      where: { id },
    });

    const decryptedUpdatedNote: Omit<
      Note,
      "contentEncrypted" | "contentIv" | "contentTag"
    > & { content: string } = {
      id: updatedNote.id,
      title: updatedNote.title,
      content: "",
      folderId: updatedNote.folderId,
      userId: updatedNote.userId,
      isFavorite: updatedNote.isFavorite,
      tags: updatedNote.tags,
      createdAt: updatedNote.createdAt,
      updatedAt: updatedNote.updatedAt,
    };

    decryptedUpdatedNote.content = noteData.content || "";

    return c.json(
      successResponse(decryptedUpdatedNote, "Note updated successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error updating note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to update note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const deleteNote: AppRouteHandler<DeleteNoteRoute> = async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  try {
    const note = await getNoteForUser(id, user.id);

    if (!note) {
      return c.json(
        errorResponse("NOTE_NOT_FOUND", "Note not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    await db.note.delete({ where: { id } });

    return c.json(
      successResponse(note, "Note deleted successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    console.error("Error deleting note:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete note"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
