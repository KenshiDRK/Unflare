import type pino from "pino";
import type { PageWithCursor } from "puppeteer-real-browser";

export default async function closePageAndBrowser(
    page: PageWithCursor | undefined,
    browser: { connected: boolean; close: () => Promise<void> } | undefined,
    logger: pino.Logger
) {
    if (page && !page.isClosed()) {
        try {
            await page.close();
        } catch (error) {
            logger.error("Error closing page:", error);
        }
    }
    if (browser && browser.connected) {
        try {
            await browser.close();
        } catch (error: unknown) {
            logger.error("Error closing browser:", error);
        }
    }
}
