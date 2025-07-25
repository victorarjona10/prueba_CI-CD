import { Request, Response, NextFunction } from "express";
import { RequestExt } from "../middleware/session";
export declare function postUser(req: Request, res: Response): Promise<void>;
export declare function getAllUsers(req: Request, res: Response): Promise<void>;
export declare function getUserById(req: Request, res: Response): Promise<void>;
export declare function getUserByName(req: Request, res: Response): Promise<void>;
export declare function getUserByEmail(req: Request, res: Response): Promise<void>;
export declare function updateUserById(req: Request, res: Response): Promise<void>;
export declare function InactivateUserById(req: Request, res: Response): Promise<void>;
export declare function ativateUserById(req: Request, res: Response): Promise<void>;
export declare function getAllActiveUsers(req: RequestExt, res: Response): Promise<void>;
export declare function getUsersByFiltration(req: Request, res: Response): Promise<void>;
export declare function loginUser(req: Request, res: Response): Promise<void>;
export declare function refreshAccesToken(req: Request, res: Response): Promise<void>;
export declare function updateAvatar(req: Request, res: Response): Promise<void>;
export declare function Google(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare const googleCallback: (req: Request, res: Response) => Promise<void>;
export declare function addFollowed(req: Request, res: Response): Promise<void>;
export declare function UnfollowCompany(req: Request, res: Response): Promise<void>;
export declare function getFollowedCompanies(req: Request, res: Response): Promise<void>;
export declare function getAllCompanies(req: Request, res: Response): Promise<void>;
