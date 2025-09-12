import { z } from 'zod'

// Login form validation
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email adresi gerekli')
    .email('Geçerli bir email adresi giriniz'),
  password: z
    .string()
    .min(1, 'Şifre gerekli')
    .min(6, 'Şifre en az 6 karakter olmalıdır')
})

// Register form validation
export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Ad gerekli')
    .min(2, 'Ad en az 2 karakter olmalıdır')
    .max(50, 'Ad en fazla 50 karakter olabilir')
    .regex(/^[a-zA-ZçğıöşüÇĞIÖŞÜ\s]+$/, 'Ad sadece harf içerebilir'),
  lastName: z
    .string()
    .min(1, 'Soyad gerekli')
    .min(2, 'Soyad en az 2 karakter olmalıdır')
    .max(50, 'Soyad en fazla 50 karakter olabilir')
    .regex(/^[a-zA-ZçğıöşüÇĞIÖŞÜ\s]+$/, 'Soyad sadece harf içerebilir'),
  email: z
    .string()
    .min(1, 'Email adresi gerekli')
    .email('Geçerli bir email adresi giriniz'),
  phone: z
  .string()
  .min(1, 'Telefon numarası gerekli')
  .transform((val) => val.replace(/\s/g, ''))
  .refine((val) => /^(\+90|90|0)?5[0-9]{9}$/.test(val), {
    message: 'Geçerli bir Türk telefon numarası giriniz',
  }),
  gender: z
    .enum(['male', 'female'], {
      required_error: 'Cinsiyet seçimi gerekli',
      invalid_type_error: 'Geçerli bir cinsiyet seçiniz'
    }),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'),
  confirmPassword: z
    .string()
    .min(1, 'Şifre tekrarı gerekli')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword']
})

// Forgot password form validation
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email adresi gerekli')
    .email('Geçerli bir email adresi giriniz')
})

// Reset password form validation
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'),
  confirmPassword: z
    .string()
    .min(1, 'Şifre tekrarı gerekli')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword']
})

// Change password form validation
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Mevcut şifre gerekli'),
  newPassword: z
    .string()
    .min(8, 'Yeni şifre en az 8 karakter olmalıdır')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'),
  confirmNewPassword: z
    .string()
    .min(1, 'Yeni şifre tekrarı gerekli')
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Yeni şifreler eşleşmiyor',
  path: ['confirmNewPassword']
})

// Email verification token validation
export const emailVerificationSchema = z.object({
  token: z
    .string()
    .min(1, 'Doğrulama tokeni gerekli')
})

// Resend verification form validation
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email adresi gerekli')
    .email('Geçerli bir email adresi giriniz')
})

// Type exports for forms
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type EmailVerificationFormData = z.infer<typeof emailVerificationSchema>
export type ResendVerificationFormData = z.infer<typeof resendVerificationSchema>

// Phone number formatter helper
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('90')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    return `+9${cleaned}`
  } else if (cleaned.length === 10) {
    return `+90${cleaned}`
  }
  
  return phone
}

// Password strength checker
export const checkPasswordStrength = (password: string): {
  score: number
  feedback: string[]
} => {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('En az 8 karakter olmalı')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('En az bir büyük harf içermeli')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('En az bir küçük harf içermeli')
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('En az bir rakam içermeli')
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
    feedback.push('Özel karakterler şifreyi güçlendirir')
  }

  return { score, feedback }
} 