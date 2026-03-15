import { Router } from "express";
import { asyncRoute } from "../utils/asyncRoute.utils.js";
import { z } from 'zod';
import { db } from "../db.js";
import { ApiError } from "../middleware/error-handler.js";
import { NoteStatus } from "../models-status.js";
import { parseId } from "../helpers/parseId.helpers.js";
import { validate } from "../middleware/validate.js";

const apiRouter = Router();

const propertySchema = z.object({
  body: z.object({
    agentId: z.number().int().positive(),
    label: z.string().min(1),
    addressLine: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
  })
});

const familySchema = z.object({
  body: z.object({
    familyName: z.string().min(1),
  })
});

const noteSchema = z.object({
  body: z.object({
    agentId: z.number().int().positive(),
    title: z.string().min(1),
    category: z.string().min(1),
    body: z.string().min(1),
  })
});

const reminderSchema = z.object({
  body: z.object({
    agentId: z.number().int().positive(),
    title: z.string().min(1),
    category: z.string().min(1),
    description: z.string().min(1),
    dueDate: z.string().datetime(),
  })
});

apiRouter.get(
  '/',
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
  '/',
  validate(propertySchema), 
  asyncRoute(async (request, response) => {
    const payload = request.body//propertySchema.parse(request.body);

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
  '/:propertyId',
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
  '/:propertyId/family',
  validate(familySchema),
  asyncRoute(async (request, response) => {
    const propertyId = parseId(request.params.propertyId, 'propertyId');
    const payload = request.body//familySchema.parse(request.body);

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

apiRouter.delete(
  '/:propertyId/family/:familyId',
  asyncRoute(async (request, response) => {
    const propertyId = parseId(request.params.propertyId, 'propertyId');
    const familyId = parseId(request.params.familyId, 'familyId');

    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: { family: true },
    });

    console.log('property', property);

    if (!property) {
      throw new ApiError(404, 'Property not found');
    }

    const propertyWithFamily = property as typeof property & {
      family?: { id: number } | null;
    };

    if (!propertyWithFamily.family || propertyWithFamily.family.id !== familyId) {
      throw new ApiError(404, 'Family not found');
    }

    await db.family.delete({
      where: { propertyId, familyId },
    });

    response.status(204).json({});
  }),
);

apiRouter.post(
  '/:propertyId/notes',
  validate(noteSchema),
  asyncRoute(async (request, response) => {
    const propertyId = parseId(request.params.propertyId, 'propertyId');
    const payload = request.body//noteSchema.parse(request.body);

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
  '/:propertyId/reminders',
  validate(reminderSchema),
  asyncRoute(async (request, response) => {
    const propertyId = parseId(request.params.propertyId, 'propertyId');
    const payload = request.body//reminderSchema.parse(request.body);

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

export default apiRouter;