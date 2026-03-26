import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Token expiration time in seconds (7 days — sliding session)
export const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

export const generateToken = (user) => {
  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY_SECONDS }
  );
  
  // Calculate expiration timestamp
  const expiresAt = Date.now() + (TOKEN_EXPIRY_SECONDS * 1000);
  
  return { token, expiresAt };
};
