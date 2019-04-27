export default class HTTPError extends Error {
  public response: Response;
  public status: number;
  public constructor(response: Response) {
    super(response.statusText);
    Object.setPrototypeOf(this, new.target.prototype);

    this.response = response;
    this.status = response.status;
  }
}
