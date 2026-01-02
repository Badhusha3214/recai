import jwt from 'jsonwebtoken';

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

// Token expiration time in seconds (24 hours)
export const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60;

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
