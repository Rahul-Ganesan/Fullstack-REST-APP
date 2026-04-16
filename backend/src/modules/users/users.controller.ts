import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { inviteUserSchema, updateUserStatusSchema } from "./users.schema";
import * as usersService from "./users.service";

const idSchema = z.coerce.number().int().positive();

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await usersService.listUsers();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function inviteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const input = inviteUserSchema.parse(req.body);
    const data = await usersService.inviteUser(input);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = idSchema.parse(req.params.id);
    const input = updateUserStatusSchema.parse(req.body);
    const data = await usersService.updateUserStatus(userId, input.isActive);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function resetUserPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = idSchema.parse(req.params.id);
    const data = await usersService.adminInitiateReset(userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
