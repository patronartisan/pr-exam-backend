import { Router } from 'express';

import notesRouter from "./notes.routes.js";
import remindersRouter from "./reminders.routes.js";
import propertiesRouter from './properties.routes.js';
import familiesRouter from './families.routes.js';
import agentsRouter from './agents.routes.js';

const apiRouter = Router();

apiRouter.use('/agents', agentsRouter);
apiRouter.use('/notes', notesRouter);
apiRouter.use('/reminders', remindersRouter);
apiRouter.use('/properties', propertiesRouter);
apiRouter.use('/families', familiesRouter);

export { apiRouter };