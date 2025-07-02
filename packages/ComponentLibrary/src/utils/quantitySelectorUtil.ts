export const isValidNumber = (value: string): boolean => {
  const regex = /^-?\d+(\.\d+)?$/;
  return regex.test(value) && !value.endsWith(".");
};

export const validateNumber = (
  value: string,
  minValue: number | undefined,
  maxValue: number | undefined
): { isValid: boolean; errorMessage: string } => {
  if (!isValidNumber(value)) {
    return { isValid: false, errorMessage: "Please enter a valid number" };
  }

  const num = Number.parseFloat(value);

  if (num < 0) {
    return { isValid: false, errorMessage: "Value must be non-negative" };
  }

  if (minValue !== undefined && num < minValue) {
    return { isValid: false, errorMessage: `Value must be at least ${minValue}` };
  }

  if (maxValue !== undefined && num > maxValue) {
    return { isValid: false, errorMessage: `Value must be at most ${maxValue}` };
  }

  if (Number.isNaN(num)) {
    return { isValid: false, errorMessage: "Please enter a valid number" };
  }

  return { isValid: true, errorMessage: "" };
};
