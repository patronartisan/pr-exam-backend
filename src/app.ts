import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { errorHandler } from './middleware/error-handler.js';
import { authMiddleware } from './middleware/auth.js';
import { apiRouter } from './routes/api.js';
import { authRouter } from './routes/auth.js';

export const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerPath = path.resolve(__dirname, '../docs/swagger.yaml');
const swaggerDocument = YAML.load(swaggerPath);

app.use(express.json());

app.use('/auth', authRouter);
app.use('/api', authMiddleware, apiRouter);
app.use(
	'/docs',
	swaggerUi.serve,
	swaggerUi.setup(swaggerDocument, {
		swaggerOptions: {
			persistAuthorization: true,
		},
	}),
);

app.use(errorHandler);
