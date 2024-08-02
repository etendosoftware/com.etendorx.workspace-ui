export class SalesOrderColumnsDTO {

  public columnName: string;
  public defaultValue: string;
  public id: string;
  public name: string;
  public refColumnName
  public required: boolean
  public targetEntity: string
  public title: string
  // Example for DEMO: We can add more fields here from IndecentField or rewrite the whole class
  constructor(data: IndecentField) {
    this.columnName = data.columnName || '';
    this.defaultValue = data.defaultValue || '';
    this.id = data.id!;
    this.name = data.name;
    this.refColumnName = data.refColumnName!;
    this.required = data.required || false;
    this.targetEntity = data.targetEntity || data.refColumnName!; // Example for DEMO
    this.title = data.title!;
  }
}

export const mapSalesOrderColumnsResponseToDTO = (response: Models): SalesOrderColumnsDTO[] => { 
  const { fields } = response.window.viewProperties
  return fields.map((field) => new SalesOrderColumnsDTO(field));
}
