import { z } from "zod";

// New schemas for the updated data format
export const SignalsZ = z.record(z.array(z.string())); // { [signal]: string[] }
export const MappingZ = z.record(z.union([z.array(z.string()), z.null()])); // { "['s1','s2']": string[] | null }

export type Signals = z.infer<typeof SignalsZ>;
export type Mapping = z.infer<typeof MappingZ>;

// Utility function to build combo keys with exact formatting
export const comboKey = (states: [string, string]) =>
	`['${states[0]}', '${states[1]}']`;
