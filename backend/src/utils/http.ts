export interface ApiErrorShape {
  status: number;
  message: string;
}

export class ApiError extends Error {
  status: number;

  constructor({ status, message }: ApiErrorShape) {
    super(message);
    this.status = status;
  }
}
