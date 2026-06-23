export interface WarrantyRecord {
  id: string
  requestDate: string
  requester: string
  region: string
  detailRegion: string
  customer: string
  colorName: string
  paintCompany: string
  resin: string
  additionalRequest: string
  /** JSON-serialized WarrantyFileAttachment[] */
  fileAttachment: string
  issueDate: string
  reviewResult: string
}

export interface WarrantyFileAttachment {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
}

export interface CountryEntry {
  region: string
  countries: string
}

export type ProductLine = 'paint' | 'print'

export interface ProductWarranty {
  productGroup: string
  productLine?: ProductLine
  peelFlake: string
  perforation: string
  colorFadingMode?: 'detail' | 'merged'
  chalkMode?: 'detail' | 'merged'
  /** @deprecated use colorFadingMode / chalkMode */
  colorChalkMode?: 'detail' | 'merged'
  colorFading: string
  colorFadingRoof: string
  colorFadingWall: string
  chalk: string
  chalkRoof: string
  chalkWall: string
  notes: string
}

export interface CoastalDistanceRow {
  distance: string
  coat2: string
  coat3: string
}

export interface CoastalSideData {
  rows: CoastalDistanceRow[]
  colorFadingRoof: string
  colorFadingWall: string
  chalkRoof: string
  chalkWall: string
}

export type CoastalSideSpecField =
  | 'colorFadingRoof'
  | 'colorFadingWall'
  | 'chalkRoof'
  | 'chalkWall'

export interface CoastalAlSection {
  title: string
  highRisk: CoastalSideData
  lowRisk: CoastalSideData
}

export interface NotCoveredSection {
  title: string
  items: string[]
}

/** @deprecated Use CoastalAlSection */
export interface CoastalWarranty {
  distance: string
  highRisk2Coat: string
  highRisk3Coat: string
  highRiskNotes: string
  lowRiskDistance: string
  lowRisk2Coat: string
  lowRisk3Coat: string
  lowRiskNotes: string
}

export interface WarrantyPeriodData {
  highRisk: {
    title: string
    countries: CountryEntry[]
    products: ProductWarranty[]
  }
  lowRisk: {
    title: string
    countries: CountryEntry[]
    note: string
    products: ProductWarranty[]
  }
  coastalAl: CoastalAlSection
  notCovered: NotCoveredSection
}

export interface ExternalTestRecord {
  id: string
  no: string
  purpose: string
  sampleName: string
  colorName: string
  workshop: string
  productionDate: string
  itemCode: string
  itemName: string
  resin: string
  requestDate: string
  receiptDate: string
  completionDate: string
  notes: string
  status: string
  institution: string
}

export interface WarrantyIssuanceRequest {
  requestDate: string
  requestTeam: string
  requestTeamCustom: string
  requesterName: string
  colorName: string
  resin: string
  resinCustom: string
  paintCompany: string
  material: string
  materialCustom: string
  coatingStructure: string
  productItem: string
  region: string
  detailRegion: string
  detailRegionCustom: string
  customer: string
  usage: string
  language: string
  warrantyTermMode: string
  warrantyTermCustom: string
  additionalRequest: string
  /** JSON-serialized WarrantyFileAttachment[] — 당사 Warranty (국문) */
  companyWarrantyAttachmentKo: string
  /** JSON-serialized WarrantyFileAttachment[] — 당사 Warranty (영문) */
  companyWarrantyAttachmentEn: string
  /** JSON-serialized WarrantyFileAttachment[] — 도료사 Warranty (국문) */
  supplierWarrantyAttachmentKo: string
  /** JSON-serialized WarrantyFileAttachment[] — 도료사 Warranty (영문) */
  supplierWarrantyAttachmentEn: string
  issueDate: string
  qualityAuthor: string
  reviewResult: string
}

export interface WarrantyIssuanceRequestRecord extends WarrantyIssuanceRequest {
  id: string
  status: string
  sequenceNo: number
}

export type TabId = 'issuanceRequest' | 'issuance' | 'period' | 'externalTest'
