import { Router } from "express";
import { asyncRoute } from "../utils/asyncRoute.utils.js";
import { z } from 'zod';
import { db } from "../db.js";
import { ApiError } from "../middleware/error-handler.js";
import { ReminderStatus } from "../models-status.js";
import { parseId } from "../helpers/parseId.helpers.js";
import { validate } from "../middleware/validate.js";

const apiRouter = Router();

const reminderStatusSchema = z.object({
    body: z.object({
      status: z.nativeEnum(ReminderStatus),
    })
});

const reminderUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    category: z.string().min(1),
    description: z.string().min(1),
    dueDate: z.string().datetime(),
  })
});

apiRouter.patch(
  '/:reminderId/status',
  validate(reminderStatusSchema),
  asyncRoute(async (request, response) => {
    const reminderId = parseId(request.params.reminderId, 'reminderId');
    const payload = request.body//reminderStatusSchema.parse(request.body);

    const reminder = await db.propertyReminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      throw new ApiError(404, 'Reminder not found');
    }

    const updatedReminder = await db.propertyReminder.update({
      where: { id: reminderId },
      data: {
        status: payload.status,
        completedAt: payload.status === ReminderStatus.DONE ? new Date() : null,
      },
    });

    response.json(updatedReminder);
  }),
);


apiRouter.patch(
  '/:reminderId',
  validate(reminderUpdateSchema),
  asyncRoute(async (request, response) => {
    const reminderId = parseId(request.params.reminderId, 'reminderId');
    const payload = request.body//reminderUpdateSchema.parse(request.body);

    const reminder = await db.propertyReminder.findUnique({ where: { id: reminderId } });
    if (!reminder) {
      throw new ApiError(404, 'Reminder not found');
    }

    const updatedReminder = await db.propertyReminder.update({
      where: { id: reminderId },
      data: {
        title: payload.title,
        category: payload.category,
        description: payload.description,
        dueDate: new Date(payload.dueDate),
      },
    });

    response.json(updatedReminder);
  }),
);


export default apiRouter;