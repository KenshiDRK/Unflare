import type { ScrapeClearanceData } from "@/api/scraper/scrapeClearance";
import type { PageWithCursor } from "puppeteer-real-browser";

export default async function sendPostRequest(page: PageWithCursor, data: ScrapeClearanceData) {
    await page.evaluate(
        async (url, postData) => {
            const form = document.createElement("form");
            form.method = "POST";
            form.action = url;

            if (postData) {
                for (const key in postData) {
                    const input = document.createElement("input");
                    input.name = key;
                    input.value = String(postData[key]);
                    form.appendChild(input);
                }
            }

            document.body.appendChild(form);
            form.submit();
        },
        data.url,
        data.data || {}
    );

    await page.waitForNavigation({ waitUntil: "networkidle2" });
}
