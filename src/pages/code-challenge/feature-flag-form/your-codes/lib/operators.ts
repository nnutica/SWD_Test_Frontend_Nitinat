// Same operator set as the GoFeatureFlag editor (nikunjy/rules syntax)
export const OPERATOR_VALUES = [
  'eq',
  'ne',
  'lt',
  'gt',
  'le',
  'ge',
  'co',
  'sw',
  'ew',
  'in',
  'pr',
  'not',
] as const

export type Operator = (typeof OPERATOR_VALUES)[number]

export const OPERATOR_LABELS: Record<Operator, string> = {
  eq: 'Equals To',
  ne: 'Not Equals To',
  lt: 'Less Than',
  gt: 'Greater Than',
  le: 'Less Than Equal To',
  ge: 'Greater Than Equal To',
  co: 'Contains',
  sw: 'Starts With',
  ew: 'Ends With',
  in: 'In a List',
  pr: 'Present',
  not: 'Not',
}

/** True when the operator needs no value (e.g. "email pr"). */
export const isUnaryOperator = (operator: Operator) => operator === 'pr'
