import { Router } from "express";
import { asyncRoute } from "../utils/asyncRoute.utils.js";
import { z } from 'zod';
import { db } from "../db.js";
import { ApiError } from "../middleware/error-handler.js";
import { NoteStatus } from "../models-status.js";
import { parseId } from "../helpers/parseId.helpers.js";
import { validate } from "../middleware/validate.js";

const apiRouter = Router();

const tenantSchema = z.object({
  body: z.object({
    // fullName: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(3).optional(),
    dateOfBirth: z.string().datetime().optional(),
    moveInDate: z.string().datetime().optional(),
    moveOutDate: z.string().datetime().optional(),
  })
});

apiRouter.post(
  '/:familyId/tenants',
  validate(tenantSchema),
  asyncRoute(async (request, response) => {
    const familyId = parseId(request.params.familyId, 'familyId');
    const payload = request.body//tenantSchema.parse(request.body);

    const family = await db.family.findUnique({ where: { id: familyId } });
    if (!family) {
      throw new ApiError(404, 'Family not found');
    }

    if(family.familyName.toLowerCase() !== payload.lastName.toLowerCase()) {
      throw new ApiError(404, 'Family name does not match');
    }

    const tenant = await db.tenant.create({
      data: {
        familyId,
        firstName: payload.firstName,
        lastName: payload.lastName,
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

apiRouter.patch(
  '/:familyId/tenants/:tenantId',
  asyncRoute(async (request, response) => {
    const familyId = parseId(request.params.familyId, 'familyId');
    const tenantId = parseId(request.params.tenantId, 'tenantId');

    const family = await db.family.findUnique({ where: { id: familyId } });
    if (!family) {
      throw new ApiError(404, 'Family not found');
    }

    const tenant = await db.tenant.update({
      where: { id: tenantId }
    });

    response.status(201).json(tenant);
  }),
);

export default apiRouter;