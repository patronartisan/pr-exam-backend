import bcrypt from 'bcryptjs';

import { NoteStatus, ReminderStatus } from './models-status.js';

type AuthUserRecord = {
	id: number;
	fullName: string;
	email: string;
	passwordHash: string;
	createdAt: Date;
	updatedAt: Date;
};

type AgentRecord = {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	mobileNumber: string | null;
	createdAt: Date;
	updatedAt: Date;
};

type PropertyRecord = {
	id: number;
	agentId: number;
	label: string;
	addressLine: string;
	city: string;
	state: string;
	postalCode: string;
	createdAt: Date;
	updatedAt: Date;
};

type FamilyRecord = {
	id: number;
	propertyId: number;
	familyName: string;
	createdAt: Date;
	updatedAt: Date;
};

type TenantRecord = {
	id: number;
	familyId: number;
	fullName: string;
	email: string | null;
	phone: string | null;
	dateOfBirth: Date | null;
	moveInDate: Date | null;
	moveOutDate: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

type PropertyNoteRecord = {
	id: number;
	agentId: number;
	propertyId: number;
	title: string;
	category: string;
	body: string;
	status: NoteStatus;
	createdAt: Date;
	updatedAt: Date;
};

type PropertyReminderRecord = {
	id: number;
	agentId: number;
	propertyId: number;
	title: string;
	category: string;
	description: string;
	dueDate: Date;
	status: ReminderStatus;
	completedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

const now = () => new Date();
const initialCreatedAt = new Date('2026-03-11T17:08:51.360Z');

const authUsers: AuthUserRecord[] = [
	{
		id: 1,
		fullName: 'Portal Admin',
		email: 'admin@pureagent.local',
		passwordHash: bcrypt.hashSync('Admin@12345', 10),
		createdAt: initialCreatedAt,
		updatedAt: initialCreatedAt,
	},
];

const agents: AgentRecord[] = [
	{
		id: 1,
		firstName: 'Property',
		lastName: 'Agent',
		email: 'property.agent@example.com',
		mobileNumber: '+1-555-0100',
		createdAt: initialCreatedAt,
		updatedAt: initialCreatedAt,
	},
];

const properties: PropertyRecord[] = [
	{
		id: 1,
		agentId: 1,
		label: 'Maple Residency',
		addressLine: '12 Maple Street',
		city: 'Austin',
		state: 'TX',
		postalCode: '78701',
		createdAt: initialCreatedAt,
		updatedAt: initialCreatedAt,
	},
];

const families: FamilyRecord[] = [
	{
		id: 1,
		propertyId: 1,
		familyName: 'Santos Family',
		createdAt: initialCreatedAt,
		updatedAt: initialCreatedAt,
	},
];

const tenants: TenantRecord[] = [
	{
		id: 1,
		familyId: 1,
		fullName: 'Elena Santos',
		email: 'elena@example.com',
		phone: null,
		dateOfBirth: null,
		moveInDate: new Date('2025-07-01T00:00:00.000Z'),
		moveOutDate: null,
		createdAt: initialCreatedAt,
		updatedAt: initialCreatedAt,
	},
	{
		id: 2,
		familyId: 1,
		fullName: 'Marco Santos',
		email: 'marco@example.com',
		phone: null,
		dateOfBirth: null,
		moveInDate: new Date('2025-07-01T00:00:00.000Z'),
		moveOutDate: null,
		createdAt: initialCreatedAt,
		updatedAt: initialCreatedAt,
	},
];

const propertyNotes: PropertyNoteRecord[] = [
	{
		id: 1,
		agentId: 1,
		propertyId: 1,
		title: 'Quarterly pest control',
		category: 'pest-control',
		body: 'Coordinate with the vendor before the second week of the month.',
		status: NoteStatus.PENDING,
		createdAt: initialCreatedAt,
		updatedAt: initialCreatedAt,
	},
];

const propertyReminders: PropertyReminderRecord[] = [
	{
		id: 1,
		agentId: 1,
		propertyId: 1,
		title: 'HVAC maintenance visit',
		category: 'maintenance',
		description: 'Confirm filter replacement and thermostat inspection.',
		dueDate: new Date('2026-04-01T10:00:00.000Z'),
		status: ReminderStatus.PENDING,
		completedAt: null,
		createdAt: initialCreatedAt,
		updatedAt: initialCreatedAt,
	},
];

const counters = {
	authUser: 2,
	agent: 2,
	property: 2,
	family: 2,
	tenant: 3,
	propertyNote: 2,
	propertyReminder: 2,
};

const clone = <T>(value: T): T => structuredClone(value);

const removeWhere = <T>(items: T[], predicate: (item: T) => boolean) => {
	for (let index = items.length - 1; index >= 0; index -= 1) {
		if (predicate(items[index] as T)) {
			items.splice(index, 1);
		}
	}
};

const selectFields = <T extends Record<string, unknown>>(
	record: T,
	select?: Record<string, boolean>,
) => {
	if (!select) {
		return clone(record);
	}

	const result: Record<string, unknown> = {};
	for (const [key, enabled] of Object.entries(select)) {
		if (enabled) {
			result[key] = record[key];
		}
	}

	return clone(result);
};

const buildFamilyDetails = (family: FamilyRecord | null) => {
	if (!family) {
		return null;
	}

	return {
		...family,
		tenants: tenants.filter((tenant) => tenant.familyId === family.id).map(clone),
	};
};

const buildPropertyDetails = (property: PropertyRecord) => {
	const family = families.find((item) => item.propertyId === property.id) ?? null;

	return {
		...clone(property),
		agent: clone(agents.find((agent) => agent.id === property.agentId) ?? null),
		family: buildFamilyDetails(family),
		notes: propertyNotes
			.filter((note) => note.propertyId === property.id)
			.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
			.map(clone),
		reminders: propertyReminders
			.filter((reminder) => reminder.propertyId === property.id)
			.sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime())
			.map(clone),
	};
};

const buildAgentDetails = (agent: AgentRecord) => ({
	...clone(agent),
	properties: properties
		.filter((property) => property.agentId === agent.id)
		.sort((left, right) => left.id - right.id)
		.map(buildPropertyDetails),
});

export const db = {
	$disconnect: async () => undefined,

	authUser: {
		findUnique: async ({
			where,
			select,
		}: {
			where: { id?: number; email?: string };
			select?: Record<string, boolean>;
		}) => {
			const user = authUsers.find(
				(item) =>
					(where.id !== undefined && item.id === where.id) ||
					(where.email !== undefined && item.email === where.email),
			);

			return user ? selectFields(user, select) : null;
		},

		create: async ({
			data,
			select,
		}: {
			data: { fullName: string; email: string; passwordHash: string };
			select?: Record<string, boolean>;
		}) => {
			const createdAt = now();
			const user: AuthUserRecord = {
				id: counters.authUser++,
				fullName: data.fullName,
				email: data.email,
				passwordHash: data.passwordHash,
				createdAt,
				updatedAt: createdAt,
			};
			authUsers.push(user);
			return selectFields(user, select);
		},
	},

	agent: {
		findMany: async (_options?: unknown) =>
			agents
				.slice()
				.sort((left, right) => left.id - right.id)
				.map((agent) => ({
					...clone(agent),
					_count: {
						properties: properties.filter((property) => property.agentId === agent.id).length,
						notes: propertyNotes.filter((note) => note.agentId === agent.id).length,
						reminders: propertyReminders.filter((reminder) => reminder.agentId === agent.id).length,
					},
				})),

		create: async ({
			data,
		}: {
			data: {
				firstName: string;
				lastName: string;
				email: string;
				mobileNumber?: string;
			};
		}) => {
			const createdAt = now();
			const agent: AgentRecord = {
				id: counters.agent++,
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				mobileNumber: data.mobileNumber ?? null,
				createdAt,
				updatedAt: createdAt,
			};
			agents.push(agent);
			return clone(agent);
		},

		findUnique: async ({ where, include }: { where: { id: number }; include?: unknown }) => {
			const agent = agents.find((item) => item.id === where.id);
			if (!agent) {
				return null;
			}

			return include ? buildAgentDetails(agent) : clone(agent);
		},

		delete: async ({ where }: { where: { id: number } }) => {
			const agentIndex = agents.findIndex((item) => item.id === where.id);
			if (agentIndex < 0) {
				throw new Error('Agent not found');
			}

			const deletedAgent = clone(agents[agentIndex] as AgentRecord);
			const propertyIds = new Set(
				properties.filter((property) => property.agentId === where.id).map((property) => property.id),
			);
			const familyIds = new Set(
				families.filter((family) => propertyIds.has(family.propertyId)).map((family) => family.id),
			);

			removeWhere(tenants, (tenant) => familyIds.has(tenant.familyId));
			removeWhere(families, (family) => propertyIds.has(family.propertyId));
			removeWhere(propertyNotes, (note) => note.agentId === where.id || propertyIds.has(note.propertyId));
			removeWhere(
				propertyReminders,
				(reminder) => reminder.agentId === where.id || propertyIds.has(reminder.propertyId),
			);
			removeWhere(properties, (property) => property.agentId === where.id);
			agents.splice(agentIndex, 1);

			return deletedAgent;
		},
	},

	property: {
		findMany: async (_options?: unknown) =>
			properties
				.slice()
				.sort((left, right) => left.id - right.id)
				.map(buildPropertyDetails),

		create: async ({
			data,
		}: {
			data: {
				agentId: number;
				label: string;
				addressLine: string;
				city: string;
				state: string;
				postalCode: string;
			};
		}) => {
			const createdAt = now();
			const property: PropertyRecord = {
				id: counters.property++,
				agentId: data.agentId,
				label: data.label,
				addressLine: data.addressLine,
				city: data.city,
				state: data.state,
				postalCode: data.postalCode,
				createdAt,
				updatedAt: createdAt,
			};
			properties.push(property);
			return clone(property);
		},

		findUnique: async ({ where, include }: { where: { id: number }; include?: unknown }) => {
			const property = properties.find((item) => item.id === where.id);
			if (!property) {
				return null;
			}

			if (!include) {
				return clone(property);
			}

			if (typeof include === 'object' && include !== null && 'family' in include && Object.keys(include as object).length === 1) {
				return {
					...clone(property),
					family: clone(families.find((family) => family.propertyId === property.id) ?? null),
				};
			}

			return buildPropertyDetails(property);
		},
	},

	family: {
		findUnique: async ({ where }: { where: { id?: number; propertyId?: number } }) => {
			const family = families.find(
				(item) =>
					(where.id !== undefined && item.id === where.id) ||
					(where.propertyId !== undefined && item.propertyId === where.propertyId),
			);
			return family ? clone(family) : null;
		},

		create: async ({ data }: { data: { propertyId: number; familyName: string } }) => {
			const createdAt = now();
			const family: FamilyRecord = {
				id: counters.family++,
				propertyId: data.propertyId,
				familyName: data.familyName,
				createdAt,
				updatedAt: createdAt,
			};
			families.push(family);
			return clone(family);
		},
	},

	tenant: {
		create: async ({
			data,
		}: {
			data: {
				familyId: number;
				fullName: string;
				email?: string;
				phone?: string;
				dateOfBirth?: Date;
				moveInDate?: Date;
				moveOutDate?: Date;
			};
		}) => {
			const createdAt = now();
			const tenant: TenantRecord = {
				id: counters.tenant++,
				familyId: data.familyId,
				fullName: data.fullName,
				email: data.email ?? null,
				phone: data.phone ?? null,
				dateOfBirth: data.dateOfBirth ?? null,
				moveInDate: data.moveInDate ?? null,
				moveOutDate: data.moveOutDate ?? null,
				createdAt,
				updatedAt: createdAt,
			};
			tenants.push(tenant);
			return clone(tenant);
		},
	},

	propertyNote: {
		create: async ({
			data,
		}: {
			data: { propertyId: number; agentId: number; title: string; category: string; body: string };
		}) => {
			const createdAt = now();
			const note: PropertyNoteRecord = {
				id: counters.propertyNote++,
				propertyId: data.propertyId,
				agentId: data.agentId,
				title: data.title,
				category: data.category,
				body: data.body,
				status: NoteStatus.PENDING,
				createdAt,
				updatedAt: createdAt,
			};
			propertyNotes.push(note);
			return clone(note);
		},

		findUnique: async ({ where }: { where: { id: number } }) => {
			const note = propertyNotes.find((item) => item.id === where.id);
			return note ? clone(note) : null;
		},

		update: async ({
			where,
			data,
		}: {
			where: { id: number };
			data: { status?: NoteStatus; title?: string; category?: string; body?: string };
		}) => {
			const note = propertyNotes.find((item) => item.id === where.id);
			if (!note) {
				throw new Error('Note not found');
			}
			if (data.status !== undefined) note.status = data.status;
			if (data.title !== undefined) note.title = data.title;
			if (data.category !== undefined) note.category = data.category;
			if (data.body !== undefined) note.body = data.body;
			note.updatedAt = now();
			return clone(note);
		},
	},

	propertyReminder: {
		create: async ({
			data,
		}: {
			data: {
				propertyId: number;
				agentId: number;
				title: string;
				category: string;
				description: string;
				dueDate: Date;
			};
		}) => {
			const createdAt = now();
			const reminder: PropertyReminderRecord = {
				id: counters.propertyReminder++,
				propertyId: data.propertyId,
				agentId: data.agentId,
				title: data.title,
				category: data.category,
				description: data.description,
				dueDate: data.dueDate,
				status: ReminderStatus.PENDING,
				completedAt: null,
				createdAt,
				updatedAt: createdAt,
			};
			propertyReminders.push(reminder);
			return clone(reminder);
		},

		findUnique: async ({ where }: { where: { id: number } }) => {
			const reminder = propertyReminders.find((item) => item.id === where.id);
			return reminder ? clone(reminder) : null;
		},

		update: async ({
			where,
			data,
		}: {
			where: { id: number };
			data: { status?: ReminderStatus; completedAt?: Date | null; title?: string; category?: string; description?: string; dueDate?: Date };
		}) => {
			const reminder = propertyReminders.find((item) => item.id === where.id);
			if (!reminder) {
				throw new Error('Reminder not found');
			}
			if (data.status !== undefined) reminder.status = data.status;
			if (data.completedAt !== undefined) reminder.completedAt = data.completedAt;
			if (data.title !== undefined) reminder.title = data.title;
			if (data.category !== undefined) reminder.category = data.category;
			if (data.description !== undefined) reminder.description = data.description;
			if (data.dueDate !== undefined) reminder.dueDate = data.dueDate;
			reminder.updatedAt = now();
			return clone(reminder);
		},
	},
};
