import { Response } from 'express';
import { AuthRequest } from '../types/express';
export declare const getStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTeamStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
