import { z } from 'zod'

export const loginSchema = z.object({
     email: z
          .string()
          .min(1, 'NIS harus diisi'),
     password: z
          .string()
          .min(1, 'Password harus diisi')
          .min(6, 'Password minimal 6 karakter')
})

export type LoginFormData = z.infer<typeof loginSchema>
