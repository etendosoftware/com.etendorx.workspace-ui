export interface AttributeSetConfig {
  id: string;
  isLot: boolean;
  isSerNo: boolean;
  isExpirationDate: boolean;
  isGuaranteeDate: boolean;
  description: string;
}

export interface CustomAttribute {
  id: string;
  name: string;
  isList: boolean;
  isMandatory: boolean;
  sequenceNumber: number;
  values: AttributeValueOption[];
}

export interface AttributeValueOption {
  id: string;
  name: string;
}

export interface AttributeSetInstanceFormData {
  lot: string;
  serialNo: string;
  expirationDate: string;
  guaranteeDate: string;
  description: string;
  customAttributes: Record<string, string>;
}
