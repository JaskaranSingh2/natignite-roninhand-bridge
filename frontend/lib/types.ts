import { z } from 'zod'

export const ActionSchema = z.object({
  name: z.string().min(1),
  bit: z.number().int().nonnegative().nullable().optional(),
})

export const SignalSchema = z.object({
  name: z.string().min(1),
  actions: z.array(ActionSchema),
})

export const SignalsResponseSchema = z.object({
  signals: z.array(SignalSchema),
})

export type Action = z.infer<typeof ActionSchema>
export type Signal = z.infer<typeof SignalSchema>
export type SignalsResponse = z.infer<typeof SignalsResponseSchema>

