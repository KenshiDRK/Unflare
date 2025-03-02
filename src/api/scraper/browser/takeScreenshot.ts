import { promises as fs } from "fs";
import * as path from "path";
import { type PageWithCursor } from "puppeteer-real-browser";

export default async function takeScreenshot(name: string, page: PageWithCursor) {
    const baseFolder: string =
        process.env.NODE_ENV === "production"
            ? path.join(path.sep, "screenshots")
            : path.join(process.cwd(), "screenshots");

    await fs.mkdir(baseFolder, { recursive: true });

    // Generate a safe timestamp: YYYY-MM-DD_HH-MM-SS
    const now: Date = new Date();
    const isoString: string = now.toISOString(); // e.g. "2025-02-22T14:30:00.000Z"
    const safeTimestamp: string = isoString.replace(/:/g, "-").replace("T", "_").split(".")[0]; // "2025-02-22_14-30-00"

    const fileName: string = `${safeTimestamp}_${name}.png`;
    const filePath: string = path.join(baseFolder, fileName);

    await page.screenshot({ path: filePath });
}
