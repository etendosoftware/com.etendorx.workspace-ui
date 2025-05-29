export const isValidNumber = (value: string): boolean => {
  const regex = /^-?\d+(\.\d+)?$/;
  return regex.test(value);
};

export const roundNumber = (num: number): number => {
  return Math.round(num);
};

export const validateNumber = (
  value: string,
  minValue: number | undefined,
  maxValue: number | undefined,
): { isValid: boolean; errorMessage: string; roundedValue?: number } => {
  if (!isValidNumber(value)) {
    return { isValid: false, errorMessage: 'Please enter a valid number' };
  }

  const num = Number.parseFloat(value);
  const roundedNum = roundNumber(num);

  if (roundedNum < 0) {
    return { isValid: false, errorMessage: 'Value must be non-negative' };
  }

  if (minValue !== undefined && roundedNum < minValue) {
    return { isValid: false, errorMessage: `Value must be at least ${minValue}` };
  }

  if (maxValue !== undefined && roundedNum > maxValue) {
    return { isValid: false, errorMessage: `Value must be at most ${maxValue}` };
  }

  if (Number.isNaN(num)) {
    return { isValid: false, errorMessage: 'Please enter a valid number' };
  }

  return { isValid: true, errorMessage: '', roundedValue: roundedNum };
};
