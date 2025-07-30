import closePageAndBrowser from "@/api/scraper/browser/closePageAndBrowser";
import isBlocked from "@/api/scraper/browser/isBlocked";
import sendPostRequest from "@/api/scraper/browser/sendPostRequest";
import takeScreenshot from "@/api/scraper/browser/takeScreenshot";
import handleValidationError from "@/api/scraper/utils/handleValidationError";
import ErrorResponse from "@/common/utils/ErrorResponse";
import { handleFailureResponse, handleSuccessResponse } from "@/common/utils/httpHandlers";
import { logger } from "@/server";
import type { Request, Response } from "express";
import type pino from "pino";
import { connect, type PageWithCursor } from "puppeteer-real-browser";
import type { Browser } from "rebrowser-puppeteer-core";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";

const ProxySchema = z.object({
    host: z.string(),
    port: z.number(),
    username: z.string(),
    password: z.string(),
});

const PostRequestDataSchema = z.record(z.unknown());

export const ScrapeClearanceRequestSchema = z.object({
    url: z.string(),
    timeout: z.number(),
    proxy: ProxySchema.optional(),
    method: z.enum(["GET", "POST"]).optional().default("GET"),
    data: PostRequestDataSchema.optional(),
});

export type ScrapeClearanceData = z.infer<typeof ScrapeClearanceRequestSchema>;

interface TypedRequest extends Request {
    body: z.infer<typeof ScrapeClearanceRequestSchema>;
}

export async function scrapeClearance(req: Request, res: Response) {
    const browserLogger = logger.child({ endpoint: "scrapeClearance" });
    let browser;
    let page;

    try {
        const data = ScrapeClearanceRequestSchema.parse(req.body);

        browserLogger.info("Starting browser");

        const connectOptions: any = {
            headless: false,
            args: [
                "--disable-dev-shm-usage",           // Evita uso intensivo de /dev/shm
                "--disable-gpu",                     // Desactiva GPU (no necesaria en server)
                "--disable-setuid-sandbox",          // Menos aislamiento, menos memoria
                "--no-sandbox",                      // Desactiva sandboxing
                "--no-zygote",                       // Desactiva procesos intermedios
                "--disable-software-rasterizer",     // Evita carga de renderizado extra
                "--disable-accelerated-2d-canvas",   // Menos carga en el renderizado
                "--disable-dev-tools",               // DevTools innecesarios
                "--no-first-run",                    // Evita configuraciones iniciales
                "--mute-audio",                      // Silencia todo, menos carga
                "--window-size=300,200",             // Tamaño fijo (menos recursos)
                "--disable-background-networking",
                "--disable-background-timer-throttling",
                "--disable-breakpad",
                "--disable-client-side-phishing-detection",
                "--disable-default-apps",
                "--disable-features=site-per-process",
                "--disable-hang-monitor",
                "--disable-popup-blocking",
                "--disable-prompt-on-repost",
                "--disable-renderer-backgrounding",
                "--disable-sync",
                "--metrics-recording-only",
                "--no-default-browser-check",
                "--safebrowsing-disable-auto-update",
                "--password-store=basic",
                "--use-mock-keychain",
                "--disable-notifications",
                "--disable-extensions",
                "--hide-scrollbars",
                //"--blink-settings=imagesEnabled=false", // ⚠️ Desactiva imágenes (hace fallar)
                //"--enable-automation",...............// (hace fallar)
                //"--single-process",                  // No forks (hace Fallar)
                "--js-flags=--no-expose-wasm,--jitless", // Desactiva JIT y WebAssembly
            ],
            customConfig: {},
            turnstile: true,
            connectOption: {},
            disableXvfb: false,
            ignoreAllFlags: false,
        };

        if (data.proxy) {
            connectOptions.proxy = { ...data.proxy };
        }

        const connection = await connect(connectOptions);
        browser = connection.browser;
        page = connection.page;

        page.setDefaultTimeout(data.timeout ?? 60_000);

        await page.setUserAgent("Mozilla/5.0 (Linux; Android 10; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36");
        await page.setViewport({ width: 330, height: 250});

        if (data.method === "GET") {
            await page.goto(data.url, { waitUntil: "domcontentloaded" });
        } else if (data.method === "POST") {
            await sendPostRequest(page, data);
        }

        browserLogger.info(`Navigated to ${data.url} using ${data.method} method`);

        if (await isBlocked(page)) {
            browserLogger.info("Blocked by Cloudflare");
            return handleFailureResponse(ErrorResponse.create("error", "Blocked by Cloudflare"), res);
        }

        const session = await getClearance(page, browser, data, browserLogger);

        browserLogger.info("Successfully obtained clearance");

        return handleSuccessResponse(session, res);
    } catch (error) {
        const errorData: Record<string, unknown> = {};

        if (error instanceof Error) {
            errorData.msg = error.message;
            if (error.stack) errorData.stack = error.stack;
        } else {
            errorData.msg = String(error);
        }

        browserLogger.error(errorData);

        if (error instanceof z.ZodError) {
            return handleValidationError(error, res);
        }

        if (page && !page.isClosed()) {
            await takeScreenshot("obtaining-clearance", page);
        }

        const errorMessage: string = error instanceof Error ? error.message : "Unknown error";
        return handleFailureResponse(ErrorResponse.create("error", errorMessage), res);
    } finally {
        await closePageAndBrowser(page, browser, browserLogger);
    }
}

async function getClearance(
  page: PageWithCursor,
  browser: Browser,
  data: ScrapeClearanceData,
  logger: pino.Logger
): Promise<{ html: string }> {
  logger.info("Waiting for Cloudflare challenge to complete");

  let isResolved = false;
  //await page.setViewport({ width: 320, height: 200 });

  return new Promise(async (resolve, reject) => {
    await page.setRequestInterception(true);

    page.on('request', req => {
        if (['stylesheet', 'font'].includes(req.resourceType())) req.abort();
        else req.continue();
    });

    page.on("response", async (res) => {
      try {
        const url = res.url();
        const status = res.status();

        //logger.info(`Response: ${url} ${status}`);

        if (
          [200, 302].includes(status) &&
          [data.url, data.url + "/"].includes(url)
        ) {
          try {
            await page.waitForNavigation({
              waitUntil: "domcontentloaded",
              timeout: 30000,
            });
          } catch (_) {
            // ignorar timeout
          }

          const html = await page.content();

          isResolved = true;
          clearInterval(cl);
          page.removeAllListeners('request');
          await page.setRequestInterception(false); // (optional, to disable interception)
          await page.close();
          return resolve({ html });
        }
      } catch (err) {
        logger.warn({ msg: "Error processing response", err });
      }
    });

    const cl = setTimeout(() => {
      if (!isResolved) {
        reject("Timeout Error");
      }
    }, data.timeout || 60000);
  });
}
