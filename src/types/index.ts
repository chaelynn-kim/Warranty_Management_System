export interface WarrantyRecord {
  id: string
  issueDate: string
  region: string
  customer: string
  colorName: string
  paintCompany: string
  resin: string
  totalThickness: string
  primerThickness: string
  coat: string
  bake: string
  companyPeel: string
  companyFadeRoof: string
  companyFadeWall: string
  companyChalkRoof: string
  companyChalkWall: string
  supplierPeel: string
  supplierFadeRoof: string
  supplierFadeWall: string
  supplierChalkRoof: string
  supplierChalkWall: string
  notes: string
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
  warrantyNote: string
}

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
  paintCompany: string
  material: string
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
}

export type TabId = 'issuanceRequest' | 'issuance' | 'period' | 'externalTest'
