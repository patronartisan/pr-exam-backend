import { ApiError } from "../middleware/error-handler.js";

export const parseId = (value: string, label: string) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, `${label} must be a positive integer`);
  }

  return parsed;
};