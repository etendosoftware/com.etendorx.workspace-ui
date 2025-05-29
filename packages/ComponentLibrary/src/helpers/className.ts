type ClassName = string | null | undefined;
type ClassNames = ClassName[];

export default function className(...args: ClassNames) {
  return args
    .reduce((acum: string, current) => {
      if (typeof current === 'string') {
        acum = `${acum} ${current}`;
      }

      return acum;
    }, '')
    .trim();
}
