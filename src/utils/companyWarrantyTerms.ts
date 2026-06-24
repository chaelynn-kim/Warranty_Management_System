import type { ProductWarranty } from '../types'
import { findCompanyWarrantyProducts } from './warrantyPeriodLookup'
import { loadWarrantyPeriod } from './warrantyPeriodStorage'

export type CompanyWarrantyEditableField =
  | 'peelFlake'
  | 'perforation'
  | 'colorFading'
  | 'colorFadingRoof'
  | 'colorFadingWall'
  | 'chalk'
  | 'chalkRoof'
  | 'chalkWall'

export function buildCompanyWarrantyLookupKey(
  productItem: string,
  resin: string,
  region: string,
  coatingStructure: string
): string {
  return [productItem, resin, region, coatingStructure].join('\u001f')
}

export function parseCompanyWarrantyTerms(value: string): ProductWarranty[] {
  if (!value.trim()) return []
  try {
    const parsed = JSON.parse(value) as ProductWarranty[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function serializeCompanyWarrantyTerms(products: ProductWarranty[]): string {
  return JSON.stringify(products)
}

export function lookupCompanyWarrantyTerms(options: {
  productItem: string
  resin: string
  region: string
  coatingStructure: string
}): ProductWarranty[] {
  return findCompanyWarrantyProducts(loadWarrantyPeriod(), options)
}

export function updateCompanyWarrantyProductField(
  products: ProductWarranty[],
  productGroup: string,
  field: CompanyWarrantyEditableField,
  value: string
): ProductWarranty[] {
  return products.map((product) =>
    product.productGroup === productGroup ? { ...product, [field]: value } : product
  )
}
