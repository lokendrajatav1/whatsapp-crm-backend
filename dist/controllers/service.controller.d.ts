import { Response } from 'express';
import { AuthRequest } from '../types/express';
export declare const getServices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createService: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateService: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteService: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
