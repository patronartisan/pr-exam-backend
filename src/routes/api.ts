import { Router, type RequestHandler } from 'express';
import { z } from 'zod';

import { db } from '../db.js';
import { ApiError } from '../middleware/error-handler.js';
import { NoteStatus, ReminderStatus } from '../models-status.js';

export const apiRouter = Router();

const agentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  mobileNumber: z.string().min(3).optional(),
});

const propertySchema = z.object({
  agentId: z.number().int().positive(),
  label: z.string().min(1),
  addressLine: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
});

const familySchema = z.object({
  familyName: z.string().min(1),
});

const tenantSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(3).optional(),
  dateOfBirth: z.string().datetime().optional(),
  moveInDate: z.string().datetime().optional(),
  moveOutDate: z.string().datetime().optional(),
});

const noteSchema = z.object({
  agentId: z.number().int().positive(),
  title: z.string().min(1),
  category: z.string().min(1),
  body: z.string().min(1),
});

const reminderSchema = z.object({
  agentId: z.number().int().positive(),
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  dueDate: z.string().datetime(),
});

const reminderStatusSchema = z.object({
  status: z.nativeEnum(ReminderStatus),
});

const noteStatusSchema = z.object({
  status: z.nativeEnum(NoteStatus),
});

const noteUpdateSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  body: z.string().min(1),
});

const reminderUpdateSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  dueDate: z.string().datetime(),
});

const parseId = (value: string, label: string) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, `${label} must be a positive integer`);
  }

  return parsed;
};

const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  async (request, response, next) => {
    try {
      await Promise.resolve(handler(request, response, next));
    } catch (error) {
      next(error);
    }
  };

// Agent routes are intentionally thin because the main complexity lives in the property workflow.
apiRouter.get(
  '/agents',
  asyncRoute(async (_request, response) => {
    const agents = await db.agent.findMany({
      include: {
        _count: {
          select: {
            properties: true,
            notes: true,
            reminders: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    response.json(agents);
  }),
);

apiRouter.post(
  '/agents',
  asyncRoute(async (request, response) => {
    const payload = agentSchema.parse(request.body);

    const agent = await db.agent.create({
      data: payload,
    });

    response.status(201).json(agent);
  }),
);

apiRouter.delete(
  '/agents/:agentId',
  asyncRoute(async (request, response) => {
    const agentId = parseId(request.params.agentId, 'agentId');

    const agent = await db.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    await db.agent.delete({ where: { id: agentId } });
    response.status(204).send();
  }),
);

apiRouter.get(
  '/agents/:agentId',
  asyncRoute(async (request, response) => {
    const agentId = parseId(request.params.agentId, 'agentId');

    const agent = await db.agent.findUnique({
      where: { id: agentId },
      include: {
        properties: {
          include: {
            family: {
              include: {
                tenants: true,
              },
            },
            notes: true,
            reminders: true,
          },
        },
      },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    response.json(agent);
  }),
);

apiRouter.get(
  '/properties',
  asyncRoute(async (_request, response) => {
    const properties = await db.property.findMany({
      include: {
        agent: true,
        family: {
          include: {
            tenants: true,
          },
        },
        notes: true,
        reminders: true,
      },
      orderBy: { id: 'asc' },
    });

    response.json(properties);
  }),
);

apiRouter.post(
  '/properties',
  asyncRoute(async (request, response) => {
    const payload = propertySchema.parse(request.body);

    const agent = await db.agent.findUnique({ where: { id: payload.agentId } });
    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    const property = await db.property.create({
      data: payload,
    });

    response.status(201).json(property);
  }),
);

apiRouter.get(
  '/properties/:propertyId',
  asyncRoute(async (request, response) => {
    const propertyId = parseId(request.params.propertyId, 'propertyId');

    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        agent: true,
        family: {
          include: {
            tenants: true,
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        reminders: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!property) {
      throw new ApiError(404, 'Property not found');
    }

    response.json(property);
  }),
);

// The assignment states one family household per property, so this route rejects duplicates.
apiRouter.post(
  '/properties/:propertyId/family',
  asyncRoute(async (request, response) => {
    const propertyId = parseId(request.params.propertyId, 'propertyId');
    const payload = familySchema.parse(request.body);

    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: { family: true },
    });

    if (!property) {
      throw new ApiError(404, 'Property not found');
    }

    const propertyWithFamily = property as typeof property & {
      family?: { id: number } | null;
    };

    if (propertyWithFamily.family) {
      throw new ApiError(409, 'Property already has a family assigned');
    }

    const family = await db.family.create({
      data: {
        propertyId,
        familyName: payload.familyName,
      },
    });

    response.status(201).json(family);
  }),
);

apiRouter.post(
  '/families/:familyId/tenants',
  asyncRoute(async (request, response) => {
    const familyId = parseId(request.params.familyId, 'familyId');
    const payload = tenantSchema.parse(request.body);

    const family = await db.family.findUnique({ where: { id: familyId } });
    if (!family) {
      throw new ApiError(404, 'Family not found');
    }

    const tenant = await db.tenant.create({
      data: {
        familyId,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : undefined,
        moveInDate: payload.moveInDate ? new Date(payload.moveInDate) : undefined,
        moveOutDate: payload.moveOutDate ? new Date(payload.moveOutDate) : undefined,
      },
    });

    response.status(201).json(tenant);
  }),
);

apiRouter.post(
  '/properties/:propertyId/notes',
  asyncRoute(async (request, response) => {
    const propertyId = parseId(request.params.propertyId, 'propertyId');
    const payload = noteSchema.parse(request.body);

    const [property, agent] = await Promise.all([
      db.property.findUnique({ where: { id: propertyId } }),
      db.agent.findUnique({ where: { id: payload.agentId } }),
    ]);

    if (!property) {
      throw new ApiError(404, 'Property not found');
    }

    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    const note = await db.propertyNote.create({
      data: {
        propertyId,
        agentId: payload.agentId,
        title: payload.title,
        category: payload.category,
        body: payload.body,
      },
    });

    response.status(201).json(note);
  }),
);

apiRouter.post(
  '/properties/:propertyId/reminders',
  asyncRoute(async (request, response) => {
    const propertyId = parseId(request.params.propertyId, 'propertyId');
    const payload = reminderSchema.parse(request.body);

    const [property, agent] = await Promise.all([
      db.property.findUnique({ where: { id: propertyId } }),
      db.agent.findUnique({ where: { id: payload.agentId } }),
    ]);

    if (!property) {
      throw new ApiError(404, 'Property not found');
    }

    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    const reminder = await db.propertyReminder.create({
      data: {
        propertyId,
        agentId: payload.agentId,
        title: payload.title,
        category: payload.category,
        description: payload.description,
        dueDate: new Date(payload.dueDate),
      },
    });

    response.status(201).json(reminder);
  }),
);

apiRouter.patch(
  '/reminders/:reminderId/status',
  asyncRoute(async (request, response) => {
    const reminderId = parseId(request.params.reminderId, 'reminderId');
    const payload = reminderStatusSchema.parse(request.body);

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
  '/notes/:noteId/status',
  asyncRoute(async (request, response) => {
    const noteId = parseId(request.params.noteId, 'noteId');
    const payload = noteStatusSchema.parse(request.body);

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
  '/notes/:noteId',
  asyncRoute(async (request, response) => {
    const noteId = parseId(request.params.noteId, 'noteId');
    const payload = noteUpdateSchema.parse(request.body);

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

apiRouter.patch(
  '/reminders/:reminderId',
  asyncRoute(async (request, response) => {
    const reminderId = parseId(request.params.reminderId, 'reminderId');
    const payload = reminderUpdateSchema.parse(request.body);

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
