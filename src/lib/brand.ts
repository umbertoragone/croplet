export const APP_NAME = "Croplet";
export const WEB_APP_NAME = `${APP_NAME} Web`;
export const IOS_APP_NAME = `${APP_NAME} iOS app`;
export const WEB_TOOL_NAME = `${APP_NAME} web tool`;
export const PRO_PLAN_NAME = `${APP_NAME} Pro`;
export const TITLE_SEPARATOR = "–";

export const ROOT_TITLE_TEMPLATE = `%s ${TITLE_SEPARATOR} ${APP_NAME}`;

export function joinTitleParts(
  ...parts: Array<string | null | undefined | false>
) {
  return parts
    .filter((part): part is string => Boolean(part))
    .join(` ${TITLE_SEPARATOR} `);
}
