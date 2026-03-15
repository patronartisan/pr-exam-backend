import { Router } from "express";
import { asyncRoute } from "../utils/asyncRoute.utils.js";
import { z } from 'zod';
import { db } from "../db.js";
import { ApiError } from "../middleware/error-handler.js";
import { NoteStatus } from "../models-status.js";
import { parseId } from "../helpers/parseId.helpers.js";
import { validate } from "../middleware/validate.js";

const apiRouter = Router();

// Schemas
const noteStatusSchema = z.object({
    body: z.object({
      status: z.nativeEnum(NoteStatus),
    }),
});

const noteUpdateSchema = z.object({
    body: z.object({
      title: z.string().min(1),
      category: z.string().min(1),
      body: z.string().min(1),
    }),
});


// Route handlers
apiRouter.patch(
  '/:noteId/status',
  validate(noteStatusSchema),
  asyncRoute(async (request, response) => {
    const noteId = parseId(request.params.noteId, 'noteId');
    const payload = request.body//noteStatusSchema.parse(request.body);

    const note = await db.propertyNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new ApiError(404, 'Note not found');
    }

    const updatedNote = await db.propertyNote.update({
      where: { id: noteId },
      data: { status: payload.status },
    });

    response.json(updatedNote);
  }),
);

apiRouter.patch(
  '/:noteId',
  validate(noteUpdateSchema),
  asyncRoute(async (request, response) => {
    const noteId = parseId(request.params.noteId, 'noteId');
    const payload = request.body//noteUpdateSchema.parse(request.body);

    const note = await db.propertyNote.findUnique({ where: { id: noteId } });
    if (!note) {
      throw new ApiError(404, 'Note not found');
    }

    const updatedNote = await db.propertyNote.update({
      where: { id: noteId },
      data: { title: payload.title, category: payload.category, body: payload.body },
    });

    response.json(updatedNote);
  }),
);

export default apiRouter;