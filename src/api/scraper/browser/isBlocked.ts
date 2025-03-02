import takeScreenshot from "@/api/scraper/browser/takeScreenshot";
import type { PageWithCursor } from "puppeteer-real-browser";

export default async function isBlocked(page: PageWithCursor): Promise<boolean> {
    try {
        await page.waitForSelector("h1", { timeout: 5000 });
        const blockedText: string | null = await page.$eval(
            "h1",
            (el) => el.textContent?.trim() || null
        );
        const isBlocked = blockedText === "Sorry, you have been blocked";
        if (isBlocked) {
            await takeScreenshot("cf-block", page);
        }
        return isBlocked;
    } catch {
        return false;
    }
}