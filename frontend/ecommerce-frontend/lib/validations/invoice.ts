import { z } from 'zod'

export const bireyselSchema = z.object({
  tckn: z
    .string({ required_error: 'TCKN zorunludur' })
    .regex(/^\d{11}$/, 'TCKN 11 haneli olmalıdır'),
})

export const firmaSchema = z.object({
  companyName: z.string({ required_error: 'Şirket adı zorunludur' }).min(2, 'Şirket adı çok kısa'),
  taxNumber: z
    .string({ required_error: 'VKN zorunludur' })
    .regex(/^\d{10}$/, 'VKN 10 haneli olmalıdır'),
  taxOffice: z.string({ required_error: 'Vergi dairesi zorunludur' }).min(2, 'Vergi dairesi çok kısa'),
})

export const invoiceAddressSchema = z.object({
  firstName: z.string({ required_error: 'Ad zorunlu' }).min(2, 'Ad çok kısa'),
  lastName: z.string({ required_error: 'Soyad zorunlu' }).min(2, 'Soyad çok kısa'),
  email: z.string({ required_error: 'E-posta zorunlu' }).email('Geçerli e-posta girin'),
  phone: z.string({ required_error: 'Telefon zorunlu' }).min(7, 'Telefon çok kısa'),
  address: z.string({ required_error: 'Adres zorunlu' }).min(5, 'Adres çok kısa'),
  city: z.string({ required_error: 'İl zorunlu' }).min(2, 'İl çok kısa'),
  district: z.string({ required_error: 'İlçe zorunlu' }).min(2, 'İlçe çok kısa'),
  postalCode: z.string().optional(),
})

export type CustomerType = 'bireysel' | 'firma'

export function validateInvoiceFormWithZod(params: {
  customerType: CustomerType
  useInvoiceAddress: boolean // true: invoice = shipping, false: ayrı adres formu
  invoiceForm: any
}) {
  const { customerType, useInvoiceAddress, invoiceForm } = params
  const errors: Record<string, string> = {}

  if (customerType === 'bireysel') {
    const res = bireyselSchema.safeParse({ tckn: invoiceForm.tckn })
    if (!res.success) {
      for (const issue of res.error.issues) {
        errors.tckn = issue.message
      }
    }
  } else {
    const res = firmaSchema.safeParse({
      companyName: invoiceForm.companyName,
      taxNumber: invoiceForm.taxNumber,
      taxOffice: invoiceForm.taxOffice,
    })
    if (!res.success) {
      for (const issue of res.error.issues) {
        const path = issue.path[0] as string
        errors[path] = issue.message
      }
    }
  }

  if (!useInvoiceAddress) {
    const res = invoiceAddressSchema.safeParse({
      firstName: invoiceForm.firstName,
      lastName: invoiceForm.lastName,
      email: invoiceForm.email,
      phone: invoiceForm.phone,
      address: invoiceForm.address,
      city: invoiceForm.city,
      district: invoiceForm.district,
      postalCode: invoiceForm.postalCode,
    })
    if (!res.success) {
      for (const issue of res.error.issues) {
        const path = issue.path[0] as string
        const key = path === 'firstName' ? 'invoiceFirstName'
          : path === 'lastName' ? 'invoiceLastName'
          : path === 'email' ? 'email'
          : path === 'phone' ? 'phone'
          : path === 'city' ? 'invoiceCity'
          : path === 'district' ? 'invoiceDistrict'
          : path === 'address' ? 'invoiceAddress'
          : (path as string)
        errors[key] = issue.message
      }
    }
  }

  return errors
} 