import type { Source } from "../lib/types";
import { greenhouse, lever, ashby } from "./ats";
import { linkedin } from "./linkedin";
import { workable } from "./workable";
import { careerjet } from "./careerjet";
import { remoteok, remotive, himalayas, weworkremotely } from "./remoteBoards";

export const SOURCES: Source[] = [linkedin, workable, careerjet, greenhouse, lever, ashby, remotive, himalayas, weworkremotely, remoteok];

export const SOURCE_LABELS: Record<string, string> = Object.fromEntries(SOURCES.map((s) => [s.id, s.label]));
