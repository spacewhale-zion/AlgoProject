import jwt from 'jsonwebtoken';


export default function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!req.headers.authorization?.startsWith('Bearer') || !token) {
      return res.status(401).json({ msg: 'Invalid Authorization format' });
    }
    

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ msg: 'Invalid token' });
  }
}
