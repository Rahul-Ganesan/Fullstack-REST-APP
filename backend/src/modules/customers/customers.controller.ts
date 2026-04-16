import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import {
  createCustomerSchema,
  customerListQuerySchema,
  updateCustomerSchema,
} from "./customers.schema";
import * as customerService from "./customers.service";

const idSchema = z.coerce.number().int().positive();

export async function listCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = customerListQuerySchema.parse(req.query);
    const data = await customerService.listCustomers(query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function getCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = await customerService.getCustomer(id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createCustomerSchema.parse(req.body);
    const data = await customerService.createCustomer(input);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = idSchema.parse(req.params.id);
    const input = updateCustomerSchema.parse(req.body);
    const data = await customerService.updateCustomer(id, input);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = idSchema.parse(req.params.id);
    await customerService.deleteCustomer(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
