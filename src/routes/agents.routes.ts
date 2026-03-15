import { Router } from "express";
import { asyncRoute } from "../utils/asyncRoute.utils.js";
import { z } from 'zod';
import { db } from "../db.js";
import { ApiError } from "../middleware/error-handler.js";
import { parseId } from "../helpers/parseId.helpers.js";
import { validate } from "../middleware/validate.js";

const apiRouter = Router();

const agentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  mobileNumber: z.string().min(3).optional(),
});

apiRouter.get(
  '/',
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
  validate(agentSchema),
  asyncRoute(async (request, response) => {
    const payload = request.body;

    const agent = await db.agent.create({
      data: payload,
    });

    response.status(201).json(agent);
  }),
);

apiRouter.delete(
  '/:agentId',
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
  '/:agentId',
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

export default apiRouter;