import axios from "axios";
import { logger } from "./logger";
import { normalizePhone } from "../modules/auth/auth.utils";

/**
 * Sends an SMS via the CallPro API. Unlike OTP sending, this is used for
 * non-critical notifications, so failures are logged but never thrown -
 * callers should not have their primary action blocked by SMS delivery.
 */
export const sendSms = async (
  phoneNumber: string,
  text: string,
): Promise<void> => {
  const formattedPhone = normalizePhone(phoneNumber);
  if (!formattedPhone || !/^\d{8}$/.test(formattedPhone)) {
    logger.warn(`SMS илгээгдсэнгүй: утасны дугаар буруу (${phoneNumber}).`);
    return;
  }

  const apiKey = process.env.CALLPRO_API_KEY;
  if (!apiKey) {
    logger.warn(
      `CALLPRO_API_KEY тохируулаагүй тул SMS console дээр: ${formattedPhone} -> ${text}`,
    );
    return;
  }

  const endpoint = process.env.CALLPRO_API_URL;
  const senderNumber = process.env.CALLPRO_SENDER;
  if (!endpoint || !senderNumber) {
    logger.warn(
      "CALLPRO_API_URL эсвэл CALLPRO_SENDER тохируулаагүй тул SMS илгээгдсэнгүй.",
    );
    return;
  }

  try {
    const response = await axios.post(
      endpoint,
      { from: senderNumber, to: formattedPhone, text },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": apiKey,
        },
      },
    );
    logger.info("SMS provider response", {
      status: response.status,
      body:
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data),
    });
  } catch (error) {
    const response = axios.isAxiosError(error) ? error.response : undefined;
    const errorBody =
      typeof response?.data === "string"
        ? response.data
        : JSON.stringify(response?.data || {});

    logger.error("SMS provider error", {
      status: response?.status,
      body: errorBody,
    });

    // If CallPro rejected due to unverified links, strip protocol or URL and retry once
    if (errorBody.includes("unverified links")) {
      const sanitizedText = text
        .replace(/https?:\/\//gi, "")
        .trim();

      if (sanitizedText !== text) {
        try {
          const retryResponse = await axios.post(
            endpoint,
            { from: senderNumber, to: formattedPhone, text: sanitizedText },
            {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "x-api-key": apiKey,
              },
            },
          );
          logger.info("SMS retry without protocol successful", {
            status: retryResponse.status,
          });
        } catch (retryError) {
          logger.error("SMS retry failed", { error: retryError });
        }
      }
    }
  }
};

/**
 * Sends the same SMS text to multiple phone numbers, in parallel,
 * without allowing one failure to block the others.
 */
export const sendSmsToMany = async (
  phoneNumbers: string[],
  text: string,
): Promise<void> => {
  await Promise.all(phoneNumbers.map((phoneNumber) => sendSms(phoneNumber, text)));
};
