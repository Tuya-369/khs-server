import { AppError } from "../../errors/app-error";

export const normalizeSapId = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeName = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .map(
      (word) =>
        `${word.slice(0, 1).toLocaleUpperCase("mn-MN")}${word
          .slice(1)
          .toLocaleLowerCase("mn-MN")}`,
    )
    .join(" ");

export const normalizePhone = (value: unknown): string => {
  if (typeof value !== "string") return "";

  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("976")) return digits.slice(3);
  if (digits.length === 9 && digits.startsWith("0")) return digits.slice(1);

  return digits;
};

export const maskPhone = (phoneNumber: string): string => {
  if (phoneNumber.length < 4) return "****";
  return `${phoneNumber.slice(0, 2)}****${phoneNumber.slice(-2)}`;
};

export const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new AppError(
      500,
      `${name} системийн тохиргоонд байхгүй байна.`,
      [],
      "SERVER_CONFIGURATION_ERROR",
    );
  }
  return value;
};
