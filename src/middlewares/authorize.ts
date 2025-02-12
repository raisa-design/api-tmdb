import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';

interface UserPayload extends JwtPayload {
  id: string;
  role: string;
  email: string;
}

interface RequestWithUser extends Request {
  user?: UserPayload;
}

const authorize = (roles: string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user?.role || '')) {
      res.status(403).json({ mensagem: "Permissão negada" });
      return;
    }
    next();
  };
};

export default authorize;