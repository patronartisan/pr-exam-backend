# Relational Data Model

## Tables

### agents

- `id` PK
- `first_name`
- `last_name`
- `email` UNIQUE
- `mobile_number`
- `created_at`
- `updated_at`

### properties

- `id` PK
- `agent_id` FK -> `agents.id`
- `label`
- `address_line`
- `city`
- `state`
- `postal_code`
- `created_at`
- `updated_at`

### families

- `id` PK
- `property_id` FK -> `properties.id`
- `property_id` UNIQUE to enforce one family per property
- `family_name`
- `created_at`
- `updated_at`

### tenants

- `id` PK
- `family_id` FK -> `families.id`
- `full_name`
- `email`
- `phone`
- `date_of_birth`
- `move_in_date`
- `move_out_date`
- `created_at`
- `updated_at`

### property_notes

- `id` PK
- `agent_id` FK -> `agents.id`
- `property_id` FK -> `properties.id`
- `title`
- `category`
- `body`
- `created_at`
- `updated_at`

### property_reminders

- `id` PK
- `agent_id` FK -> `agents.id`
- `property_id` FK -> `properties.id`
- `title`
- `category`
- `description`
- `due_date`
- `status`
- `completed_at`
- `created_at`
- `updated_at`

## Relationships

- One `agent` to many `properties`
- One `property` to one `family`
- One `family` to many `tenants`
- One `agent` to many `property_notes`
- One `agent` to many `property_reminders`
- One `property` to many `property_notes`
- One `property` to many `property_reminders`
