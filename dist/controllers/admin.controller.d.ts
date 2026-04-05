import { Request, Response } from 'express';
export declare const createBusiness: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBusinesses: (req: Request, res: Response) => Promise<void>;
export declare const configureWhatsApp: (req: Request, res: Response) => Promise<void>;
export declare const deleteBusiness: (req: Request, res: Response) => Promise<void>;
export declare const getGlobalUsers: (req: Request, res: Response) => Promise<void>;
