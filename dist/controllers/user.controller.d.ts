import { Response } from 'express';
import { AuthRequest } from '../types/express';
export declare const getAgents: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createAgent: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteAgent: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateAgent: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
