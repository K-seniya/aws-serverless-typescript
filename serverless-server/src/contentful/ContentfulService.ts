import * as contentful from 'contentful';

export class ContentfulService {

  private cdaClient = contentful.createClient({
    accessToken: '7933193a20329017e10e10dc0ddde891e6bed27fd2a4ac76475721cadccc48a6',
    space: '7dx3vsencnik'
  });

  constructor() {}

  public async getProducts(): Promise<Content[]> {
    const contentTypes = await this.cdaClient.getContentTypes();
    const result: Content[] = [];
    contentTypes.items.forEach((contentType) => {
      const fieldNames = contentType.fields
        .map((field) => field.name)
        .sort();
      const type = {
        id: contentType.sys.id,
        name: contentType.name,
        fieldNames: fieldNames.join(', '),
        displayField: contentType.displayField
      };
      return result.push(type);
    });
    return Promise.resolve(result);
  }

  public async getEntry(contentTypeId: string): Promise<any[]> {
    const result: Product[] = [];
    try{
      const entries = await this.cdaClient.getEntries(Object.assign({
        content_type: contentTypeId
      }));
      entries.items.forEach(entry => {
          let field: any = entry.fields;
          result.push(
            {
              sysId: entry.sys.id,
              id: field.id,
              name: field.name,
              owner: field.owner,
              image: field.image.fields.file.url,
              title: field.image.fields.title
            }
          )
        }
      );
      return result;
    } catch (err) {
      console.log('inside service err: ' + err);
      return ["Error: " + err];
    }

  }
}

interface Content {
  id: string,
  name: string,
  fieldNames: string,
  displayField: string
}

interface Product {
  sysId: string,
  id: number,
  title: string,
  name: string,
  owner: string,
  image: string
}
