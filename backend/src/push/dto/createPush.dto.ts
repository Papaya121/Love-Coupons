export class CreatePushDto {
  title: string;
  body: string;
  url: string;

  public constructor() {
    this.title = "";
    this.body = "";
    this.url = "/";
  }
}
