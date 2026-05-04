import {
  getWebMessages,
} from "./localization";
import WebHomeClient from "./web-home-client";

export default function WebHomePage() {
  const locale = "en";
  const messages = getWebMessages(locale);

  return <WebHomeClient initialLocale={locale} initialMessages={messages} />;
}
