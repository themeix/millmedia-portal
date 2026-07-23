// Configuration for publication targets
export const PUBLICATION_CONFIG = {
  1: {
    name: 'The Mill',
    monthlyTarget: 1500,
    domain: 'manchestermill.co.uk'
  },
  2: {
    name: 'The Post',
    monthlyTarget: 1100,
    domain: 'livpost.co.uk'
  },
  3: {
    name: 'The Tribune',
    monthlyTarget: 850,
    domain: 'sheffieldtribune.co.uk'
  },
  4: {
    name: 'The Dispatch',
    monthlyTarget: 1100,
    domain: 'birminghamdispatch.co.uk'
  },
  5: {
    name: 'The Bell',
    monthlyTarget: 1200,
    domain: 'glasgowbell.co.uk'
  },
  35: {
    name: 'The Exchange',
    monthlyTarget: 1200,
    domain: 'theexchange.news'
  },
  36: {
    name: 'The Londoner',
    monthlyTarget: 2000,
    domain: 'the-londoner.co.uk'
  }
}

export const ALL_COMPANY_TARGET = 6000

export function getPublicationName(siteId: number): string {
  return (PUBLICATION_CONFIG as any)[siteId]?.name || `Site ${siteId}`
}

export function getPublicationTarget(siteId: number): number {
  return (PUBLICATION_CONFIG as any)[siteId]?.monthlyTarget || 0
}