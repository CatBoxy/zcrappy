import { query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const mlProductUrlValidations = [
  query("url")
    .matches(
      /^https:\/\/.*\.mercadolibre\.com\.ar\/MLA-|https:\/\/www\.mercadolibre\.com\.ar\/.*\/p\/MLA/
    )
    .withMessage("URL does not match the required patterns"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
