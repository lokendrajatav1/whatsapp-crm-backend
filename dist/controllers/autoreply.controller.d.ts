import { Response } from 'express';
import { AuthRequest } from '../types/express';
export declare const getRules: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createRule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateRule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteRule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
