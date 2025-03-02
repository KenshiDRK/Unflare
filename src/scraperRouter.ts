import { scrapeClearance } from "@/api/scraper/scrapeClearance";
import express from "express";

export const scraperRouter = express.Router();

scraperRouter.post("/scrape", scrapeClearance);
