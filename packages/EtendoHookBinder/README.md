## To generate the schema.json file, run the following command in the terminal:

```bash
quicktype data.json -l schema -o schema.json
```

## To generate the Models.ts file, run the following command in the terminal:

```bash
quicktype -s schema schema.json -o src/Models.ts
```
